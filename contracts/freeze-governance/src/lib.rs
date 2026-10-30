//! Stellar-Guard: CAP-0077 Multisig Freeze Governance Contract
//!
//! Admins vote to freeze or unfreeze a (asset_code, issuer, target) tuple.
//! At quorum the contract emits a FREEZE or UNFREEZE event.

#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env, String, Vec,
};

pub const DEFAULT_QUORUM: u32 = 3;
/// Default Proposal TTL: ~7 days at ~5s/ledger = 120_960 ledgers
pub const DEFAULT_PROPOSAL_TTL: u32 = 120_960;
pub const ADMINS_KEY: soroban_sdk::Symbol = symbol_short!("ADMINS");
pub const QUORUM_KEY: soroban_sdk::Symbol = symbol_short!("QUORUM");
pub const TTL_KEY: soroban_sdk::Symbol = symbol_short!("PRP_TTL");
pub const PROPOSERS_KEY: soroban_sdk::Symbol = symbol_short!("PROPOSRS");
pub const PAUSED_KEY: soroban_sdk::Symbol = symbol_short!("PAUSED");

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    UnauthorizedFreezeAttempt = 2,
    AlreadyVoted = 3,
    ProposalNotFound = 4,
    AdminAlreadyExists = 5,
    AdminNotFound = 6,
    CannotRemoveLastAdmin = 7,
    BelowQuorumThreshold = 8,
    InvalidQuorum = 9,
    ContractPaused = 10,
    InvalidAssetCode = 11,
    SelfFreezeNotAllowed = 12,
    ProposalExpired = 13,
    UnauthorizedCaller = 14,
    InvalidParameter = 15,
}

#[contracttype]
#[derive(Clone)]
pub struct FreezeProposal {
    pub asset_code: String,
    pub issuer: Address,
    pub target: Address,
    pub votes: Vec<Address>,
    pub created_ledger: u32,
    pub evidence_hash: String,
    pub ttl: u32,
}

#[contract]
pub struct FreezeGovernance;

#[contractimpl]
impl FreezeGovernance {
    /// Initialize with a list of authorized admin addresses and optional quorum. One-time call.
    pub fn init(env: Env, admins: Vec<Address>, quorum: Option<u32>) -> Result<(), Error> {
        if env.storage().instance().has(&ADMINS_KEY) {
            return Err(Error::AlreadyInitialized);
        }
        let q = match quorum {
            Some(val) => {
                if val == 0 || (admins.len() > 0 && val > admins.len()) {
                    return Err(Error::InvalidQuorum);
                }
                val
            }
            None => {
                if admins.len() >= 3 {
                    3
                } else if admins.len() > 0 {
                    admins.len()
                } else {
                    DEFAULT_QUORUM
                }
            }
        };
        env.storage().instance().set(&ADMINS_KEY, &admins);
        env.storage().instance().set(&QUORUM_KEY, &q);
        env.storage().instance().set(&TTL_KEY, &DEFAULT_PROPOSAL_TTL);
        env.storage().instance().set(&PROPOSERS_KEY, &Vec::<Address>::new(&env));
        env.storage().instance().set(&PAUSED_KEY, &false);
        Ok(())
    }

