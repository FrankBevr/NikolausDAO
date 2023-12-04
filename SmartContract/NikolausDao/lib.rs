#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod nikolaus_dao {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;

    #[derive(scale::Decode, scale::Encode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct Member {
        account_id: AccountId,
        delivery_address: String,
        prompt: String,
    }

    #[derive(scale::Decode, scale::Encode, Clone)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct Gift {
        for_member_account_id: AccountId,
        by_node_account_id: AccountId,
        model_cid: String,
        message: String,
    }

    #[ink(storage)]
    pub struct NikolausDao {
        members: Vec<AccountId>,
        member_delivery_addresses: Vec<String>,
        member_prompts: Vec<String>,
        leader: AccountId,
        did_init_leader: bool,
        pending_nodes: Vec<AccountId>,
        accepted_nodes: Vec<AccountId>,
        rejected_nodes: Vec<AccountId>,
        
        generated_gifts: Vec<Gift>,
    }

    impl NikolausDao {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                members: Vec::new(),
                member_delivery_addresses: Vec::new(),
                member_prompts: Vec::new(),
                leader: [0u8; 32].into(),
                did_init_leader: false,
                pending_nodes: Vec::new(),
                accepted_nodes: Vec::new(),
                rejected_nodes: Vec::new(),
                generated_gifts: Vec::new(),
            }
        }

        #[ink(message)]
        pub fn add_member(&mut self, delivery_address: String, prompt: String) {
            // Check if already a member
            if self.members.contains(&self.env().caller()) {
                return;
            }

            self.members.push(self.env().caller());
            self.member_delivery_addresses.push(delivery_address);
            self.member_prompts.push(prompt);
        }

        #[ink(message)]
        pub fn init_leader(&mut self) {
            if !self.did_init_leader {
                self.leader = self.env().caller();
                self.did_init_leader = true;
            }
        }

        #[ink(message)]
        pub fn change_leader(&mut self, new_leader: AccountId) {
            if self.env().caller() == self.leader {
                self.leader = new_leader;
            }
        }
        
        #[ink(message)]
        pub fn register_node(&mut self) {
            self.pending_nodes.push(self.env().caller())
        }

        #[ink(message)]
        pub fn accept_node(&mut self, node: AccountId) {
            if self.env().caller() == self.leader {
                self.accepted_nodes.push(node);
                self.pending_nodes.retain(|&x| x != node);
            }
        }

        #[ink(message)]
        pub fn reject_node(&mut self, node: AccountId) {
            if self.env().caller() == self.leader {
                self.rejected_nodes.push(node);
                self.pending_nodes.retain(|&x| x != node);
            }
        }

        #[ink(message)]
        pub fn push_node_gift(&mut self, for_member: AccountId, generated_model_cid: String, generated_message: String) {
            // Check if caller is an accepted node
            if self.accepted_nodes.contains(&self.env().caller()) {
                self.generated_gifts.push(Gift {
                    for_member_account_id: for_member,
                    by_node_account_id: self.env().caller(),
                    model_cid: generated_model_cid,
                    message: generated_message,
                });
            }
        }
        
        #[ink(message)]
        pub fn get_members(&self) -> Vec<Member> {
            let mut members = Vec::new();
            for i in 0..self.members.len() {
                members.push(Member {
                    account_id: self.members[i],
                    delivery_address: self.member_delivery_addresses[i].clone(),
                    prompt: self.member_prompts[i].clone(),
                });
            }
            members
        }

        #[ink(message)]
        pub fn get_leader(&self) -> AccountId {
            self.leader
        }

        #[ink(message)]
        pub fn get_pending_nodes(&self) -> Vec<AccountId> {
            self.pending_nodes.clone()
        }

        #[ink(message)]
        pub fn get_accepted_nodes(&self) -> Vec<AccountId> {
            self.accepted_nodes.clone()
        }

        #[ink(message)]
        pub fn get_rejected_nodes(&self) -> Vec<AccountId> {
            self.rejected_nodes.clone()
        }

        #[ink(message)]
        pub fn get_node_gifts(&self) -> Vec<Gift> {
            self.generated_gifts.clone()
        }
    }
}
