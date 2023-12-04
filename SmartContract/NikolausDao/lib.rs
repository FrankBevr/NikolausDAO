#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod nikolaus_dao {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;

    #[ink(storage)]
    pub struct NikolausDao {
        members: Vec<AccountId>,
        prompt: Vec<String>,
        gifts: Vec<String>,
        leader: AccountId,
    }

    impl NikolausDao {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                members: Vec::new(),
                prompt: Vec::new(),
                gifts: Vec::new(),
                leader: [0u8; 32].into(),
            }
        }

        #[ink(message)]
        pub fn add_member(&mut self) {
            self.members.push(self.env().caller())
        }

        #[ink(message)]
        pub fn add_prompt(&mut self, prompt: String) {
            self.prompt.push(prompt)
        }

        #[ink(message)]
        pub fn add_gift(&mut self, prompt: String) {
            self.gifts.push(prompt)
        }

        #[ink(message)]
        pub fn init_leader(&mut self) {
            if self.env().caller() == [0u8; 32].into() {
                self.leader = self.env().caller();
            }
        }

        #[ink(message)]
        pub fn change_leader(&mut self, new_leader: AccountId) {
            if self.env().caller() == self.leader {
                self.leader = new_leader;
            }
        }

        #[ink(message)]
        pub fn get_leader(&mut self) -> AccountId {
            self.leader
        }
    }
}