    /// Check whether contract governance operations are paused.
    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&PAUSED_KEY).unwrap_or(false)
    }

    /// Pause all governance voting and proposals. Requires admin authority.
    pub fn pause(env: Env, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }
        env.storage().instance().set(&PAUSED_KEY, &true);
        env.events().publish((symbol_short!("STATE"), symbol_short!("PAUSE")), caller);
        Ok(())
    }

    /// Resume governance voting and proposals. Requires admin authority.
    pub fn unpause(env: Env, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }
        env.storage().instance().set(&PAUSED_KEY, &false);
        env.events().publish((symbol_short!("STATE"), symbol_short!("RESUME")), caller);
        Ok(())
    }

    /// Upgrade current contract WASM bytecode. Requires admin authority.
    pub fn upgrade(env: Env, caller: Address, new_wasm_hash: BytesN<32>) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        env.deployer().update_current_contract_wasm(new_wasm_hash.clone());
        env.events().publish((symbol_short!("CONTRACT"), symbol_short!("UPGRADE")), new_wasm_hash);
        Ok(())
    }

    /// Retrieve active quorum requirement.
    pub fn get_quorum(env: Env) -> u32 {
        env.storage().instance().get(&QUORUM_KEY).unwrap_or(DEFAULT_QUORUM)
    }

    /// Retrieve active default proposal TTL in ledgers.
    pub fn get_proposal_ttl(env: Env) -> u32 {
        env.storage().instance().get(&TTL_KEY).unwrap_or(DEFAULT_PROPOSAL_TTL)
    }

    /// Update proposal TTL parameter in ledgers. Requires admin authorization.
    pub fn set_proposal_ttl(env: Env, caller: Address, new_ttl: u32) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }
        if new_ttl == 0 {
            return Err(Error::InvalidParameter);
        }
        env.storage().instance().set(&TTL_KEY, &new_ttl);
        Ok(())
    }

    /// Update quorum requirement. Requires authorized admin caller.
    pub fn set_quorum(env: Env, caller: Address, new_quorum: u32) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }
        if new_quorum == 0 || new_quorum > admins.len() {
            return Err(Error::InvalidQuorum);
        }
        env.storage().instance().set(&QUORUM_KEY, &new_quorum);
        Ok(())
    }

    /// Add an authorized proposer (e.g. automated security monitor or compliance investigator).
    pub fn add_proposer(env: Env, caller: Address, new_proposer: Address) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let mut proposers: Vec<Address> = env
            .storage()
            .instance()
            .get(&PROPOSERS_KEY)
            .unwrap_or(Vec::new(&env));

        if !proposers.contains(&new_proposer) {
            proposers.push_back(new_proposer);
            env.storage().instance().set(&PROPOSERS_KEY, &proposers);
        }
        Ok(())
    }

    /// Remove an authorized proposer. Requires admin authorization.
    pub fn remove_proposer(env: Env, caller: Address, proposer_to_remove: Address) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let mut proposers: Vec<Address> = env
            .storage()
            .instance()
            .get(&PROPOSERS_KEY)
            .unwrap_or(Vec::new(&env));

        let mut found = false;
        let mut idx = 0u32;
        for i in 0..proposers.len() {
            if proposers.get(i).unwrap() == proposer_to_remove {
                found = true;
                idx = i;
                break;
            }
        }

        if found {
            proposers.remove(idx);
            env.storage().instance().set(&PROPOSERS_KEY, &proposers);
        }
        Ok(())
    }

    /// Verify if an address is an authorized proposer.
    pub fn is_proposer(env: Env, account: Address) -> bool {
        let proposers: Vec<Address> = env
            .storage()
            .instance()
            .get(&PROPOSERS_KEY)
            .unwrap_or(Vec::new(&env));
        proposers.contains(&account)
    }

    /// Propose a freeze action without casting an admin vote. Can be called by Admin or Proposer.
    pub fn propose_freeze(
        env: Env,
        caller: Address,
        asset_code: String,
        issuer: Address,
        target: Address,
        evidence_hash: String,
    ) -> Result<(), Error> {
        caller.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }

        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;
        let proposers: Vec<Address> = env
            .storage()
            .instance()
            .get(&PROPOSERS_KEY)
            .unwrap_or(Vec::new(&env));

        if !admins.contains(&caller) && !proposers.contains(&caller) {
            return Err(Error::UnauthorizedCaller);
        }

        let proposal_key = (symbol_short!("FRZ"), asset_code.clone(), target.clone());
        let current_ledger = env.ledger().sequence();
        let active_ttl = Self::get_proposal_ttl(env.clone());

        if !env.storage().temporary().has(&proposal_key) {
            let proposal = FreezeProposal {
                asset_code: asset_code.clone(),
                issuer: issuer.clone(),
                target: target.clone(),
                votes: Vec::new(&env),
                created_ledger: current_ledger,
                evidence_hash,
                ttl: active_ttl,
            };
            env.storage().temporary().set(&proposal_key, &proposal);
            env.storage()
                .temporary()
                .extend_ttl(&proposal_key, active_ttl, active_ttl);
            env.events().publish(
                (symbol_short!("PROPOSE"), asset_code, issuer, target),
                caller,
            );
        }
        Ok(())
    }

    /// Cast a vote to freeze `target`'s `asset_code` balance with attached evidence hash.
    pub fn vote_freeze_with_evidence(
        env: Env,
        caller: Address,
        asset_code: String,
        issuer: Address,
        target: Address,
        evidence_hash: String,
    ) -> Result<u32, Error> {
        caller.require_auth();
        Self::internal_vote_freeze(env, caller, asset_code, issuer, target, evidence_hash)
    }

    fn internal_vote_freeze(
        env: Env,
        caller: Address,
        asset_code: String,
        issuer: Address,
        target: Address,
        evidence_hash: String,
    ) -> Result<u32, Error> {
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let proposal_key = (symbol_short!("FRZ"), asset_code.clone(), target.clone());
        let current_ledger = env.ledger().sequence();
        let active_ttl = Self::get_proposal_ttl(env.clone());

        let mut proposal: FreezeProposal = match env.storage().temporary().get(&proposal_key) {
            Some(p) => {
                let mut p: FreezeProposal = p;
                if current_ledger > p.created_ledger.saturating_add(p.ttl) {
                    return Err(Error::ProposalExpired);
                }
                if p.evidence_hash.len() == 0 && evidence_hash.len() > 0 {
                    p.evidence_hash = evidence_hash;
                }
                p
            }
            None => FreezeProposal {
                asset_code: asset_code.clone(),
                issuer: issuer.clone(),
                target: target.clone(),
                votes: Vec::new(&env),
                created_ledger: current_ledger,
                evidence_hash,
                ttl: active_ttl,
            },
        };

        if proposal.votes.contains(&caller) {
            return Err(Error::AlreadyVoted);
        }

        proposal.votes.push_back(caller.clone());
        let vote_count = proposal.votes.len();
        let quorum: u32 = env.storage().instance().get(&QUORUM_KEY).unwrap_or(DEFAULT_QUORUM);

        env.events().publish(
            (symbol_short!("VOTE"), symbol_short!("FRZ"), target.clone()),
            (caller, vote_count),
        );

        if vote_count >= quorum {
            env.events().publish(
                (symbol_short!("FREEZE"), asset_code, issuer, target),
                vote_count,
            );
            env.storage().temporary().remove(&proposal_key);
        } else {
            env.storage().temporary().set(&proposal_key, &proposal);
            env.storage()
                .temporary()
                .extend_ttl(&proposal_key, proposal.ttl, proposal.ttl);
        }

        Ok(vote_count)
    }

    /// Cast a vote to freeze `target`'s `asset_code` balance.
    /// Returns the current vote count. Emits FREEZE event at quorum.
    pub fn vote_freeze(
        env: Env,
        caller: Address,
        asset_code: String,
        issuer: Address,
        target: Address,
    ) -> Result<u32, Error> {
        let empty_evidence = String::from_str(&env, "");
        Self::vote_freeze_with_evidence(env, caller, asset_code, issuer, target, empty_evidence)
    }

    /// Vote to freeze a batch of target addresses atomically.
    pub fn batch_vote_freeze(
        env: Env,
        caller: Address,
        asset_code: String,
        issuer: Address,
        targets: Vec<Address>,
        evidence_hash: String,
    ) -> Result<Vec<u32>, Error> {
        caller.require_auth();
        let mut results = Vec::new(&env);
        for i in 0..targets.len() {
            let target = targets.get(i).unwrap();
            let count = Self::internal_vote_freeze(
                env.clone(),
                caller.clone(),
                asset_code.clone(),
                issuer.clone(),
                target,
                evidence_hash.clone(),
            )?;
            results.push_back(count);
        }
        Ok(results)
    }

    /// Cast a vote to unfreeze `target`'s `asset_code` balance.
    /// Returns current vote count. Emits UNFREEZE event at quorum.
    pub fn vote_unfreeze(
        env: Env,
        caller: Address,
        asset_code: String,
        issuer: Address,
        target: Address,
    ) -> Result<u32, Error> {
        caller.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }

        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let proposal_key = (symbol_short!("UNFRZ"), asset_code.clone(), target.clone());
        let current_ledger = env.ledger().sequence();
        let active_ttl = Self::get_proposal_ttl(env.clone());

        let mut proposal: FreezeProposal = match env.storage().temporary().get(&proposal_key) {
            Some(p) => {
                let p: FreezeProposal = p;
                if current_ledger > p.created_ledger.saturating_add(p.ttl) {
                    return Err(Error::ProposalExpired);
                }
                p
            }
            None => FreezeProposal {
                asset_code: asset_code.clone(),
                issuer: issuer.clone(),
                target: target.clone(),
                votes: Vec::new(&env),
                created_ledger: current_ledger,
                evidence_hash: String::from_str(&env, ""),
                ttl: active_ttl,
            },
        };

        if proposal.votes.contains(&caller) {
            return Err(Error::AlreadyVoted);
        }

        proposal.votes.push_back(caller.clone());
        let vote_count = proposal.votes.len();
        let quorum: u32 = env.storage().instance().get(&QUORUM_KEY).unwrap_or(DEFAULT_QUORUM);

        env.events().publish(
            (symbol_short!("VOTE"), symbol_short!("FRZ"), target.clone()),
            (caller, vote_count),
        );

        if vote_count >= quorum {
            env.events().publish(
                (symbol_short!("UNFREEZ"), asset_code, issuer, target),
                vote_count,
            );
            env.storage().temporary().remove(&proposal_key);
        } else {
            env.storage().temporary().set(&proposal_key, &proposal);
            env.storage()
                .temporary()
                .extend_ttl(&proposal_key, proposal.ttl, proposal.ttl);
        }

        Ok(vote_count)
    }

    /// Revoke a previously cast vote for a freeze proposal.
    pub fn revoke_vote(
        env: Env,
        caller: Address,
        asset_code: String,
        target: Address,
    ) -> Result<(), Error> {
        caller.require_auth();

        let proposal_key = (symbol_short!("FRZ"), asset_code, target.clone());
        let mut proposal: FreezeProposal = env
            .storage()
            .temporary()
            .get(&proposal_key)
            .ok_or(Error::ProposalNotFound)?;

        let mut found = false;
        let mut idx = 0u32;
        for i in 0..proposal.votes.len() {
            if proposal.votes.get(i).unwrap() == caller {
                found = true;
                idx = i;
                break;
            }
        }

        if !found {
            return Err(Error::ProposalNotFound);
        }

        proposal.votes.remove(idx);
        env.storage().temporary().set(&proposal_key, &proposal);
        env.storage()
            .temporary()
            .extend_ttl(&proposal_key, proposal.ttl, proposal.ttl);
        env.events().publish(
            (symbol_short!("REVOKE"), symbol_short!("FRZ"), target),
            caller,
        );
        Ok(())
    }

    /// Prune an expired proposal to reclaim storage state.
    pub fn prune_expired(
        env: Env,
        caller: Address,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> Result<(), Error> {
        caller.require_auth();
        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code, target);
        let proposal: FreezeProposal = env
            .storage()
            .temporary()
            .get(&proposal_key)
            .ok_or(Error::ProposalNotFound)?;

        let current_ledger = env.ledger().sequence();
        if current_ledger <= proposal.created_ledger.saturating_add(proposal.ttl) {
            return Err(Error::InvalidParameter);
        }

        env.storage().temporary().remove(&proposal_key);
        Ok(())
    }

    /// Return current vote count for a freeze proposal (0 if none or expired).
    pub fn get_votes(env: Env, asset_code: String, target: Address) -> u32 {
        let key = (symbol_short!("FRZ"), asset_code, target);
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&key);
        proposal.map(|p| p.votes.len()).unwrap_or(0)
    }

    /// Return attached evidence metadata hash if present.
    pub fn get_proposal_evidence(env: Env, asset_code: String, target: Address) -> String {
        let key = (symbol_short!("FRZ"), asset_code, target);
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&key);
        proposal.map(|p| p.evidence_hash).unwrap_or(String::from_str(&env, ""))
    }

    /// Return current vote count for an unfreeze proposal (0 if none or expired).
    pub fn get_unfreeze_votes(env: Env, asset_code: String, target: Address) -> u32 {
        let key = (symbol_short!("UNFRZ"), asset_code, target);
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&key);
        proposal.map(|p| p.votes.len()).unwrap_or(0)
    }

    /// Add a new admin. Requires caller to be an existing admin.
    pub fn add_admin(env: Env, caller: Address, new_admin: Address) -> Result<(), Error> {
        caller.require_auth();
        let mut admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }
        if admins.contains(&new_admin) {
            return Err(Error::AdminAlreadyExists);
        }
        admins.push_back(new_admin.clone());
        env.storage().instance().set(&ADMINS_KEY, &admins);
        env.events().publish((symbol_short!("ADMIN"), symbol_short!("ADD")), new_admin);
        Ok(())
    }

    /// Remove an admin. Requires caller to be an existing admin.
    /// Cannot remove the last admin.
    pub fn remove_admin(env: Env, caller: Address, admin_to_remove: Address) -> Result<(), Error> {
        caller.require_auth();
        let mut admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }
        if admins.len() <= 1 {
            return Err(Error::CannotRemoveLastAdmin);
        }

        let mut found = false;
        let mut idx = 0u32;
        for i in 0..admins.len() {
            if admins.get(i).unwrap() == admin_to_remove {
                found = true;
                idx = i;
                break;
            }
        }

        if !found {
            return Err(Error::AdminNotFound);
        }

        admins.remove(idx);
        env.storage().instance().set(&ADMINS_KEY, &admins);
        env.events().publish((symbol_short!("ADMIN"), symbol_short!("REMOVE")), admin_to_remove);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, Env, String};

    fn asset(env: &Env) -> String {
        String::from_str(env, "RWAUSD")
    }

    #[test]
    fn test_vote_and_quorum() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2, a3) = (
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        );
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone(), a3.clone()]), &Some(3));
        env.mock_all_auths();

        assert_eq!(client.get_quorum(), 3);
        assert_eq!(client.vote_freeze(&a1, &asset(&env), &issuer, &target), 1);
        assert_eq!(client.vote_freeze(&a2, &asset(&env), &issuer, &target), 2);
        assert_eq!(client.vote_freeze(&a3, &asset(&env), &issuer, &target), 3);
        assert_eq!(client.get_votes(&asset(&env), &target), 0);
    }

    #[test]
    fn test_proposer_rbac() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let admin = Address::generate(&env);
        let bot = Address::generate(&env);
        let stranger = Address::generate(&env);
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [admin.clone()]), &Some(1));
        env.mock_all_auths();

        // Stranger cannot propose
        let err = client.try_propose_freeze(&stranger, &asset(&env), &issuer, &target, &String::from_str(&env, ""));
        assert_eq!(err, Err(Ok(Error::UnauthorizedCaller)));

        // Admin adds bot as proposer
        client.add_proposer(&admin, &bot);
        assert!(client.is_proposer(&bot));

        // Bot can propose
        client.propose_freeze(&bot, &asset(&env), &issuer, &target, &String::from_str(&env, "aml_alert_101"));
        assert_eq!(client.get_votes(&asset(&env), &target), 0);
        assert_eq!(client.get_proposal_evidence(&asset(&env), &target), String::from_str(&env, "aml_alert_101"));
    }

    #[test]
    fn test_batch_vote_freeze() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let t1 = Address::generate(&env);
        let t2 = Address::generate(&env);
        let t3 = Address::generate(&env);

        client.init(&Vec::from_array(&env, [admin.clone()]), &Some(1));
        env.mock_all_auths();

        let targets = Vec::from_array(&env, [t1.clone(), t2.clone(), t3.clone()]);
        let counts = client.batch_vote_freeze(&admin, &asset(&env), &issuer, &targets, &String::from_str(&env, "sybil_ring"));
        assert_eq!(counts.len(), 3);
        assert_eq!(counts.get(0).unwrap(), 1);
        assert_eq!(counts.get(1).unwrap(), 1);
        assert_eq!(counts.get(2).unwrap(), 1);
    }

    #[test]
    fn test_upgrade_contract_authorization() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let admin = Address::generate(&env);
        let stranger = Address::generate(&env);
        let dummy_wasm_hash = BytesN::from_array(&env, &[1u8; 32]);

        client.init(&Vec::from_array(&env, [admin.clone()]), &Some(1));
        env.mock_all_auths();

        // Stranger cannot upgrade contract
        let err = client.try_upgrade(&stranger, &dummy_wasm_hash);
        assert_eq!(err, Err(Ok(Error::UnauthorizedFreezeAttempt)));
    }

    #[test]
    fn test_pause_circuit_breaker() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [admin.clone()]), &Some(1));
        env.mock_all_auths();

        assert_eq!(client.is_paused(), false);
        client.pause(&admin);
        assert_eq!(client.is_paused(), true);

        // Voting while paused must fail with ContractPaused error
        let err = client.try_vote_freeze(&admin, &asset(&env), &issuer, &target);
        assert_eq!(err, Err(Ok(Error::ContractPaused)));

        // Unpausing restores voting capability
        client.unpause(&admin);
        assert_eq!(client.is_paused(), false);
        let res = client.vote_freeze(&admin, &asset(&env), &issuer, &target);
        assert_eq!(res, 1);
    }

    #[test]
    fn test_configurable_ttl() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));
        env.mock_all_auths();

        assert_eq!(client.get_proposal_ttl(), DEFAULT_PROPOSAL_TTL);
        client.set_proposal_ttl(&a1, &5000);
        assert_eq!(client.get_proposal_ttl(), 5000);
    }

    #[test]
    fn test_proposal_with_evidence_hash() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);
        let cid_hash = String::from_str(&env, "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        client.vote_freeze_with_evidence(&a1, &asset(&env), &issuer, &target, &cid_hash);
        assert_eq!(client.get_votes(&asset(&env), &target), 1);
        assert_eq!(client.get_proposal_evidence(&asset(&env), &target), cid_hash);
    }

    #[test]
    fn test_unfreeze_flow() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2, a3) = (
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        );
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone(), a3.clone()]), &Some(2));
        env.mock_all_auths();

        assert_eq!(client.vote_unfreeze(&a1, &asset(&env), &issuer, &target), 1);
        assert_eq!(client.get_unfreeze_votes(&asset(&env), &target), 1);
        assert_eq!(client.vote_unfreeze(&a2, &asset(&env), &issuer, &target), 2);
        assert_eq!(client.get_unfreeze_votes(&asset(&env), &target), 0);
    }

    #[test]
    fn test_proposal_expiration_and_pruning() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.get_votes(&asset(&env), &target), 1);

        env.ledger().with_mut(|li| {
            li.sequence_number += DEFAULT_PROPOSAL_TTL + 10;
        });

        let res = client.try_vote_freeze(&a2, &asset(&env), &issuer, &target);
        assert_eq!(res, Err(Ok(Error::ProposalExpired)));

        client.prune_expired(&a1, &asset(&env), &target, &false);
        assert_eq!(client.get_votes(&asset(&env), &target), 0);
    }

    #[test]
    fn test_dynamic_quorum_update() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2, a3) = (
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        );

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone(), a3.clone()]), &Some(3));
        env.mock_all_auths();

        assert_eq!(client.get_quorum(), 3);
        client.set_quorum(&a1, &2);
        assert_eq!(client.get_quorum(), 2);

        let err = client.try_set_quorum(&a1, &5);
        assert_eq!(err, Err(Ok(Error::InvalidQuorum)));
    }

    #[test]
    fn test_revoke_vote() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2, a3) = (
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        );
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone(), a3.clone()]), &Some(3));
        env.mock_all_auths();

        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        client.vote_freeze(&a2, &asset(&env), &issuer, &target);
        assert_eq!(client.get_votes(&asset(&env), &target), 2);

        client.revoke_vote(&a1, &asset(&env), &target);
        assert_eq!(client.get_votes(&asset(&env), &target), 1);
    }

    #[test]
    fn test_add_remove_admin() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        let a2 = Address::generate(&env);
        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));
        env.mock_all_auths();

        client.add_admin(&a1, &a2);
        client.remove_admin(&a1, &a2);
    }

    #[test]
    fn test_unauthorized_vote() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        let stranger = Address::generate(&env);
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));
        env.mock_all_auths();
        let res = client.try_vote_freeze(&stranger, &asset(&env), &issuer, &target);
        assert_eq!(res, Err(Ok(Error::UnauthorizedFreezeAttempt)));
    }

    #[test]
    fn test_get_votes_empty() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);
        client.init(&Vec::new(&env), &None);
        let target = Address::generate(&env);
        assert_eq!(client.get_votes(&asset(&env), &target), 0);
    }
}
