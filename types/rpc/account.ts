/**
 * Account-related RPC types
 */

// ============ RPC Response Types ============

/** Response from account_balance */
export interface AccountBalanceRPCResponse {
	balance: string;
	pending: string;
	/** Only present on node v24+ */
	receivable?: string;
}

/** Response from account_block_count */
export interface AccountBlockCountRPCResponse {
	block_count: string;
}

/** Response from account_get (public key to account) */
export interface AccountGetRPCResponse {
	account: string;
}

/** Response from account_key (account to public key) */
export interface AccountKeyRPCResponse {
	key: string;
}

/** Response from account_representative */
export interface AccountRepresentativeRPCResponse {
	representative: string;
}

/** Response from account_weight */
export interface AccountWeightRPCResponse {
	weight: string;
}

/** Response from accounts_balances */
export interface AccountsBalancesRPCResponse {
	balances: Record<string, { balance: string; pending: string; receivable: string }>;
	errors?: Record<string, string>;
}

/** Response from accounts_frontiers */
export interface AccountsFrontiersRPCResponse {
	frontiers: Record<string, string>;
}

/** Response from accounts_representatives */
export interface AccountsRepresentativesRPCResponse {
	representatives: Record<string, string>;
}

/** Response from validate_account_number */
export interface ValidateAccountRPCResponse {
	valid: string;
}

/** Raw RPC response from account_info */
export interface AccountInfoRPCResponse {
	frontier: string;
	open_block: string;
	representative_block: string;
	balance: string;
	modified_timestamp: string;
	block_count: string;
	account_version: string;
	confirmation_height: string;
	confirmation_height_frontier: string;
	representative?: string;
	weight?: string;
	pending?: string;
	receivable?: string;
	// Confirmed fields (include_confirmed option, v22.0+)
	confirmed_balance?: string;
	confirmed_height?: string;
	confirmed_frontier?: string;
	confirmed_representative?: string;
	confirmed_receivable?: string;
}

/** Raw RPC response from account_history */
export interface AccountHistoryRPCResponse {
	account: string;
	history: Array<{
		type: string;
		account: string;
		amount: string;
		local_timestamp: string;
		height: string;
		hash: string;
		confirmed: string;
		// For raw mode
		subtype?: string;
		previous?: string;
		representative?: string;
		balance?: string;
		link?: string;
		link_as_account?: string;
		signature?: string;
		work?: string;
		// For include_linked_account option (v28.0+)
		linked_account?: string;
	}>;
	previous?: string;
	// For reverse mode
	next?: string;
}

// ============ Options Types ============

/** Options for account_info */
export interface AccountInfoOptions {
	/** Include representative field (v9.0+, default true) */
	representative?: boolean;
	/** Include voting weight field (v9.0+, default true) */
	weight?: boolean;
	/** Include pending/receivable balance (v9.0+, default true) */
	pending?: boolean;
	/** Include receivable balance - alias for pending (default true) */
	receivable?: boolean;
	/** Include confirmed_* fields (v22.0+, default false) */
	includeConfirmed?: boolean;
}

/** Options for account_history pagination */
export interface AccountHistoryOptions {
	/** Output all block parameters instead of simplified send/receive (default: true) */
	raw?: boolean;
	/** Use this block as head instead of latest (for pagination) */
	head?: string;
	/** Skip this many blocks from head */
	offset?: number;
	/** If true, list from head/first block toward frontier */
	reverse?: boolean;
	/** Filter to only show sends/receives with these accounts */
	accountFilter?: string[];
	/** Include linked_account field in response (v28.0+) */
	includeLinkedAccount?: boolean;
}

/** Options for accounts_balances */
export interface AccountsBalancesOptions {
	/** If true (default), only includes confirmed blocks. Set to false to include unconfirmed. (v22.0+) */
	includeOnlyConfirmed?: boolean;
}

/** Options for accounts_receivable */
export interface AccountsReceivableOptions {
	/** Maximum number of blocks to return per account */
	count?: number;
	/** Minimum amount threshold in raw (v8.0+) */
	threshold?: string;
	/** Include source account information (v9.0+) */
	source?: boolean;
	/** Include active blocks without finished confirmations (v15.0+) */
	includeActive?: boolean;
	/** Sort by amount descending (v19.0+) */
	sorting?: boolean;
	/** Only return confirmed blocks (v19.0+, default true in v22.0+) */
	includeOnlyConfirmed?: boolean;
	/** Skip this many receivables from the start, for pagination (v19.0+) */
	offset?: number;
}
