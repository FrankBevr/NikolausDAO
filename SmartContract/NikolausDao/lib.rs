#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod nikolaus_dao {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;

    #[ink(storage)]
    pub struct NikolausDao {
        prompt: Vec<String>,
        members: Vec<AccountId>,
        gifts: Vec<String>,
        leader: AccountId,
    }

    impl NikolausDao {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                prompt: vec![],
                members: vec![],
                gifts: vec![],
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
        pub fn add_leader(&mut self) {
            self.leader = self.env().caller();
        }
    }
}
