//! Stellar-Guard: CAP-0077 Multisig Freeze Governance Contract
//!
//! Admins vote to freeze or unfreeze a (asset_code, issuer, target) tuple.
//! At quorum the contract emits a FREEZE or UNFREEZE event.

#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env, String, Vec,
};

pub mod cap0077;

pub const DEFAULT_QUORUM: u32 = 3;
pub const MAX_ADMINS: u32 = 20;
/// Default Proposal TTL: ~7 days at ~5s/ledger = 120_960 ledgers
pub const DEFAULT_PROPOSAL_TTL: u32 = 120_960;
pub const ADMINS_KEY: soroban_sdk::Symbol = symbol_short!("ADMINS");
pub const QUORUM_KEY: soroban_sdk::Symbol = symbol_short!("QUORUM");
pub const TTL_KEY: soroban_sdk::Symbol = symbol_short!("PRP_TTL");
pub const PROPOSERS_KEY: soroban_sdk::Symbol = symbol_short!("PROPOSRS");
pub const PAUSED_KEY: soroban_sdk::Symbol = symbol_short!("PAUSED");
pub const ACTION_SEQ_KEY: soroban_sdk::Symbol = symbol_short!("ACT_SEQ");
pub const WHITELIST_KEY: soroban_sdk::Symbol = symbol_short!("WHTLIST");
pub const AUDITORS_KEY: soroban_sdk::Symbol = symbol_short!("AUDITORS");
pub const COOLDOWN_KEY: soroban_sdk::Symbol = symbol_short!("COOLDOWN");
pub const TIMELOCK_KEY: soroban_sdk::Symbol = symbol_short!("TIMELOCK");
pub const ADMIN_CHANGE_CNT_KEY: soroban_sdk::Symbol = symbol_short!("ADM_CHG");
pub const ACTIVE_PROPOSALS_KEY: soroban_sdk::Symbol = symbol_short!("ACT_PRP");
pub const FROZEN_REGISTRY_KEY: soroban_sdk::Symbol = symbol_short!("FRZ_REG");

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
    CooldownActive = 16,
    TimelockActive = 17,
    TimelockNotMet = 18,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ProposalStatus {
    None = 0,
    Active = 1,
    Expired = 2,
    Queued = 3,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ReasonCode {
    Unspecified = 0,
    OfacSanctions = 1,
    CompromisedKey = 2,
    CourtOrder = 3,
    AmlSuspiciousActivity = 4,
    ContractExploit = 5,
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
    pub negative_votes: Vec<Address>,
    pub created_timestamp: u64,
    pub reason_code: u32,
    pub timelock_until: u64,
    pub discussion_uri: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GovernanceInfo {
    pub admin_count: u32,
    pub quorum: u32,
    pub proposal_ttl: u32,
    pub is_paused: bool,
    pub action_sequence: u64,
    pub admin_change_count: u64,
    pub active_proposal_count: u32,
    pub frozen_accounts_count: u32,
    pub timelock_delay: u64,
    pub proposal_cooldown: u64,
    pub proposers_count: u32,
    pub auditors_count: u32,
    pub whitelist_count: u32,
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
        if admins.len() == 0 {
            return Err(Error::InvalidParameter);
        }
        let contract_addr = env.current_contract_address();
        for i in 0..admins.len() {
            let a = admins.get(i).unwrap();
            if a == contract_addr {
                return Err(Error::InvalidParameter);
            }
            for j in (i + 1)..admins.len() {
                if a == admins.get(j).unwrap() {
                    return Err(Error::InvalidParameter);
                }
            }
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
        env.storage().instance().set(&ACTION_SEQ_KEY, &0u64);
        env.storage().instance().set(&WHITELIST_KEY, &Vec::<Address>::new(&env));
        env.storage().instance().set(&AUDITORS_KEY, &Vec::<Address>::new(&env));
        env.storage().instance().set(&COOLDOWN_KEY, &0u64);
        env.storage().instance().set(&TIMELOCK_KEY, &0u64);
        env.storage().instance().set(&ADMIN_CHANGE_CNT_KEY, &0u64);
        env.storage().instance().set(&ACTIVE_PROPOSALS_KEY, &Vec::<(String, Address, bool)>::new(&env));
        env.storage().instance().set(&FROZEN_REGISTRY_KEY, &Vec::<(String, Address)>::new(&env));
        Ok(())
    }

    fn mark_account_frozen(env: &Env, asset_code: &String, target: &Address) {
        let mut list: Vec<(String, Address)> = env
            .storage()
            .instance()
            .get(&FROZEN_REGISTRY_KEY)
            .unwrap_or(Vec::new(env));
        let item = (asset_code.clone(), target.clone());
        if !list.contains(&item) {
            list.push_back(item);
            env.storage().instance().set(&FROZEN_REGISTRY_KEY, &list);
        }
    }

    fn mark_account_unfrozen(env: &Env, asset_code: &String, target: &Address) {
        let mut list: Vec<(String, Address)> = env
            .storage()
            .instance()
            .get(&FROZEN_REGISTRY_KEY)
            .unwrap_or(Vec::new(env));
        let item = (asset_code.clone(), target.clone());
        let mut idx = 0u32;
        let mut found = false;
        for i in 0..list.len() {
            if list.get(i).unwrap() == item {
                idx = i;
                found = true;
                break;
            }
        }
        if found {
            list.remove(idx);
            env.storage().instance().set(&FROZEN_REGISTRY_KEY, &list);
        }
    }

    /// Check if a specific account is currently registered as frozen for an asset.
    pub fn is_account_frozen(env: Env, asset_code: String, target: Address) -> bool {
        let list: Vec<(String, Address)> = env
            .storage()
            .instance()
            .get(&FROZEN_REGISTRY_KEY)
            .unwrap_or(Vec::new(&env));
        let item = (asset_code, target);
        list.contains(&item)
    }

    /// Return total number of accounts currently registered as frozen.
    pub fn get_frozen_accounts_count(env: Env) -> u32 {
        let list: Vec<(String, Address)> = env
            .storage()
            .instance()
            .get(&FROZEN_REGISTRY_KEY)
            .unwrap_or(Vec::new(&env));
        list.len()
    }

    /// Return paginated list of registered frozen accounts (asset_code, target).
    pub fn get_frozen_accounts(
        env: Env,
        start_index: u32,
        limit: u32,
    ) -> Vec<(String, Address)> {
        let list: Vec<(String, Address)> = env
            .storage()
            .instance()
            .get(&FROZEN_REGISTRY_KEY)
            .unwrap_or(Vec::new(&env));
        let mut result = Vec::new(&env);
        let total = list.len();
        if start_index >= total || limit == 0 {
            return result;
        }
        let end = (start_index.saturating_add(limit)).min(total);
        for i in start_index..end {
            result.push_back(list.get(i).unwrap());
        }
        result
    }

    fn add_active_proposal_key(env: &Env, asset_code: &String, target: &Address, is_unfreeze: bool) {
        let mut list: Vec<(String, Address, bool)> = env
            .storage()
            .instance()
            .get(&ACTIVE_PROPOSALS_KEY)
            .unwrap_or(Vec::new(env));
        let item = (asset_code.clone(), target.clone(), is_unfreeze);
        if !list.contains(&item) {
            list.push_back(item);
            env.storage().instance().set(&ACTIVE_PROPOSALS_KEY, &list);
        }
    }

    fn remove_active_proposal_key(env: &Env, asset_code: &String, target: &Address, is_unfreeze: bool) {
        let mut list: Vec<(String, Address, bool)> = env
            .storage()
            .instance()
            .get(&ACTIVE_PROPOSALS_KEY)
            .unwrap_or(Vec::new(env));
        let item = (asset_code.clone(), target.clone(), is_unfreeze);
        let mut idx = 0u32;
        let mut found = false;
        for i in 0..list.len() {
            if list.get(i).unwrap() == item {
                idx = i;
                found = true;
                break;
            }
        }
        if found {
            list.remove(idx);
            env.storage().instance().set(&ACTIVE_PROPOSALS_KEY, &list);
        }
    }

    /// Return total active proposals recorded in the on-chain index.
    pub fn get_active_proposal_count(env: Env) -> u32 {
        let list: Vec<(String, Address, bool)> = env
            .storage()
            .instance()
            .get(&ACTIVE_PROPOSALS_KEY)
            .unwrap_or(Vec::new(&env));
        list.len()
    }

    /// Return paginated active proposals (asset_code, target, is_unfreeze).
    pub fn get_active_proposals(
        env: Env,
        start_index: u32,
        limit: u32,
    ) -> Vec<(String, Address, bool)> {
        let list: Vec<(String, Address, bool)> = env
            .storage()
            .instance()
            .get(&ACTIVE_PROPOSALS_KEY)
            .unwrap_or(Vec::new(&env));
        let mut result = Vec::new(&env);
        let total = list.len();
        if start_index >= total || limit == 0 {
            return result;
        }
        let end = (start_index.saturating_add(limit)).min(total);
        for i in start_index..end {
            result.push_back(list.get(i).unwrap());
        }
        result
    }

    fn increment_admin_change_count(env: &Env) -> u64 {
        let current: u64 = env.storage().instance().get(&ADMIN_CHANGE_CNT_KEY).unwrap_or(0);
        let next = current.saturating_add(1);
        env.storage().instance().set(&ADMIN_CHANGE_CNT_KEY, &next);
        next
    }

    /// Return total historical admin rotations (additions and removals).
    pub fn get_admin_change_count(env: Env) -> u64 {
        env.storage().instance().get(&ADMIN_CHANGE_CNT_KEY).unwrap_or(0)
    }

    /// Return consolidated governance operational metrics in a single lightweight query.
    pub fn get_governance_info(env: Env) -> GovernanceInfo {
        GovernanceInfo {
            admin_count: Self::get_admin_count(env.clone()),
            quorum: Self::get_quorum(env.clone()),
            proposal_ttl: Self::get_proposal_ttl(env.clone()),
            is_paused: Self::is_paused(env.clone()),
            action_sequence: Self::get_action_sequence(env.clone()),
            admin_change_count: Self::get_admin_change_count(env.clone()),
            active_proposal_count: Self::get_active_proposal_count(env.clone()),
            frozen_accounts_count: Self::get_frozen_accounts_count(env.clone()),
            timelock_delay: Self::get_timelock_delay(env.clone()),
            proposal_cooldown: Self::get_proposal_cooldown(env.clone()),
            proposers_count: env.storage().instance().get::<_, Vec<Address>>(&PROPOSERS_KEY).map(|v| v.len()).unwrap_or(0),
            auditors_count: Self::get_auditors(env.clone()).len(),
            whitelist_count: env.storage().instance().get::<_, Vec<Address>>(&WHITELIST_KEY).map(|v| v.len()).unwrap_or(0),
        }
    }

    /// Return the execution timelock delay in seconds.
    pub fn get_timelock_delay(env: Env) -> u64 {
        env.storage().instance().get(&TIMELOCK_KEY).unwrap_or(0)
    }

    /// Set execution timelock delay parameter in seconds. Requires admin authorization.
    pub fn set_timelock_delay(env: Env, caller: Address, delay_seconds: u64) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }
        env.storage().instance().set(&TIMELOCK_KEY, &delay_seconds);
        env.events().publish((symbol_short!("GOV"), symbol_short!("TMLOCK")), delay_seconds);
        Ok(())
    }

    /// Return the active proposal cooldown window in seconds.
    pub fn get_proposal_cooldown(env: Env) -> u64 {
        env.storage().instance().get(&COOLDOWN_KEY).unwrap_or(0)
    }

    /// Set minimum cooldown window in seconds between proposals on the same target. Requires admin.
    pub fn set_proposal_cooldown(env: Env, caller: Address, seconds: u64) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }
        env.storage().instance().set(&COOLDOWN_KEY, &seconds);
        env.events().publish((symbol_short!("GOV"), symbol_short!("COOLDWN")), seconds);
        Ok(())
    }

    /// Retrieve the timestamp of the last proposal initiated for a target address.
    pub fn get_last_proposal_timestamp(env: Env, target: Address) -> u64 {
        let key = (symbol_short!("LP_TS"), target);
        env.storage().temporary().get(&key).unwrap_or(0)
    }

    fn check_and_update_cooldown(env: &Env, target: &Address) -> Result<(), Error> {
        let cooldown = Self::get_proposal_cooldown(env.clone());
        if cooldown > 0 {
            let last_ts = Self::get_last_proposal_timestamp(env.clone(), target.clone());
            if last_ts > 0 && env.ledger().timestamp() < last_ts.saturating_add(cooldown) {
                return Err(Error::CooldownActive);
            }
        }
        let lp_key = (symbol_short!("LP_TS"), target.clone());
        env.storage().temporary().set(&lp_key, &env.ledger().timestamp());
        Ok(())
    }

    fn next_action_sequence(env: &Env) -> u64 {
        let current: u64 = env.storage().instance().get(&ACTION_SEQ_KEY).unwrap_or(0);
        let next = current.saturating_add(1);
        env.storage().instance().set(&ACTION_SEQ_KEY, &next);
        next
    }

    /// Return the latest governance action sequence number.
    pub fn get_action_sequence(env: Env) -> u64 {
        env.storage().instance().get(&ACTION_SEQ_KEY).unwrap_or(0)
    }

    /// Validate asset code adheres to Stellar standard specifications (1-12 alphanumeric characters).
    fn validate_asset_code(asset_code: &String) -> Result<(), Error> {
        let len = asset_code.len();
        if len == 0 || len > 12 {
            return Err(Error::InvalidAssetCode);
        }
        let mut buf = [0u8; 12];
        let slice = &mut buf[..len as usize];
        asset_code.copy_into_slice(slice);
        for &b in slice.iter() {
            if !b.is_ascii_alphanumeric() {
                return Err(Error::InvalidAssetCode);
            }
        }
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

    /// Keep-alive helper to extend contract instance storage TTL. Callable by any keeper.
    pub fn extend_instance_ttl(env: Env, threshold: u32, extend_to: u32) {
        env.storage().instance().extend_ttl(threshold, extend_to);
    }

    /// Upgrade current contract WASM bytecode. Requires admin authority.
    pub fn upgrade(env: Env, caller: Address, new_wasm_hash: BytesN<32>) -> Result<(), Error> {
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

        env.deployer().update_current_contract_wasm(new_wasm_hash.clone());
        env.events().publish((symbol_short!("CONTRACT"), symbol_short!("UPGRADE")), new_wasm_hash);
        Ok(())
    }

    /// Return the list of designated regulatory auditors.
    pub fn get_auditors(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&AUDITORS_KEY)
            .unwrap_or(Vec::new(&env))
    }

    /// Check if an account is a registered auditor.
    pub fn is_auditor(env: Env, account: Address) -> bool {
        let list: Vec<Address> = env
            .storage()
            .instance()
            .get(&AUDITORS_KEY)
            .unwrap_or(Vec::new(&env));
        list.contains(&account)
    }

    /// Add an auditor view key. Requires admin.
    pub fn add_auditor(env: Env, caller: Address, new_auditor: Address) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let mut list: Vec<Address> = env
            .storage()
            .instance()
            .get(&AUDITORS_KEY)
            .unwrap_or(Vec::new(&env));

        if !list.contains(&new_auditor) {
            list.push_back(new_auditor.clone());
            env.storage().instance().set(&AUDITORS_KEY, &list);
            env.events().publish((symbol_short!("AUDITOR"), symbol_short!("ADD")), new_auditor);
        }
        Ok(())
    }

    /// Remove a registered auditor. Requires admin.
    pub fn remove_auditor(env: Env, caller: Address, auditor_to_remove: Address) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let mut list: Vec<Address> = env
            .storage()
            .instance()
            .get(&AUDITORS_KEY)
            .unwrap_or(Vec::new(&env));

        let mut found = false;
        let mut idx = 0u32;
        for i in 0..list.len() {
            if list.get(i).unwrap() == auditor_to_remove {
                found = true;
                idx = i;
                break;
            }
        }

        if found {
            list.remove(idx);
            env.storage().instance().set(&AUDITORS_KEY, &list);
            env.events().publish((symbol_short!("AUDITOR"), symbol_short!("REMOVE")), auditor_to_remove);
        }
        Ok(())
    }

    /// Return the list of whitelisted addresses immune from freeze actions.
    pub fn get_whitelist(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&WHITELIST_KEY)
            .unwrap_or(Vec::new(&env))
    }

    /// Check if an account is whitelisted.
    pub fn is_whitelisted(env: Env, account: Address) -> bool {
        let list: Vec<Address> = env
            .storage()
            .instance()
            .get(&WHITELIST_KEY)
            .unwrap_or(Vec::new(&env));
        list.contains(&account)
    }

    /// Add an infrastructure or custodian address to the whitelist. Requires admin.
    pub fn add_whitelist(env: Env, caller: Address, account: Address) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let mut list: Vec<Address> = env
            .storage()
            .instance()
            .get(&WHITELIST_KEY)
            .unwrap_or(Vec::new(&env));

        if !list.contains(&account) {
            list.push_back(account.clone());
            env.storage().instance().set(&WHITELIST_KEY, &list);
            env.events().publish((symbol_short!("WHTLIST"), symbol_short!("ADD")), account);
        }
        Ok(())
    }

    /// Remove an address from the whitelist. Requires admin.
    pub fn remove_whitelist(env: Env, caller: Address, account: Address) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let mut list: Vec<Address> = env
            .storage()
            .instance()
            .get(&WHITELIST_KEY)
            .unwrap_or(Vec::new(&env));

        let mut found = false;
        let mut idx = 0u32;
        for i in 0..list.len() {
            if list.get(i).unwrap() == account {
                found = true;
                idx = i;
                break;
            }
        }

        if found {
            list.remove(idx);
            env.storage().instance().set(&WHITELIST_KEY, &list);
            env.events().publish((symbol_short!("WHTLIST"), symbol_short!("REMOVE")), account);
        }
        Ok(())
    }

    /// Retrieve active quorum requirement.
    pub fn get_quorum(env: Env) -> u32 {
        env.storage().instance().get(&QUORUM_KEY).unwrap_or(DEFAULT_QUORUM)
    }

    /// Return the list of current active admin addresses.
    pub fn get_admins(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&ADMINS_KEY)
            .unwrap_or(Vec::new(&env))
    }

    /// Return total count of active admin addresses.
    pub fn get_admin_count(env: Env) -> u32 {
        Self::get_admins(env).len()
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
        env.events().publish((symbol_short!("GOV"), symbol_short!("QUORUM")), (caller, new_quorum, admins.len()));
        Ok(())
    }

    /// Set dynamic quorum as a percentage (1..=100) of active administrators.
    pub fn set_quorum_percentage(env: Env, caller: Address, percentage: u32) -> Result<u32, Error> {
        caller.require_auth();
        if percentage == 0 || percentage > 100 {
            return Err(Error::InvalidParameter);
        }
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        // Ceiling division: (len * pct + 99) / 100
        let calculated = (admins.len().saturating_mul(percentage).saturating_add(99)) / 100;
        let quorum = calculated.max(1);
        env.storage().instance().set(&QUORUM_KEY, &quorum);
        env.events().publish((symbol_short!("GOV"), symbol_short!("QUORUM")), (caller, quorum, admins.len()));
        Ok(quorum)
    }

    /// Return current quorum as an approximate integer percentage of active admins.
    pub fn get_quorum_percentage(env: Env) -> u32 {
        let admin_count = Self::get_admin_count(env.clone());
        if admin_count == 0 {
            return 0;
        }
        let quorum = Self::get_quorum(env);
        (quorum.saturating_mul(100)) / admin_count
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
        Self::validate_asset_code(&asset_code)?;
        if target == issuer || target == caller {
            return Err(Error::SelfFreezeNotAllowed);
        }
        if target == env.current_contract_address() {
            return Err(Error::InvalidParameter);
        }
        if Self::is_whitelisted(env.clone(), target.clone()) {
            return Err(Error::InvalidParameter);
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
            Self::check_and_update_cooldown(&env, &target)?;
            let proposal = FreezeProposal {
                asset_code: asset_code.clone(),
                issuer: issuer.clone(),
                target: target.clone(),
                votes: Vec::new(&env),
                created_ledger: current_ledger,
                evidence_hash,
                ttl: active_ttl,
                negative_votes: Vec::new(&env),
                created_timestamp: env.ledger().timestamp(),
                reason_code: 0,
                timelock_until: 0,
                discussion_uri: String::from_str(&env, ""),
            };
            env.storage().temporary().set(&proposal_key, &proposal);
            env.storage()
                .temporary()
                .extend_ttl(&proposal_key, active_ttl, active_ttl);
            Self::add_active_proposal_key(&env, &asset_code, &target, false);
            env.events().publish(
                (symbol_short!("PROPOSE"), asset_code, issuer, target),
                caller,
            );
        }
        Ok(())
    }

    /// Propose a freeze action specifying a standardized reason category code.
    pub fn propose_freeze_with_category(
        env: Env,
        caller: Address,
        asset_code: String,
        issuer: Address,
        target: Address,
        evidence_hash: String,
        reason_code: u32,
    ) -> Result<(), Error> {
        caller.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }
        Self::validate_asset_code(&asset_code)?;
        if target == issuer || target == caller {
            return Err(Error::SelfFreezeNotAllowed);
        }
        if target == env.current_contract_address() {
            return Err(Error::InvalidParameter);
        }
        if Self::is_whitelisted(env.clone(), target.clone()) {
            return Err(Error::InvalidParameter);
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
            Self::check_and_update_cooldown(&env, &target)?;
            let proposal = FreezeProposal {
                asset_code: asset_code.clone(),
                issuer: issuer.clone(),
                target: target.clone(),
                votes: Vec::new(&env),
                created_ledger: current_ledger,
                evidence_hash,
                ttl: active_ttl,
                negative_votes: Vec::new(&env),
                created_timestamp: env.ledger().timestamp(),
                reason_code,
                timelock_until: 0,
                discussion_uri: String::from_str(&env, ""),
            };
            env.storage().temporary().set(&proposal_key, &proposal);
            env.storage()
                .temporary()
                .extend_ttl(&proposal_key, active_ttl, active_ttl);
            Self::add_active_proposal_key(&env, &asset_code, &target, false);
            env.events().publish(
                (symbol_short!("PROPOSE"), asset_code, issuer, target),
                (caller, reason_code),
            );
        }
        Ok(())
    }

    /// Propose a freeze action specifying reason category and incident discussion / case URI.
    pub fn propose_freeze_with_metadata(
        env: Env,
        caller: Address,
        asset_code: String,
        issuer: Address,
        target: Address,
        evidence_hash: String,
        reason_code: u32,
        discussion_uri: String,
    ) -> Result<(), Error> {
        caller.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }
        Self::validate_asset_code(&asset_code)?;
        if target == issuer || target == caller {
            return Err(Error::SelfFreezeNotAllowed);
        }
        if target == env.current_contract_address() {
            return Err(Error::InvalidParameter);
        }
        if Self::is_whitelisted(env.clone(), target.clone()) {
            return Err(Error::InvalidParameter);
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
            Self::check_and_update_cooldown(&env, &target)?;
            let proposal = FreezeProposal {
                asset_code: asset_code.clone(),
                issuer: issuer.clone(),
                target: target.clone(),
                votes: Vec::new(&env),
                created_ledger: current_ledger,
                evidence_hash,
                ttl: active_ttl,
                negative_votes: Vec::new(&env),
                created_timestamp: env.ledger().timestamp(),
                reason_code,
                timelock_until: 0,
                discussion_uri,
            };
            env.storage().temporary().set(&proposal_key, &proposal);
            env.storage()
                .temporary()
                .extend_ttl(&proposal_key, active_ttl, active_ttl);
            Self::add_active_proposal_key(&env, &asset_code, &target, false);
            env.events().publish(
                (symbol_short!("PROPOSE"), asset_code, issuer, target),
                (caller, reason_code),
            );
        }
        Ok(())
    }

    /// Return the standardized reason code classification for a proposal.
    pub fn get_proposal_reason_code(
        env: Env,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> u32 {
        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&proposal_key);
        proposal.map(|p| p.reason_code).unwrap_or(0)
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
        Self::validate_asset_code(&asset_code)?;
        if target == issuer || target == caller {
            return Err(Error::SelfFreezeNotAllowed);
        }
        if target == env.current_contract_address() {
            return Err(Error::InvalidParameter);
        }
        if Self::is_whitelisted(env.clone(), target.clone()) {
            return Err(Error::InvalidParameter);
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
            None => {
                Self::check_and_update_cooldown(&env, &target)?;
                let p = FreezeProposal {
                    asset_code: asset_code.clone(),
                    issuer: issuer.clone(),
                    target: target.clone(),
                    votes: Vec::new(&env),
                    created_ledger: current_ledger,
                    evidence_hash,
                    ttl: active_ttl,
                    negative_votes: Vec::new(&env),
                    created_timestamp: env.ledger().timestamp(),
                    reason_code: 0,
                    timelock_until: 0,
                    discussion_uri: String::from_str(&env, ""),
                };
                Self::add_active_proposal_key(&env, &asset_code, &target, false);
                p
            }
        };

        if proposal.votes.contains(&caller) || proposal.negative_votes.contains(&caller) {
            return Err(Error::AlreadyVoted);
        }

        proposal.votes.push_back(caller.clone());
        let quorum: u32 = env.storage().instance().get(&QUORUM_KEY).unwrap_or(DEFAULT_QUORUM);
        let seq = Self::next_action_sequence(&env);

        let mut valid_votes = 0u32;
        for i in 0..proposal.votes.len() {
            if admins.contains(&proposal.votes.get(i).unwrap()) {
                valid_votes += 1;
            }
        }

        env.events().publish(
            (symbol_short!("VOTE"), symbol_short!("FRZ"), target.clone()),
            (caller, valid_votes, seq),
        );

        if valid_votes >= quorum {
            let timelock_delay: u64 = env.storage().instance().get(&TIMELOCK_KEY).unwrap_or(0);
            let is_unanimous = admins.len() > quorum && valid_votes >= admins.len();
            if is_unanimous && timelock_delay > 0 {
                env.events().publish(
                    (symbol_short!("TMLOCK"), symbol_short!("BYPASS"), target.clone()),
                    (valid_votes, seq),
                );
                env.events().publish(
                    (symbol_short!("FREEZE"), asset_code.clone(), issuer.clone(), target.clone()),
                    valid_votes,
                );
                env.storage().temporary().remove(&proposal_key);
                Self::remove_active_proposal_key(&env, &asset_code, &target, false);
                Self::mark_account_frozen(&env, &asset_code, &target);
                let _ = cap0077::Cap0077Adapter::quarantine_trustline(&env, &asset_code, &issuer, &target);
            } else if timelock_delay > 0 && proposal.timelock_until == 0 {
                proposal.timelock_until = env.ledger().timestamp().saturating_add(timelock_delay);
                env.storage().temporary().set(&proposal_key, &proposal);
                env.events().publish(
                    (symbol_short!("TIMELOCK"), symbol_short!("QUEUED"), target),
                    (proposal.timelock_until, seq),
                );
            } else if timelock_delay == 0 {
                env.events().publish(
                    (symbol_short!("FREEZE"), asset_code.clone(), issuer.clone(), target.clone()),
                    valid_votes,
                );
                env.storage().temporary().remove(&proposal_key);
                Self::remove_active_proposal_key(&env, &asset_code, &target, false);
                Self::mark_account_frozen(&env, &asset_code, &target);
                let _ = cap0077::Cap0077Adapter::quarantine_trustline(&env, &asset_code, &issuer, &target);
            }
        } else {
            env.storage().temporary().set(&proposal_key, &proposal);
            env.storage()
                .temporary()
                .extend_ttl(&proposal_key, proposal.ttl, proposal.ttl);
        }

        Ok(valid_votes)
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

    /// Cast freeze votes across multiple asset codes for a target account.
    /// Enables multi-asset freeze enforcement across a single compromised address.
    pub fn batch_asset_vote_freeze(
        env: Env,
        caller: Address,
        target: Address,
        assets: Vec<String>,
        issuer: Address,
        evidence_hash: String,
    ) -> Result<Vec<u32>, Error> {
        caller.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }
        let mut results = Vec::new(&env);
        for i in 0..assets.len() {
            let asset = assets.get(i).unwrap();
            let count = Self::internal_vote_freeze(
                env.clone(),
                caller.clone(),
                asset,
                issuer.clone(),
                target.clone(),
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
        Self::validate_asset_code(&asset_code)?;
        if target == issuer || target == caller {
            return Err(Error::SelfFreezeNotAllowed);
        }
        if target == env.current_contract_address() {
            return Err(Error::InvalidParameter);
        }
        if Self::is_whitelisted(env.clone(), target.clone()) {
            return Err(Error::InvalidParameter);
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
            None => {
                Self::check_and_update_cooldown(&env, &target)?;
                let p = FreezeProposal {
                    asset_code: asset_code.clone(),
                    issuer: issuer.clone(),
                    target: target.clone(),
                    votes: Vec::new(&env),
                    created_ledger: current_ledger,
                    evidence_hash: String::from_str(&env, ""),
                    ttl: active_ttl,
                    negative_votes: Vec::new(&env),
                    created_timestamp: env.ledger().timestamp(),
                    reason_code: 0,
                    timelock_until: 0,
                    discussion_uri: String::from_str(&env, ""),
                };
                Self::add_active_proposal_key(&env, &asset_code, &target, true);
                p
            }
        };

        if proposal.votes.contains(&caller) || proposal.negative_votes.contains(&caller) {
            return Err(Error::AlreadyVoted);
        }

        proposal.votes.push_back(caller.clone());
        let quorum: u32 = env.storage().instance().get(&QUORUM_KEY).unwrap_or(DEFAULT_QUORUM);
        let seq = Self::next_action_sequence(&env);

        let mut valid_votes = 0u32;
        for i in 0..proposal.votes.len() {
            if admins.contains(&proposal.votes.get(i).unwrap()) {
                valid_votes += 1;
            }
        }

        env.events().publish(
            (symbol_short!("VOTE"), symbol_short!("UNFRZ"), target.clone()),
            (caller, valid_votes, seq),
        );

        if valid_votes >= quorum {
            let timelock_delay: u64 = env.storage().instance().get(&TIMELOCK_KEY).unwrap_or(0);
            let is_unanimous = admins.len() > quorum && valid_votes >= admins.len();
            if is_unanimous && timelock_delay > 0 {
                env.events().publish(
                    (symbol_short!("TMLOCK"), symbol_short!("BYPASS"), target.clone()),
                    (valid_votes, seq),
                );
                env.events().publish(
                    (symbol_short!("UNFREEZ"), asset_code.clone(), issuer.clone(), target.clone()),
                    valid_votes,
                );
                env.storage().temporary().remove(&proposal_key);
                Self::remove_active_proposal_key(&env, &asset_code, &target, true);
                Self::mark_account_unfrozen(&env, &asset_code, &target);
                let _ = cap0077::Cap0077Adapter::release_trustline(&env, &asset_code, &issuer, &target);
            } else if timelock_delay > 0 && proposal.timelock_until == 0 {
                proposal.timelock_until = env.ledger().timestamp().saturating_add(timelock_delay);
                env.storage().temporary().set(&proposal_key, &proposal);
                env.events().publish(
                    (symbol_short!("TIMELOCK"), symbol_short!("QUEUED"), target),
                    (proposal.timelock_until, seq),
                );
            } else if timelock_delay == 0 {
                env.events().publish(
                    (symbol_short!("UNFREEZ"), asset_code.clone(), issuer.clone(), target.clone()),
                    valid_votes,
                );
                env.storage().temporary().remove(&proposal_key);
                Self::remove_active_proposal_key(&env, &asset_code, &target, true);
                Self::mark_account_unfrozen(&env, &asset_code, &target);
                let _ = cap0077::Cap0077Adapter::release_trustline(&env, &asset_code, &issuer, &target);
            }
        } else {
            env.storage().temporary().set(&proposal_key, &proposal);
            env.storage()
                .temporary()
                .extend_ttl(&proposal_key, proposal.ttl, proposal.ttl);
        }

        Ok(valid_votes)
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

    /// Revoke a previously cast vote for an unfreeze proposal.
    pub fn revoke_unfreeze_vote(
        env: Env,
        caller: Address,
        asset_code: String,
        target: Address,
    ) -> Result<(), Error> {
        caller.require_auth();

        let proposal_key = (symbol_short!("UNFRZ"), asset_code, target.clone());
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
            (symbol_short!("REVOKE"), symbol_short!("UNFRZ"), target),
            caller,
        );
        Ok(())
    }

    /// Revoke a previously cast negative vote against a freeze or unfreeze proposal.
    pub fn revoke_negative_vote(
        env: Env,
        caller: Address,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> Result<u32, Error> {
        caller.require_auth();
        let admins: Vec<Address> = env.storage().instance().get(&ADMINS_KEY).unwrap();
        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix.clone(), asset_code, target.clone());
        let mut proposal: FreezeProposal = env
            .storage()
            .temporary()
            .get(&proposal_key)
            .ok_or(Error::ProposalNotFound)?;

        let mut found = false;
        let mut idx = 0u32;
        for i in 0..proposal.negative_votes.len() {
            if proposal.negative_votes.get(i).unwrap() == caller {
                found = true;
                idx = i;
                break;
            }
        }

        if !found {
            return Err(Error::ProposalNotFound);
        }

        proposal.negative_votes.remove(idx);
        let rem_count = proposal.negative_votes.len();
        env.storage().temporary().set(&proposal_key, &proposal);
        env.storage()
            .temporary()
            .extend_ttl(&proposal_key, proposal.ttl, proposal.ttl);
        env.events().publish(
            (symbol_short!("REVOK_NO"), prefix, target),
            caller,
        );
        Ok(rem_count)
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
        let proposal_key = (prefix, asset_code.clone(), target.clone());
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
        Self::remove_active_proposal_key(&env, &asset_code, &target, is_unfreeze);
        Ok(())
    }

    /// Batch prune expired proposals to clean up storage state in a single invocation.
    pub fn prune_expired_batch(
        env: Env,
        caller: Address,
        proposals: Vec<(String, Address, bool)>,
    ) -> Result<u32, Error> {
        caller.require_auth();
        let current_ledger = env.ledger().sequence();
        let mut pruned_count = 0u32;

        for i in 0..proposals.len() {
            let (asset_code, target, is_unfreeze) = proposals.get(i).unwrap();
            let prefix = if is_unfreeze {
                symbol_short!("UNFRZ")
            } else {
                symbol_short!("FRZ")
            };
            let proposal_key = (prefix, asset_code.clone(), target.clone());
            if let Some(proposal) = env.storage().temporary().get::<_, FreezeProposal>(&proposal_key) {
                if current_ledger > proposal.created_ledger.saturating_add(proposal.ttl) {
                    env.storage().temporary().remove(&proposal_key);
                    Self::remove_active_proposal_key(&env, &asset_code, &target, is_unfreeze);
                    pruned_count += 1;
                }
            }
        }
        Ok(pruned_count)
    }

    /// Cancel an unvoted proposal before voting begins. Callable by admin.
    pub fn cancel_proposal(
        env: Env,
        caller: Address,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix.clone(), asset_code.clone(), target.clone());
        let proposal: FreezeProposal = env
            .storage()
            .temporary()
            .get(&proposal_key)
            .ok_or(Error::ProposalNotFound)?;

        if proposal.votes.len() > 0 {
            return Err(Error::InvalidParameter);
        }

        env.storage().temporary().remove(&proposal_key);
        Self::remove_active_proposal_key(&env, &asset_code, &target, is_unfreeze);
        env.events().publish((symbol_short!("CANCEL"), prefix, target), caller);
        Ok(())
    }

    /// Explicitly bump storage TTL for an active proposal to prevent eviction.
    pub fn bump_proposal_ttl(
        env: Env,
        caller: Address,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
        ledgers_to_extend: u32,
    ) -> Result<(), Error> {
        caller.require_auth();
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&ADMINS_KEY)
            .ok_or(Error::UnauthorizedFreezeAttempt)?;

        if !admins.contains(&caller) {
            return Err(Error::UnauthorizedFreezeAttempt);
        }

        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        if !env.storage().temporary().has(&proposal_key) {
            return Err(Error::ProposalNotFound);
        }

        env.storage()
            .temporary()
            .extend_ttl(&proposal_key, ledgers_to_extend, ledgers_to_extend);
        Ok(())
    }

    /// Return current vote count for a freeze proposal (0 if none or expired).
    pub fn get_votes(env: Env, asset_code: String, target: Address) -> u32 {
        let key = (symbol_short!("FRZ"), asset_code, target);
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&key);
        proposal.map(|p| p.votes.len()).unwrap_or(0)
    }

    /// Check if an active or unpruned proposal exists in temporary storage.
    pub fn has_proposal(
        env: Env,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> bool {
        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        env.storage().temporary().has(&proposal_key)
    }

    /// Return the creation timestamp (Unix epoch seconds) of a proposal.
    pub fn get_proposal_created_timestamp(
        env: Env,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> u64 {
        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&proposal_key);
        proposal.map(|p| p.created_timestamp).unwrap_or(0)
    }

    /// Return the lifecycle status of a proposal (None, Active, Expired).
    pub fn get_proposal_status(
        env: Env,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> ProposalStatus {
        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&proposal_key);
        match proposal {
            None => ProposalStatus::None,
            Some(p) => {
                if p.timelock_until > 0 {
                    ProposalStatus::Queued
                } else {
                    let current_ledger = env.ledger().sequence();
                    if current_ledger > p.created_ledger.saturating_add(p.ttl) {
                        ProposalStatus::Expired
                    } else {
                        ProposalStatus::Active
                    }
                }
            }
        }
    }

    /// Return the timelock expiration timestamp (Unix epoch) for a queued proposal.
    pub fn get_proposal_timelock_until(
        env: Env,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> u64 {
        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&proposal_key);
        proposal.map(|p| p.timelock_until).unwrap_or(0)
    }

    /// Check whether a proposal has achieved unanimous consensus across all active administrators.
    pub fn is_unanimous_quorum_met(
        env: Env,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> bool {
        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&proposal_key);
        let admins = Self::get_admins(env.clone());
        let quorum = Self::get_quorum(env.clone());
        if let Some(p) = proposal {
            let mut valid = 0u32;
            for i in 0..p.votes.len() {
                if admins.contains(&p.votes.get(i).unwrap()) {
                    valid += 1;
                }
            }
            valid >= admins.len() && admins.len() > quorum
        } else {
            false
        }
    }

    /// Execute a timelocked freeze proposal whose delay has elapsed.
    pub fn execute_freeze(
        env: Env,
        caller: Address,
        asset_code: String,
        target: Address,
    ) -> Result<(), Error> {
        caller.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }
        let proposal_key = (symbol_short!("FRZ"), asset_code.clone(), target.clone());
        let proposal: FreezeProposal = env
            .storage()
            .temporary()
            .get(&proposal_key)
            .ok_or(Error::ProposalNotFound)?;

        if proposal.timelock_until == 0 {
            return Err(Error::TimelockNotMet);
        }
        if env.ledger().timestamp() < proposal.timelock_until {
            return Err(Error::TimelockActive);
        }

        let seq = Self::next_action_sequence(&env);
        env.events().publish(
            (symbol_short!("FREEZE"), asset_code.clone(), proposal.issuer.clone(), target.clone()),
            (proposal.votes.len(), proposal.created_ledger, seq),
        );
        env.storage().temporary().remove(&proposal_key);
        Self::remove_active_proposal_key(&env, &asset_code, &target, false);
        Self::mark_account_frozen(&env, &asset_code, &target);
        let _ = cap0077::Cap0077Adapter::quarantine_trustline(&env, &asset_code, &proposal.issuer, &target);
        Ok(())
    }

    /// Execute a timelocked unfreeze proposal whose delay has elapsed.
    pub fn execute_unfreeze(
        env: Env,
        caller: Address,
        asset_code: String,
        target: Address,
    ) -> Result<(), Error> {
        caller.require_auth();
        if Self::is_paused(env.clone()) {
            return Err(Error::ContractPaused);
        }
        let proposal_key = (symbol_short!("UNFRZ"), asset_code.clone(), target.clone());
        let proposal: FreezeProposal = env
            .storage()
            .temporary()
            .get(&proposal_key)
            .ok_or(Error::ProposalNotFound)?;

        if proposal.timelock_until == 0 {
            return Err(Error::TimelockNotMet);
        }
        if env.ledger().timestamp() < proposal.timelock_until {
            return Err(Error::TimelockActive);
        }

        let seq = Self::next_action_sequence(&env);
        env.events().publish(
            (symbol_short!("UNFREEZ"), asset_code.clone(), proposal.issuer.clone(), target.clone()),
            (proposal.votes.len(), proposal.created_ledger, seq),
        );
        env.storage().temporary().remove(&proposal_key);
        Self::remove_active_proposal_key(&env, &asset_code, &target, true);
        Self::mark_account_unfrozen(&env, &asset_code, &target);
        let _ = cap0077::Cap0077Adapter::release_trustline(&env, &asset_code, &proposal.issuer, &target);
        Ok(())
    }

    /// Return attached evidence metadata hash if present.
    pub fn get_proposal_evidence(env: Env, asset_code: String, target: Address) -> String {
        let key = (symbol_short!("FRZ"), asset_code, target);
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&key);
        proposal.map(|p| p.evidence_hash).unwrap_or(String::from_str(&env, ""))
    }

    /// Return incident discussion thread / ticket URI attached to proposal.
    pub fn get_proposal_discussion_uri(
        env: Env,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> String {
        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&proposal_key);
        proposal.map(|p| p.discussion_uri).unwrap_or(String::from_str(&env, ""))
    }

    /// Update or attach a discussion/ticket URI to an active proposal.
    pub fn update_proposal_discussion_uri(
        env: Env,
        caller: Address,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
        discussion_uri: String,
    ) -> Result<(), Error> {
        caller.require_auth();
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

        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        let mut proposal: FreezeProposal = env
            .storage()
            .temporary()
            .get(&proposal_key)
            .ok_or(Error::ProposalNotFound)?;

        proposal.discussion_uri = discussion_uri;
        env.storage().temporary().set(&proposal_key, &proposal);
        Ok(())
    }

    /// Return current vote count for an unfreeze proposal (0 if none or expired).
    pub fn get_unfreeze_votes(env: Env, asset_code: String, target: Address) -> u32 {
        let key = (symbol_short!("UNFRZ"), asset_code, target);
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&key);
        proposal.map(|p| p.votes.len()).unwrap_or(0)
    }

    /// Cast a negative vote against a proposal.
    /// If negative votes make achieving quorum mathematically impossible, proposal is rejected.
    pub fn vote_against(
        env: Env,
        caller: Address,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
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

        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix.clone(), asset_code.clone(), target.clone());
        let mut proposal: FreezeProposal = env
            .storage()
            .temporary()
            .get(&proposal_key)
            .ok_or(Error::ProposalNotFound)?;

        if proposal.negative_votes.contains(&caller) || proposal.votes.contains(&caller) {
            return Err(Error::AlreadyVoted);
        }

        proposal.negative_votes.push_back(caller.clone());
        let neg_count = proposal.negative_votes.len();
        let quorum: u32 = env.storage().instance().get(&QUORUM_KEY).unwrap_or(DEFAULT_QUORUM);
        let max_possible_votes = admins.len().saturating_sub(neg_count);

        env.events().publish(
            (symbol_short!("VOTE_NO"), prefix.clone(), target.clone()),
            (caller, neg_count),
        );

        if max_possible_votes < quorum {
            env.storage().temporary().remove(&proposal_key);
            Self::remove_active_proposal_key(&env, &asset_code, &target, is_unfreeze);
            env.events().publish(
                (symbol_short!("REJECTED"), prefix, target),
                neg_count,
            );
        } else {
            env.storage().temporary().set(&proposal_key, &proposal);
            env.storage()
                .temporary()
                .extend_ttl(&proposal_key, proposal.ttl, proposal.ttl);
        }

        Ok(neg_count)
    }

    /// Return current negative vote count.
    pub fn get_negative_votes(
        env: Env,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> u32 {
        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&proposal_key);
        proposal.map(|p| p.negative_votes.len()).unwrap_or(0)
    }

    /// Return the list of addresses that have voted on a proposal.
    pub fn get_proposal_voters(
        env: Env,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> Vec<Address> {
        let prefix = if is_unfreeze {
            symbol_short!("UNFRZ")
        } else {
            symbol_short!("FRZ")
        };
        let proposal_key = (prefix, asset_code.clone(), target.clone());
        let proposal: Option<FreezeProposal> = env.storage().temporary().get(&proposal_key);
        proposal.map(|p| p.votes).unwrap_or(Vec::new(&env))
    }

    /// Check if a specific admin has already voted on a proposal.
    pub fn has_voted(
        env: Env,
        admin: Address,
        asset_code: String,
        target: Address,
        is_unfreeze: bool,
    ) -> bool {
        let voters = Self::get_proposal_voters(env, asset_code, target, is_unfreeze);
        voters.contains(&admin)
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
        if new_admin == env.current_contract_address() {
            return Err(Error::InvalidParameter);
        }
        if admins.len() >= MAX_ADMINS {
            return Err(Error::InvalidParameter);
        }
        admins.push_back(new_admin.clone());
        env.storage().instance().set(&ADMINS_KEY, &admins);
        let chg_seq = Self::increment_admin_change_count(&env);
        env.events().publish((symbol_short!("ADMIN"), symbol_short!("ADD")), (caller, new_admin, chg_seq));
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

        let quorum: u32 = env.storage().instance().get(&QUORUM_KEY).unwrap_or(DEFAULT_QUORUM);
        if admins.len().saturating_sub(1) < quorum {
            return Err(Error::BelowQuorumThreshold);
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
        let chg_seq = Self::increment_admin_change_count(&env);
        env.events().publish((symbol_short!("ADMIN"), symbol_short!("REMOVE")), (caller, admin_to_remove, chg_seq));
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, testutils::Events as _, Env, String};

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

        // Upgrade blocked when contract is paused
        client.pause(&admin);
        let paused_err = client.try_upgrade(&admin, &dummy_wasm_hash);
        assert_eq!(paused_err, Err(Ok(Error::ContractPaused)));
        client.unpause(&admin);
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
    fn test_max_admins_cap() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let initial_admin = Address::generate(&env);
        client.init(&Vec::from_array(&env, [initial_admin.clone()]), &Some(1));
        env.mock_all_auths();

        // Add up to MAX_ADMINS (20)
        for _ in 1..MAX_ADMINS {
            let next_admin = Address::generate(&env);
            client.add_admin(&initial_admin, &next_admin);
        }
        assert_eq!(client.get_admin_count(), MAX_ADMINS);

        // Exceeding MAX_ADMINS fails with InvalidParameter
        let overflow_admin = Address::generate(&env);
        let err = client.try_add_admin(&initial_admin, &overflow_admin);
        assert_eq!(err, Err(Ok(Error::InvalidParameter)));
    }

    #[test]
    fn test_proposal_reason_code() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));
        env.mock_all_auths();

        client.propose_freeze_with_category(
            &a1,
            &asset(&env),
            &issuer,
            &target,
            &String::from_str(&env, "ofac_sdn_list"),
            &(ReasonCode::OfacSanctions as u32),
        );

        assert_eq!(
            client.get_proposal_reason_code(&asset(&env), &target, &false),
            ReasonCode::OfacSanctions as u32
        );
    }

    #[test]
    fn test_auditor_role_registry() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let admin = Address::generate(&env);
        let auditor = Address::generate(&env);

        client.init(&Vec::from_array(&env, [admin.clone()]), &Some(1));
        env.mock_all_auths();

        assert_eq!(client.is_auditor(&auditor), false);
        client.add_auditor(&admin, &auditor);
        assert_eq!(client.is_auditor(&auditor), true);
        assert_eq!(client.get_auditors().len(), 1);

        client.remove_auditor(&admin, &auditor);
        assert_eq!(client.is_auditor(&auditor), false);
    }

    #[test]
    fn test_cancel_unvoted_proposal() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        // Create proposal with propose_freeze (0 votes)
        client.propose_freeze(&a1, &asset(&env), &issuer, &target, &String::from_str(&env, "mistake"));
        assert_eq!(client.has_proposal(&asset(&env), &target, &false), true);

        // Cancel it before any votes
        client.cancel_proposal(&a1, &asset(&env), &target, &false);
        assert_eq!(client.has_proposal(&asset(&env), &target, &false), false);
    }

    #[test]
    fn test_removed_admin_votes_not_counted_towards_quorum() {
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

        // a3 votes on freeze proposal
        assert_eq!(client.vote_freeze(&a3, &asset(&env), &issuer, &target), 1);

        // a3 is removed as an admin
        client.remove_admin(&a1, &a3);

        // a1 now votes. Because a3 is no longer an admin, only a1's vote is valid (count 1, below quorum 2)
        assert_eq!(client.vote_freeze(&a1, &asset(&env), &issuer, &target), 1);
        assert_eq!(client.has_proposal(&asset(&env), &target, &false), true);

        // a2 votes -> valid votes reaches quorum 2 -> executed and cleared!
        assert_eq!(client.vote_freeze(&a2, &asset(&env), &issuer, &target), 2);
        assert_eq!(client.has_proposal(&asset(&env), &target, &false), false);
    }

    #[test]
    fn test_proposal_timestamp() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        env.ledger().with_mut(|li| {
            li.timestamp = 1700000000;
        });

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.get_proposal_created_timestamp(&asset(&env), &target, &false), 1700000000);
    }

    #[test]
    fn test_whitelist_exemption_registry() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let pool = Address::generate(&env);

        client.init(&Vec::from_array(&env, [admin.clone()]), &Some(1));
        env.mock_all_auths();

        assert_eq!(client.is_whitelisted(&pool), false);

        // Add pool to whitelist
        client.add_whitelist(&admin, &pool);
        assert_eq!(client.is_whitelisted(&pool), true);
        assert_eq!(client.get_whitelist().len(), 1);

        // Attempting to freeze whitelisted address fails with InvalidParameter
        let res = client.try_vote_freeze(&admin, &asset(&env), &issuer, &pool);
        assert_eq!(res, Err(Ok(Error::InvalidParameter)));

        // Remove from whitelist restores freezability
        client.remove_whitelist(&admin, &pool);
        assert_eq!(client.is_whitelisted(&pool), false);
        let vote_res = client.vote_freeze(&admin, &asset(&env), &issuer, &pool);
        assert_eq!(vote_res, 1);
    }

    #[test]
    fn test_has_proposal() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        assert_eq!(client.has_proposal(&asset(&env), &target, &false), false);
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.has_proposal(&asset(&env), &target, &false), true);
    }

    #[test]
    fn test_action_sequence_counter() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));
        env.mock_all_auths();

        assert_eq!(client.get_action_sequence(), 0);
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.get_action_sequence(), 1);
    }

    #[test]
    fn test_self_freeze_protection() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        let issuer = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));
        env.mock_all_auths();

        // Target == issuer must be rejected
        let res = client.try_vote_freeze(&a1, &asset(&env), &issuer, &issuer);
        assert_eq!(res, Err(Ok(Error::SelfFreezeNotAllowed)));
    }

    #[test]
    fn test_invalid_asset_code() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));
        env.mock_all_auths();

        // Empty asset code is rejected
        let empty_code = String::from_str(&env, "");
        let err1 = client.try_vote_freeze(&a1, &empty_code, &issuer, &target);
        assert_eq!(err1, Err(Ok(Error::InvalidAssetCode)));

        // Asset code longer than 12 chars is rejected
        let long_code = String::from_str(&env, "VERYLONGRWAUSD123");
        let err2 = client.try_vote_freeze(&a1, &long_code, &issuer, &target);
        assert_eq!(err2, Err(Ok(Error::InvalidAssetCode)));

        // Non-alphanumeric code is rejected
        let invalid_chars = String::from_str(&env, "USD$");
        let err3 = client.try_vote_freeze(&a1, &invalid_chars, &issuer, &target);
        assert_eq!(err3, Err(Ok(Error::InvalidAssetCode)));
    }

    #[test]
    fn test_vote_against_rejection() {
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

        // Initialize proposal with 1 positive vote
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.get_votes(&asset(&env), &target), 1);

        // a2 votes against -> negative count 1. Max possible positive votes = 3 - 1 = 2 (still >= quorum 2)
        assert_eq!(client.vote_against(&a2, &asset(&env), &target, &false), 1);
        assert_eq!(client.get_negative_votes(&asset(&env), &target, &false), 1);
        assert_eq!(client.get_votes(&asset(&env), &target), 1);

        // a3 votes against -> negative count 2. Max possible positive votes = 3 - 2 = 1 (< quorum 2).
        // Proposal becomes mathematically impossible to pass and is rejected/removed!
        client.vote_against(&a3, &asset(&env), &target, &false);
        assert_eq!(client.get_votes(&asset(&env), &target), 0);
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::None);
    }

    #[test]
    fn test_extend_instance_ttl() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));

        // Public keeper function can be called without admin credentials
        client.extend_instance_ttl(&5000, &10000);
    }

    #[test]
    fn test_bump_proposal_ttl() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));
        env.mock_all_auths();

        // Bumping non-existent proposal returns error
        let err = client.try_bump_proposal_ttl(&a1, &asset(&env), &target, &false, &1000);
        assert_eq!(err, Err(Ok(Error::ProposalNotFound)));

        // Propose and then bump TTL successfully
        client.propose_freeze(&a1, &asset(&env), &issuer, &target, &String::from_str(&env, ""));
        let res = client.bump_proposal_ttl(&a1, &asset(&env), &target, &false, &1000);
        assert_eq!(res, ());
    }

    #[test]
    fn test_proposal_voter_queries() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        assert_eq!(client.has_voted(&a1, &asset(&env), &target, &false), false);

        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.has_voted(&a1, &asset(&env), &target, &false), true);
        assert_eq!(client.has_voted(&a2, &asset(&env), &target, &false), false);

        let voters = client.get_proposal_voters(&asset(&env), &target, &false);
        assert_eq!(voters.len(), 1);
        assert_eq!(voters.get(0).unwrap(), a1);
    }

    #[test]
    fn test_proposal_status_query() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        let a2 = Address::generate(&env);
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        // Non-existent proposal has status None
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::None);

        // Created proposal has status Active
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::Active);

        // After TTL passes, status is Expired
        env.ledger().with_mut(|li| {
            li.sequence_number += DEFAULT_PROPOSAL_TTL + 10;
        });
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::Expired);
    }

    #[test]
    fn test_remove_admin_below_quorum() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        let a2 = Address::generate(&env);
        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        // Removing a2 would leave 1 admin, but quorum is 2 -> must be rejected
        let res = client.try_remove_admin(&a1, &a2);
        assert_eq!(res, Err(Ok(Error::BelowQuorumThreshold)));
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
    fn test_empty_init_rejection_and_admin_queries() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        // Empty admins vector is rejected
        let err = client.try_init(&Vec::new(&env), &None);
        assert_eq!(err, Err(Ok(Error::InvalidParameter)));

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));

        assert_eq!(client.get_admin_count(), 2);
        let admins = client.get_admins();
        assert_eq!(admins.len(), 2);
        assert_eq!(admins.get(0).unwrap(), a1);
        assert_eq!(admins.get(1).unwrap(), a2);
    }

    #[test]
    fn test_get_votes_empty() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);
        client.init(&Vec::from_array(&env, [Address::generate(&env)]), &None);
        let target = Address::generate(&env);
        assert_eq!(client.get_votes(&asset(&env), &target), 0);
    }

    #[test]
    fn test_batch_asset_vote_freeze() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);
        let a1 = Address::generate(&env);
        let a2 = Address::generate(&env);
        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        let target = Address::generate(&env);
        let issuer = Address::generate(&env);
        let assets = Vec::from_array(
            &env,
            [
                String::from_str(&env, "USDC"),
                String::from_str(&env, "EURC"),
                String::from_str(&env, "BRLC"),
            ],
        );
        let empty_hash = String::from_str(&env, "");

        let counts = client.batch_asset_vote_freeze(&a1, &target, &assets, &issuer, &empty_hash);
        assert_eq!(counts.len(), 3);
        assert_eq!(counts.get(0).unwrap(), 1);
        assert_eq!(counts.get(1).unwrap(), 1);
        assert_eq!(counts.get(2).unwrap(), 1);

        // a2 votes on same assets
        let counts2 = client.batch_asset_vote_freeze(&a2, &target, &assets, &issuer, &empty_hash);
        assert_eq!(counts2.get(0).unwrap(), 2);
        assert_eq!(counts2.get(1).unwrap(), 2);
        assert_eq!(counts2.get(2).unwrap(), 2);
    }

    #[test]
    fn test_proposal_cooldown_anti_spam() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        env.ledger().with_mut(|li| {
            li.timestamp = 1700000000;
        });

        let a1 = Address::generate(&env);
        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));
        env.mock_all_auths();

        // Default cooldown is 0
        assert_eq!(client.get_proposal_cooldown(), 0);

        // Admin sets cooldown to 3600 seconds (1 hour)
        client.set_proposal_cooldown(&a1, &3600);
        assert_eq!(client.get_proposal_cooldown(), 3600);

        let target = Address::generate(&env);
        let issuer = Address::generate(&env);
        let ast1 = String::from_str(&env, "USDC");
        let ast2 = String::from_str(&env, "EURC");

        // First proposal succeeds and sets last proposal timestamp
        client.vote_freeze(&a1, &ast1, &issuer, &target);
        assert_eq!(client.get_last_proposal_timestamp(&target), 1700000000);

        // Immediate proposal for a different asset on same target is rejected due to cooldown
        let res = client.try_vote_freeze(&a1, &ast2, &issuer, &target);
        assert_eq!(res, Err(Ok(Error::CooldownActive)));

        // Advance ledger timestamp beyond cooldown period
        env.ledger().with_mut(|li| {
            li.timestamp = 1700003601;
        });

        // Now proposal succeeds
        let res2 = client.try_vote_freeze(&a1, &ast2, &issuer, &target);
        assert!(res2.is_ok());
        assert_eq!(client.get_last_proposal_timestamp(&target), 1700003601);
    }

    #[test]
    fn test_timelock_delay_and_execution() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        env.ledger().with_mut(|li| {
            li.timestamp = 1700000000;
        });

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        // Admin configures a 24-hour timelock delay (86400 seconds)
        assert_eq!(client.get_timelock_delay(), 0);
        client.set_timelock_delay(&a1, &86400);
        assert_eq!(client.get_timelock_delay(), 86400);

        // a1 votes (1 of 2, active)
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::Active);

        // a2 votes -> reaches quorum 2 -> enters Queued status with timelock_until = 1700000000 + 86400
        client.vote_freeze(&a2, &asset(&env), &issuer, &target);
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::Queued);
        assert_eq!(client.get_proposal_timelock_until(&asset(&env), &target, &false), 1700086400);

        // Trying to execute before timelock expires fails
        let premature = client.try_execute_freeze(&a1, &asset(&env), &target);
        assert_eq!(premature, Err(Ok(Error::TimelockActive)));

        // Advance past timelock
        env.ledger().with_mut(|li| {
            li.timestamp = 1700086401;
        });

        // Now execute succeeds, proposal is cleared
        let executed = client.try_execute_freeze(&a1, &asset(&env), &target);
        assert!(executed.is_ok());
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::None);
    }

    #[test]
    fn test_unanimous_timelock_bypass() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        env.ledger().with_mut(|li| {
            li.timestamp = 1700000000;
        });

        let (a1, a2, a3) = (
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        );
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone(), a3.clone()]), &Some(2));
        env.mock_all_auths();

        // 24 hour timelock
        client.set_timelock_delay(&a1, &86400);

        // a1 votes (1 of 3, quorum is 2)
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::Active);

        // a2 votes -> reaches regular quorum (2 of 3) -> enters Queued status
        client.vote_freeze(&a2, &asset(&env), &issuer, &target);
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::Queued);
        assert_eq!(client.is_unanimous_quorum_met(&asset(&env), &target, &false), false);

        // a3 votes -> unanimous consensus (3 of 3) -> BYPASSES timelock immediately without waiting!
        client.vote_freeze(&a3, &asset(&env), &issuer, &target);
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::None);
    }

    #[test]
    fn test_admin_change_count_tracking() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2, a3) = (
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        );
        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(1));
        env.mock_all_auths();

        assert_eq!(client.get_admin_change_count(), 0);

        // a1 adds a3 -> count increments to 1
        client.add_admin(&a1, &a3);
        assert_eq!(client.get_admin_change_count(), 1);

        // a1 removes a2 -> count increments to 2
        client.remove_admin(&a1, &a2);
        assert_eq!(client.get_admin_change_count(), 2);
    }

    #[test]
    fn test_proposal_discussion_uri_metadata() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        let initial_uri = String::from_str(&env, "https://jira.institution.com/browse/SEC-9921");
        let hash = String::from_str(&env, "bafybeic567...");

        client.propose_freeze_with_metadata(
            &a1,
            &asset(&env),
            &issuer,
            &target,
            &hash,
            &(ReasonCode::AmlSuspiciousActivity as u32),
            &initial_uri,
        );

        assert_eq!(
            client.get_proposal_discussion_uri(&asset(&env), &target, &false),
            initial_uri
        );

        // Update discussion URI with new investigative findings link
        let updated_uri = String::from_str(&env, "https://discussions.stellar.org/t/incident-4491/2");
        client.update_proposal_discussion_uri(&a1, &asset(&env), &target, &false, &updated_uri);

        assert_eq!(
            client.get_proposal_discussion_uri(&asset(&env), &target, &false),
            updated_uri
        );
    }

    #[test]
    fn test_active_proposal_enumeration_and_pagination() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let t1 = Address::generate(&env);
        let t2 = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        assert_eq!(client.get_active_proposal_count(), 0);

        // a1 votes on t1 freeze
        client.vote_freeze(&a1, &asset(&env), &issuer, &t1);
        assert_eq!(client.get_active_proposal_count(), 1);

        // a1 votes on t2 freeze
        client.vote_freeze(&a1, &asset(&env), &issuer, &t2);
        assert_eq!(client.get_active_proposal_count(), 2);

        // Pagination query: offset 0, limit 1
        let p1 = client.get_active_proposals(&0, &1);
        assert_eq!(p1.len(), 1);
        assert_eq!(p1.get(0).unwrap().1, t1);

        // Pagination query: offset 1, limit 1
        let p2 = client.get_active_proposals(&1, &1);
        assert_eq!(p2.len(), 1);
        assert_eq!(p2.get(0).unwrap().1, t2);

        // a2 votes on t1 -> reaches quorum 2 -> executed and removed from active index
        client.vote_freeze(&a2, &asset(&env), &issuer, &t1);
        assert_eq!(client.get_active_proposal_count(), 1);

        let remaining = client.get_active_proposals(&0, &10);
        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining.get(0).unwrap().1, t2);
    }

    #[test]
    fn test_frozen_asset_registry() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        assert_eq!(client.get_frozen_accounts_count(), 0);
        assert_eq!(client.is_account_frozen(&asset(&env), &target), false);

        // a1 votes (1 of 2) -> not yet frozen
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.is_account_frozen(&asset(&env), &target), false);

        // a2 votes -> reaches quorum -> marked frozen in registry!
        client.vote_freeze(&a2, &asset(&env), &issuer, &target);
        assert_eq!(client.is_account_frozen(&asset(&env), &target), true);
        assert_eq!(client.get_frozen_accounts_count(), 1);

        let list = client.get_frozen_accounts(&0, &10);
        assert_eq!(list.len(), 1);
        assert_eq!(list.get(0).unwrap().1, target);

        // Advance cooldown timestamp to allow unfreeze proposal
        env.ledger().with_mut(|li| {
            li.timestamp = 1000;
        });

        // Now initiate unfreeze flow: a1 votes
        client.vote_unfreeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.is_account_frozen(&asset(&env), &target), true);

        // a2 votes -> unfreeze executed -> removed from registry!
        client.vote_unfreeze(&a2, &asset(&env), &issuer, &target);
        assert_eq!(client.is_account_frozen(&asset(&env), &target), false);
        assert_eq!(client.get_frozen_accounts_count(), 0);
    }

    #[test]
    fn test_governance_info_summary() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let p1 = Address::generate(&env);
        let aud = Address::generate(&env);
        let wl = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        client.add_proposer(&a1, &p1);
        client.add_auditor(&a1, &aud);
        client.add_whitelist(&a1, &wl);
        client.set_timelock_delay(&a1, &3600);
        client.set_proposal_cooldown(&a1, &60);

        let info = client.get_governance_info();
        assert_eq!(info.admin_count, 2);
        assert_eq!(info.quorum, 2);
        assert_eq!(info.proposal_ttl, DEFAULT_PROPOSAL_TTL);
        assert_eq!(info.is_paused, false);
        assert_eq!(info.proposers_count, 1);
        assert_eq!(info.auditors_count, 1);
        assert_eq!(info.whitelist_count, 1);
        assert_eq!(info.timelock_delay, 3600);
        assert_eq!(info.proposal_cooldown, 60);
        assert_eq!(info.active_proposal_count, 0);
        assert_eq!(info.frozen_accounts_count, 0);
    }

    #[test]
    fn test_address_sanity_and_contract_self_freeze_guard() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let a1 = Address::generate(&env);
        let issuer = Address::generate(&env);

        // Reject duplicate admin in init
        let dup_err = client.try_init(&Vec::from_array(&env, [a1.clone(), a1.clone()]), &Some(1));
        assert_eq!(dup_err, Err(Ok(Error::InvalidParameter)));

        // Reject contract's own address as admin in init
        let self_admin_err = client.try_init(&Vec::from_array(&env, [cid.clone()]), &Some(1));
        assert_eq!(self_admin_err, Err(Ok(Error::InvalidParameter)));

        client.init(&Vec::from_array(&env, [a1.clone()]), &Some(1));
        env.mock_all_auths();

        // Reject caller attempting to freeze themselves
        let caller_self_err = client.try_vote_freeze(&a1, &asset(&env), &issuer, &a1);
        assert_eq!(caller_self_err, Err(Ok(Error::SelfFreezeNotAllowed)));

        // Reject attempting to freeze the governance contract address itself
        let contract_freeze_err = client.try_vote_freeze(&a1, &asset(&env), &issuer, &cid);
        assert_eq!(contract_freeze_err, Err(Ok(Error::InvalidParameter)));

        // Reject adding the governance contract address as admin
        let add_self_admin_err = client.try_add_admin(&a1, &cid);
        assert_eq!(add_self_admin_err, Err(Ok(Error::InvalidParameter)));
    }

    #[test]
    fn test_cpu_gas_metering_benchmark() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2, a3, a4, a5) = (
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        );
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(
            &Vec::from_array(
                &env,
                [
                    a1.clone(),
                    a2.clone(),
                    a3.clone(),
                    a4.clone(),
                    a5.clone(),
                ],
            ),
            &Some(3),
        );
        env.mock_all_auths();

        // Full 3-of-5 admin multisig proposal and voting cycle
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        client.vote_freeze(&a2, &asset(&env), &issuer, &target);
        client.vote_freeze(&a3, &asset(&env), &issuer, &target);

        assert_eq!(client.is_account_frozen(&asset(&env), &target), true);
        assert_eq!(client.get_active_proposal_count(), 0);
    }

    #[test]
    fn test_property_fuzz_proposals() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let admin_pool = [
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        ];

        client.init(
            &Vec::from_array(
                &env,
                [
                    admin_pool[0].clone(),
                    admin_pool[1].clone(),
                    admin_pool[2].clone(),
                ],
            ),
            &Some(2),
        );
        env.mock_all_auths();

        let issuer = Address::generate(&env);
        let valid_chars = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        // Generate synthetic asset codes of varying lengths (1 to 12 chars)
        for len in 1..=12 {
            let mut s = [0u8; 12];
            for i in 0..len {
                s[i] = valid_chars[(i * 7) % valid_chars.len()];
            }
            if let Ok(code_str) = core::str::from_utf8(&s[..len]) {
                let asset_code = String::from_str(&env, code_str);
                let target = Address::generate(&env);

                // Admin 1 votes
                let v1 = client.vote_freeze(&admin_pool[0], &asset_code, &issuer, &target);
                assert_eq!(v1, 1);
                assert_eq!(client.is_account_frozen(&asset_code, &target), false);

                // Admin 2 votes -> quorum reached
                let v2 = client.vote_freeze(&admin_pool[1], &asset_code, &issuer, &target);
                assert_eq!(v2, 2);
                assert_eq!(client.is_account_frozen(&asset_code, &target), true);
            }
        }
    }

    #[test]
    fn test_cap0077_adapter_invocations() {
        let env = Env::default();
        let (asset_code, issuer, target) = (
            String::from_str(&env, "USDC"),
            Address::generate(&env),
            Address::generate(&env),
        );

        let res_quarantine = cap0077::Cap0077Adapter::quarantine_trustline(&env, &asset_code, &issuer, &target);
        assert!(res_quarantine.is_ok());

        let res_release = cap0077::Cap0077Adapter::release_trustline(&env, &asset_code, &issuer, &target);
        assert!(res_release.is_ok());
    }

    #[test]
    fn test_quorum_percentage_dynamic_calculation() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let admins = [
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        ];

        client.init(
            &Vec::from_array(
                &env,
                [
                    admins[0].clone(),
                    admins[1].clone(),
                    admins[2].clone(),
                    admins[3].clone(),
                    admins[4].clone(),
                ],
            ),
            &Some(3),
        );
        env.mock_all_auths();

        // 5 admins, default quorum 3 -> (3 * 100) / 5 = 60%
        assert_eq!(client.get_quorum_percentage(), 60);

        // Set quorum to 67% (two-thirds supermajority): (5 * 67 + 99) / 100 = 434 / 100 = 4
        let q = client.set_quorum_percentage(&admins[0], &67);
        assert_eq!(q, 4);
        assert_eq!(client.get_quorum(), 4);

        // Set quorum to 100% (unanimous): (5 * 100 + 99) / 100 = 5
        let q100 = client.set_quorum_percentage(&admins[0], &100);
        assert_eq!(q100, 5);
        assert_eq!(client.get_quorum(), 5);

        // Invalid percentages rejected
        assert_eq!(client.try_set_quorum_percentage(&admins[0], &0), Err(Ok(Error::InvalidParameter)));
        assert_eq!(client.try_set_quorum_percentage(&admins[0], &101), Err(Ok(Error::InvalidParameter)));
    }

    #[test]
    fn test_e2e_freeze_and_unfreeze_governance_lifecycle() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2, a3) = (
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        );
        let proposer = Address::generate(&env);
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone(), a3.clone()]), &Some(2));
        env.mock_all_auths();

        // Register compliance analyst as proposer
        client.add_proposer(&a1, &proposer);
        assert_eq!(client.is_proposer(&proposer), true);

        // Proposer submits freeze proposal with evidence and reason code
        let evidence = String::from_str(&env, "ipfs://bafybeic789...");
        let uri = String::from_str(&env, "https://jira.corp/browse/INC-101");
        client.propose_freeze_with_metadata(
            &proposer,
            &asset(&env),
            &issuer,
            &target,
            &evidence,
            &(ReasonCode::CourtOrder as u32),
            &uri,
        );

        assert_eq!(client.get_active_proposal_count(), 1);
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::Active);

        // Admin 1 votes
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.is_account_frozen(&asset(&env), &target), false);

        // Admin 2 votes -> quorum reached -> account quarantined!
        client.vote_freeze(&a2, &asset(&env), &issuer, &target);
        assert_eq!(client.is_account_frozen(&asset(&env), &target), true);
        assert_eq!(client.get_active_proposal_count(), 0);

        // Remediation complete: initiation of unfreeze workflow
        client.vote_unfreeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.is_account_frozen(&asset(&env), &target), true);
        assert_eq!(client.get_active_proposal_count(), 1);

        // Admin 3 votes to unfreeze -> unfreeze quorum reached -> account released!
        client.vote_unfreeze(&a3, &asset(&env), &issuer, &target);
        assert_eq!(client.is_account_frozen(&asset(&env), &target), false);
        assert_eq!(client.get_active_proposal_count(), 0);
        assert!(client.get_action_sequence() >= 4);
    }

    #[test]
    fn test_prune_expired_batch() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let t1 = Address::generate(&env);
        let t2 = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        // Configure short TTL of 100 ledgers
        client.set_proposal_ttl(&a1, &100);

        client.vote_freeze(&a1, &asset(&env), &issuer, &t1);
        client.vote_freeze(&a1, &asset(&env), &issuer, &t2);
        assert_eq!(client.get_active_proposal_count(), 2);

        // Advance ledger beyond proposal TTL
        env.ledger().with_mut(|li| {
            li.sequence_number += 200;
        });

        let to_prune = Vec::from_array(
            &env,
            [
                (asset(&env), t1.clone(), false),
                (asset(&env), t2.clone(), false),
            ],
        );

        let pruned = client.prune_expired_batch(&a1, &to_prune);
        assert_eq!(pruned, 2);
        assert_eq!(client.get_active_proposal_count(), 0);
        assert_eq!(client.has_proposal(&asset(&env), &t1, &false), false);
        assert_eq!(client.has_proposal(&asset(&env), &t2, &false), false);
    }

    #[test]
    fn test_revoke_unfreeze_vote() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        // a1 votes on unfreeze
        client.vote_unfreeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.get_unfreeze_votes(&asset(&env), &target), 1);

        // a1 revokes unfreeze vote
        client.revoke_unfreeze_vote(&a1, &asset(&env), &target);
        assert_eq!(client.get_unfreeze_votes(&asset(&env), &target), 0);
    }

    #[test]
    fn test_proposal_exact_boundary_expiration() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        // Fixed TTL of 50 ledgers
        client.set_proposal_ttl(&a1, &50);

        // a1 creates proposal at current ledger sequence (e.g. 0)
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::Active);

        // Advance to exact boundary: created_ledger (0) + 50 = 50
        env.ledger().with_mut(|li| {
            li.sequence_number = 50;
        });

        // Still active and valid at exact boundary
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::Active);
        let prune_premature = client.try_prune_expired(&a1, &asset(&env), &target, &false);
        assert_eq!(prune_premature, Err(Ok(Error::InvalidParameter)));

        // Advance 1 ledger past boundary: 51
        env.ledger().with_mut(|li| {
            li.sequence_number = 51;
        });

        // Now expired
        assert_eq!(client.get_proposal_status(&asset(&env), &target, &false), ProposalStatus::Expired);

        // Further voting rejected with ProposalExpired
        let vote_late = client.try_vote_freeze(&a2, &asset(&env), &issuer, &target);
        assert_eq!(vote_late, Err(Ok(Error::ProposalExpired)));

        // Pruning now succeeds
        let prune_ok = client.try_prune_expired(&a1, &asset(&env), &target, &false);
        assert!(prune_ok.is_ok());
        assert_eq!(client.has_proposal(&asset(&env), &target, &false), false);
    }

    #[test]
    fn test_cross_vote_mutual_exclusion_and_revoke_negative_vote() {
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

        // a1 proposes freeze (and votes YES)
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);
        assert_eq!(client.get_votes(&asset(&env), &target), 1);

        // a1 cannot vote NO (AlreadyVoted)
        let a1_vote_no = client.try_vote_against(&a1, &asset(&env), &target, &false);
        assert_eq!(a1_vote_no, Err(Ok(Error::AlreadyVoted)));

        // a2 votes NO
        assert_eq!(client.vote_against(&a2, &asset(&env), &target, &false), 1);
        assert_eq!(client.get_negative_votes(&asset(&env), &target, &false), 1);

        // a2 cannot now vote YES (AlreadyVoted)
        let a2_vote_yes = client.try_vote_freeze(&a2, &asset(&env), &issuer, &target);
        assert_eq!(a2_vote_yes, Err(Ok(Error::AlreadyVoted)));

        // a2 revokes their negative vote
        let rem_neg = client.revoke_negative_vote(&a2, &asset(&env), &target, &false);
        assert_eq!(rem_neg, 0);
        assert_eq!(client.get_negative_votes(&asset(&env), &target, &false), 0);

        // Now a2 can cast affirmative vote YES, reaching quorum!
        assert_eq!(client.vote_freeze(&a2, &asset(&env), &issuer, &target), 2);
        assert!(client.is_account_frozen(&asset(&env), &target));
    }

    #[test]
    fn test_batch_asset_freeze_stress() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        let asset_names = [
            "USDC", "EURC", "AUDD", "ARST", "BRLA", "NGNT",
            "TZS", "KES", "INRC", "STELLARUSD12", "REALESTATE01", "COMMODITYOIL"
        ];
        let mut asset_vec = Vec::new(&env);
        for name in asset_names.iter() {
            asset_vec.push_back(String::from_str(&env, name));
        }

        let empty_hash = String::from_str(&env, "");

        // First admin votes across all 12 assets in a single call
        let first_round = client.batch_asset_vote_freeze(&a1, &target, &asset_vec, &issuer, &empty_hash);
        assert_eq!(first_round.len(), 12);
        for i in 0..12 {
            assert_eq!(first_round.get(i).unwrap(), 1);
            let code = asset_vec.get(i).unwrap();
            assert_eq!(client.get_proposal_status(&code, &target, &false), ProposalStatus::Active);
            assert_eq!(client.is_account_frozen(&code, &target), false);
        }

        // Second admin completes quorum across all 12 assets
        let second_round = client.batch_asset_vote_freeze(&a2, &target, &asset_vec, &issuer, &empty_hash);
        assert_eq!(second_round.len(), 12);
        for i in 0..12 {
            assert_eq!(second_round.get(i).unwrap(), 2);
            let code = asset_vec.get(i).unwrap();
            assert!(client.is_account_frozen(&code, &target));
            assert_eq!(client.get_proposal_status(&code, &target, &false), ProposalStatus::None);
        }
    }

    #[test]
    fn test_custom_event_topic_filter() {
        let env = Env::default();
        let cid = env.register_contract(None, FreezeGovernance);
        let client = FreezeGovernanceClient::new(&env, &cid);

        let (a1, a2) = (Address::generate(&env), Address::generate(&env));
        let issuer = Address::generate(&env);
        let target = Address::generate(&env);

        client.init(&Vec::from_array(&env, [a1.clone(), a2.clone()]), &Some(2));
        env.mock_all_auths();

        // Perform proposal and vote
        client.vote_freeze(&a1, &asset(&env), &issuer, &target);

        let events = env.events().all();
        assert!(events.len() > 0);

        let mut matched_topics = false;
        for i in 0..events.len() {
            let (contract_id, topics, _data) = events.get(i).unwrap();
            if contract_id == cid && topics.len() > 0 {
                matched_topics = true;
            }
        }
        assert!(matched_topics);
    }
}
