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

    #[derive(scale::Encode, scale::Decode, Debug, PartialEq, Eq, Copy, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        // Emitted, when init_leader is called, but the leader is already initialized
        LeaderAlreadyInitialized,
        // Emitted, when a function requires the caller to be the leader, but the caller is not
        NotTheLeader,
        // Emitted, when trying to add a member, but the caller is already a member
        AlreadyAMember,
        // Emitted, when a function requires the caller to be a member, but the caller is not
        NotAMember,
        // Emitted, when a function requires the caller to be an accepted node, but the caller is not
        NotAnAcceptedNode,
        // Emitted, when a function requires the caller to be a pending node, but the caller is not
        NotAPendingNode,
        // Emitted, when trying to register as a node, but the caller has already been rejected
        RejectedNode,
        // Emitted, when trying to add a member, but not enough value was transferred
        NotEnoughTransferedValue,
        // Emitted, when trying to push a gift, but the caller has already pushed a gift to the given member
        AlreadyGifted,
        // Emitted, when trying to register as a node, but the caller is already a pending node
        AlreadyPendingNode,
        // Emitted, when trying to register as a node, but the caller is already an accepted node
        AlreadyAcceptedNode,
        // Emitted, when trying to push a gift to someone who is not a member
        RecipientNotAMember,
        // Emitted, when trying to vote for a gift, but the caller has already voted for the given gift
        AlreadyVoted,
        // Emitted, when trying to vote for a gift, but the node has not published a gift for the caller
        NoGiftForCaller,
        // Emitted, when trying to close the DAO, but someone has no gifts published for them
        NoGiftForSomebody,
        // Fatal Math error occured during DAO closing
        MathError,
        // Emitted, when trying to close the DAO, but it has already been closed
        AlreadyClosed,
    }

    #[ink(storage)]
    pub struct NikolausDao {
        members: Vec<AccountId>,
        member_delivery_addresses: Vec<String>,
        member_prompts: Vec<String>,
        member_deposits: Vec<Balance>,
        member_votes: Vec<AccountId>, // Holds the account id of the node that the member voted for
        member_did_vote: Vec<bool>,
        member_gifts_to_receive: Vec<Gift>,
        leader: AccountId,
        did_init_leader: bool,
        pending_nodes: Vec<AccountId>,
        accepted_nodes: Vec<AccountId>,
        rejected_nodes: Vec<AccountId>,
        generated_gifts: Vec<Gift>,
    }

    #[ink(event)]
    pub struct MemberAdded {
        member: AccountId,
        prompt: String,
    }

    impl NikolausDao {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                members: Vec::new(),
                member_delivery_addresses: Vec::new(),
                member_prompts: Vec::new(),
                member_deposits: Vec::new(),
                member_votes: Vec::new(),
                member_did_vote: Vec::new(),
                member_gifts_to_receive: Vec::new(),
                leader: [0u8; 32].into(),
                did_init_leader: false,
                pending_nodes: Vec::new(),
                accepted_nodes: Vec::new(),
                rejected_nodes: Vec::new(),
                generated_gifts: Vec::new(),
            }
        }

        #[ink(message, payable)]
        pub fn add_member(&mut self, delivery_address: String, prompt: String) -> Result<(), Error> {
            // Check if already a member
            if self.members.contains(&self.env().caller()) {
                return Err(Error::AlreadyAMember);
            }

            // Check if enough amount was transferred (10 units)
            if self.env().transferred_value() < 10 {
                return Err(Error::NotEnoughTransferedValue);
            }

            self.members.push(self.env().caller());
            self.member_delivery_addresses.push(delivery_address);
            self.member_prompts.push(prompt.clone());
            self.member_deposits.push(self.env().transferred_value());
            self.member_did_vote.push(false);
            self.member_votes.push([0u8; 32].into());

            self.env().emit_event(MemberAdded {
                member: self.env().caller(),
                prompt: prompt.clone(),
            });

            Ok(())
        }

        #[ink(message)]
        pub fn init_leader(&mut self) -> Result<(), Error> {
            if !self.did_init_leader {
                self.leader = self.env().caller();
                self.did_init_leader = true;
                Ok(())
            } else {
                Err(Error::LeaderAlreadyInitialized)
            }
        }

        #[ink(message)]
        pub fn change_leader(&mut self, new_leader: AccountId) -> Result<(), Error> {
            if self.env().caller() == self.leader {
                self.leader = new_leader;
                Ok(())
            } else {
                return Err(Error::NotTheLeader);
            }
        }
        
        #[ink(message)]
        pub fn register_node(&mut self) -> Result<(), Error> {
            // Check if caller is already a pending node
            if self.pending_nodes.contains(&self.env().caller()) {
                return Err(Error::AlreadyPendingNode);
            }

            // Check if caller is already an accepted node
            if self.accepted_nodes.contains(&self.env().caller()) {
                return Err(Error::AlreadyAcceptedNode);
            }

            // Check if caller is already a rejected node
            if self.rejected_nodes.contains(&self.env().caller()) {
                return Err(Error::RejectedNode);
            }

            self.pending_nodes.push(self.env().caller());

            Ok(())
        }

        #[ink(message)]
        pub fn accept_node(&mut self, node: AccountId) -> Result<(), Error> {
            if self.env().caller() == self.leader {
                // Check if node is a pending node
                if !self.pending_nodes.contains(&node) {
                    return Err(Error::NotAPendingNode);
                }

                self.accepted_nodes.push(node);
                self.pending_nodes.retain(|&x| x != node);

                Ok(())
            } else {
                Err(Error::NotTheLeader)
            }
        }

        #[ink(message)]
        pub fn reject_node(&mut self, node: AccountId) -> Result<(), Error> {
            if self.env().caller() == self.leader {
                // Check if node is a pending node
                if !self.pending_nodes.contains(&node) {
                    return Err(Error::NotAPendingNode);
                }

                self.rejected_nodes.push(node);
                self.pending_nodes.retain(|&x| x != node);

                Ok(())
            } else {
                Err(Error::NotTheLeader)
            }
        }

        #[ink(message)]
        pub fn push_node_gift(&mut self, for_member: AccountId, generated_model_cid: String, generated_message: String) -> Result<(), Error> {
            // Check if caller is an accepted node
            if self.accepted_nodes.contains(&self.env().caller()) {
                // Check if recipient is a member
                if !self.members.contains(&for_member) {
                    return Err(Error::RecipientNotAMember);
                }

                // Check if caller has already pushed a gift to the given member
                for gift in self.generated_gifts.iter() {
                    if gift.for_member_account_id == for_member && gift.by_node_account_id == self.env().caller() {
                        return Err(Error::AlreadyGifted);
                    }
                }

                self.generated_gifts.push(Gift {
                    for_member_account_id: for_member,
                    by_node_account_id: self.env().caller(),
                    model_cid: generated_model_cid,
                    message: generated_message,
                });

                Ok(())
            } else {
                Err(Error::NotAnAcceptedNode)
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
        
        #[ink(message)]
        pub fn get_member_gifts_to_receive(&self) -> Result<Vec<Gift>, Error> {
            // Check if caller is leader
            if self.env().caller() != self.leader {
                return Err(Error::NotTheLeader);
            }

            Ok(self.member_gifts_to_receive.clone())
        }

        #[ink(message)]
        pub fn get_deposit(&self) -> Result<Balance, Error> {
            // Check if caller is a member
            if !self.members.contains(&self.env().caller()) {
                return Err(Error::NotAMember);
            }

            let index = self.members.iter().position(|&x| x == self.env().caller()).unwrap();
            Ok(self.member_deposits[index])
        }
        
        #[ink(message)]
        pub fn vote_for_gift(&mut self, gift_creator: AccountId) -> Result<(), Error> {
            // Check if caller is a member
            if !self.members.contains(&self.env().caller()) {
                return Err(Error::NotAMember);
            }

            // Check if caller has already voted
            let index = self.members.iter().position(|&x| x == self.env().caller()).unwrap();

            if self.member_did_vote[index] {
                return Err(Error::AlreadyVoted);
            }

            // Check if gift creator is a node
            if !self.accepted_nodes.contains(&gift_creator) {
                return Err(Error::NotAnAcceptedNode);
            }

            // Check if gift creator has published a gift for the caller
            let mut gift_found = false;
            for gift in self.generated_gifts.iter() {
                if gift.for_member_account_id == self.env().caller() && gift.by_node_account_id == gift_creator {
                    gift_found = true;
                    break;
                }
            }

            if !gift_found {
                return Err(Error::NoGiftForCaller);
            }

            // Vote for gift
            self.member_votes[index] = gift_creator;
            self.member_did_vote[index] = true;

            Ok(())
        }

        #[ink(message)]
        pub fn december_6th(&mut self) -> Result<(), Error> {
            if self.env().caller() != self.leader {
                return Err(Error::NotTheLeader);
            }

            // Check if already closed
            if self.member_gifts_to_receive.len() > 0 {
                return Err(Error::AlreadyClosed);
            }

            let mut winning_gifts = Vec::new();

            // Find winning gifts
            // There are len(members) winning gifts, because each member can only vote for one gift
            for i in 0..self.members.len() {
                let member_winning_gift_creator = self.member_votes[i];
                let mut winning_gift_found = false;

                for gift in self.generated_gifts.iter() {
                    if gift.by_node_account_id == member_winning_gift_creator && gift.for_member_account_id == self.members[i] {
                        winning_gifts.push(gift.clone());
                        winning_gift_found = true;
                        break;
                    }
                }

                if !winning_gift_found {
                    return Err(Error::NoGiftForSomebody);
                }
            }

            // Populate member_gifts_to_receive
            // The [i] member will receive the [i+1] gift (last member receives first gift)
            for i in 0..self.members.len() {
                self.member_gifts_to_receive.push(winning_gifts[(i + 1) % self.members.len()].clone());
            }

            // Send 70% of each deposit to the leader, 30% to the winning node
            for i in 0..self.members.len() {
                let deposit = self.member_deposits[i];
                // Use checked multiplication and subtraction to prevent overflow
                let leader_share = deposit.checked_div(10).and_then(|d| d.checked_mul(7));
                let node_share = leader_share.and_then(|ls| deposit.checked_sub(ls));

                match (leader_share, node_share) {
                    (Some(ls), Some(ns)) => {
                        self.env().transfer(self.leader, ls).unwrap();
                        self.env().transfer(winning_gifts[i].by_node_account_id, ns).unwrap();
                    },
                    _ => return Err(Error::MathError), // Custom error for overflow
                }
            }

            Ok(())
        }
        
        #[ink(message)]
        pub fn reset_dao(&mut self) -> Result<(), Error> {
            
            if self.env().caller() != self.leader {
                return Err(Error::NotTheLeader);
            }

            self.members = Vec::new();
            self.member_delivery_addresses = Vec::new();
            self.member_prompts = Vec::new();
            self.member_deposits = Vec::new();
            self.member_votes = Vec::new();
            self.member_did_vote = Vec::new();
            self.member_gifts_to_receive = Vec::new();
            self.leader = [0u8; 32].into();
            self.did_init_leader = false;
            self.pending_nodes = Vec::new();
            self.accepted_nodes = Vec::new();
            self.rejected_nodes = Vec::new();
            self.generated_gifts = Vec::new();

            Ok(())

        }
    }
}
