#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod nikolaus_dao {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;

    #[derive(Default)]
    #[ink(storage)]
    pub struct NikolausDao {
        prompt: Vec<String>,
        members: Vec<AccountId>,
        gifts: Vec<String>,
    }

    impl NikolausDao {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self::default()
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
    }
}
