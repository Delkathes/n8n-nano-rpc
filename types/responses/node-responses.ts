/**
 * Node Response Types
 *
 * These types represent the transformed/formatted responses
 * returned by the n8n Nano node after processing RPC responses.
 * They are designed for end-user consumption in n8n workflows.
 */

import type { BlockContents } from '../rpc';

// ============ Account Responses ============

export interface BalanceResponse {
	account: string;
	balance: string;
	balanceRaw: string;
	pending: string;
	pendingRaw: string;
	balanceFormatted: string;
	pendingFormatted: string;
	/** Only present on node v24+ */
	receivable?: string;
	receivableRaw?: string;
}

export interface AccountInfoResponse {
	frontier: string;
	openBlock: string;
	representativeBlock: string;
	account: string;
	balance: string;
	balanceRaw: string;
	blockCount: string;
	pending?: string;
	pendingRaw?: string;
	weight?: string;
	representative?: string;
}

export interface AccountBlockCountResponse {
	account: string;
	blockCount: number;
}

export interface AccountKeyResponse {
	account: string;
	publicKey: string;
}

export interface AccountRepresentativeResponse {
	account: string;
	representative: string;
}

export interface AccountWeightResponse {
	account: string;
	weight: string;
	weightFormatted: string;
}

export interface HistoryTransaction {
	type: string;
	account: string;
	amount: string;
	amountRaw: string;
	hash: string;
	localTimestamp?: string;
}

export interface HistoryResponse {
	account: string;
	history: HistoryTransaction[];
	previous?: string;
}

export interface GetAccountsBalancesResponse {
	balances: Record<string, { balance: string; pending: string }>;
}

export interface GetAccountFromPublicKeyResponse {
	publicKey: string;
	account: string;
}

export interface GetAccountsFrontiersResponse {
	accounts: string[];
	frontiers: Record<string, string>;
}

export interface GetAccountsReceivableResponse {
	accounts: string[];
	receivable: {
		blocks: Record<string, string | { amount: string; source: string }>;
	};
}

export interface GetAccountsRepresentativesResponse {
	accounts: string[];
	representatives: Record<string, string>;
}

export interface ValidateResponse {
	address: string;
	valid: boolean;
}

// ============ Block Responses ============

export interface BlockInfoResponse {
	hash: string;
	amount?: string;
	balance?: string;
}

export interface BlockAccountResponse {
	blockHash: string;
	account: string;
}

export interface BlockCountResponse {
	count: string;
	unchecked: string;
	cemented: string;
}

export interface ConfirmBlockResponse {
	success: boolean;
	hash: string;
}

export interface GetBlocksResponse {
	blocks: Record<string, unknown>;
}

export interface GetBlocksInfoResponse {
	blocks: Record<string, unknown>;
}

export interface CreateBlockResponse {
	blockType: string;
	block: BlockContents;
}

export interface GetBlockHashResponse {
	hash: string;
	block: Record<string, unknown>;
}

// ============ Transaction Responses ============

export interface SendPaymentResponse {
	success: boolean;
	blockHash: string;
	destination: string;
	amount: string;
	amountRaw: string;
	source: string;
	timestamp: string;
	id: string;
}

export interface ReceiveResponse {
	success: boolean;
	receivingAccount: string;
	receivedBlockHash: string;
	originalBlockHash: string;
	timestamp: string;
}

export interface PendingBlock {
	hash: string;
	amount: string;
	amountRaw: string;
	source: string;
}

export interface ReceivableResponse {
	account: string;
	receivable: Record<string, unknown>;
}

export interface ReceivableExistsResponse {
	hash: string;
	exists: boolean;
}

export interface ProcessBlockResponse {
	success: boolean;
	hash: string;
	subtype: string;
	async: boolean;
}

export interface EpochUpgradeResponse {
	success: boolean;
	epoch: number;
	count: number;
	result: unknown;
}

// ============ Wallet Responses ============

export interface CreateAccountResponse {
	success: boolean;
	account: string;
	wallet: string;
	timestamp: string;
	workGenerated: boolean;
}

export interface ListAccountsResponse {
	wallet: string;
	accountCount: number;
	accounts: string[];
}

export interface AccountMoveResponse {
	success: boolean;
	moved: number;
}

export interface AccountRemoveResponse {
	success: boolean;
	removed: boolean;
}

export interface AccountRepresentativeSetResponse {
	success: boolean;
	block: string;
}

export interface AccountsCreateResponse {
	success: boolean;
	accounts: string[];
}

export interface PasswordChangeResponse {
	success: boolean;
	changed: boolean;
}

export interface PasswordEnterResponse {
	success: boolean;
	valid: boolean;
}

export interface PasswordValidResponse {
	valid: boolean;
}

export interface ReceiveMinimumResponse {
	amount: string;
	amountFormatted: string;
}

export interface ReceiveMinimumSetResponse {
	success: boolean;
}

export interface SearchReceivableResponse {
	success: boolean;
	started: boolean;
}

export interface SearchReceivableAllResponse {
	success: boolean;
}

export interface WalletAddResponse {
	success: boolean;
	account: string;
}

export interface WalletAddWatchResponse {
	success: boolean;
}

export interface WalletBalancesResponse {
	wallet: string;
	balances: Record<string, { balance: string; pending: string }>;
}

export interface WalletChangeSeedResponse {
	success: boolean;
	lastRestoredAccount: string;
	restoredCount: number;
}

export interface WalletContainsResponse {
	wallet: string;
	account: string;
	exists: boolean;
}

export interface WalletCreateResponse {
	success: boolean;
	wallet: string;
	lastRestoredAccount?: string;
	restoredCount?: number;
}

export interface WalletDestroyResponse {
	success: boolean;
	destroyed: boolean;
}

export interface WalletExportResponse {
	wallet: string;
	json: string;
}

export interface WalletFrontiersResponse {
	wallet: string;
	frontiers: Record<string, string>;
}

export interface WalletHistoryResponse {
	wallet: string;
	history: Array<{
		type: string;
		account: string;
		amount: string;
		block_account: string;
		hash: string;
		local_timestamp: string;
	}>;
}

export interface WalletInfoResponse {
	wallet: string;
	balance: string;
	pending: string;
	receivable: string;
	accountsCount: number;
	accountsBlockCount: number;
	accountsCementedBlockCount: number;
	adhocCount: number;
	deterministicCount: number;
	deterministicIndex: number;
}

export interface WalletLedgerResponse {
	wallet: string;
	accounts: Record<string, unknown>;
}

export interface WalletLockResponse {
	success: boolean;
	locked: boolean;
}

export interface WalletLockedResponse {
	wallet: string;
	locked: boolean;
}

export interface WalletReceivableResponse {
	wallet: string;
	blocks: Record<string, unknown>;
}

export interface WalletRepresentativeResponse {
	wallet: string;
	representative: string;
}

export interface WalletRepresentativeSetResponse {
	success: boolean;
	set: boolean;
}

export interface WalletRepublishResponse {
	success: boolean;
	blocks: string[];
}

export interface WalletWorkGetResponse {
	wallet: string;
	works: Record<string, string>;
}

export interface WorkGetResponse {
	wallet: string;
	account: string;
	work: string;
}

export interface WorkSetResponse {
	success: boolean;
}

// ============ Network Responses ============

export interface GetAvailableSupplyResponse {
	availableSupply: string;
	availableSupplyRaw: string;
}

export interface KeepaliveResponse {
	success: boolean;
	address: string;
	port: number;
}

export interface GetNodeIdResponse {
	private: string;
	public: string;
	as_account: string;
	node_id: string;
}

export interface GetPeersResponse {
	peers: Record<string, unknown>;
}

export interface PopulateBacklogResponse {
	success: boolean;
}

export interface GetRepresentativesResponse {
	representatives: Record<string, string>;
}

export interface RepresentativesOnlineResponse {
	representatives: Record<string, unknown>;
}

export interface RepublishResponse {
	success: boolean;
	hash: string;
	count: number;
	sources: number;
	destinations: number;
	blocks: string[];
}

export interface GetTelemetryResponse {
	block_count?: string;
	cemented_count?: string;
	unchecked_count?: string;
	account_count?: string;
	bandwidth_cap?: string;
	peer_count?: string;
	protocol_version?: string;
	uptime?: string;
	genesis_block?: string;
	major_version?: string;
	minor_version?: string;
	patch_version?: string;
	pre_release_version?: string;
	maker?: string;
	timestamp?: string;
	active_difficulty?: string;
}

export interface VersionResponse {
	rpc_version: string;
	store_version: string;
	protocol_version: string;
	node_vendor: string;
	store_vendor?: string;
	network: string;
	network_identifier: string;
	build_info: string;
}

export interface GetUptimeResponse {
	seconds: number;
}

// ============ Ledger Responses ============

export interface GetChainResponse {
	startingBlock: string;
	chain: string[];
}

export interface GetFrontiersResponse {
	startingAccount: string;
	frontiers: Record<string, string>;
}

export interface GetFrontierCountResponse {
	count: string;
}

export interface GetLedgerResponse {
	startingAccount: string;
	accounts: Record<string, unknown>;
}

export interface GetSuccessorsResponse {
	startingBlock: string;
	successors: string[];
}

export interface GetUnopenedResponse {
	accounts: Record<string, unknown>;
}

// ============ Confirmation Responses ============

export interface GetConfirmationActiveResponse {
	confirmations: string[];
	unconfirmed: string;
	confirmed: string;
}

export interface GetConfirmationHeightCurrentlyProcessingResponse {
	processing: Record<string, unknown>;
}

export interface GetConfirmationHistoryResponse {
	history: {
		confirmation_stats: {
			count: string;
			average: string;
		};
		confirmations: Array<{
			hash: string;
			duration: string;
			time: string;
			tally: string;
			final: string;
			blocks: string;
			voters: string;
			request_count: string;
		}>;
	};
}

export interface GetConfirmationInfoResponse {
	hash: string;
	announcements?: string;
	voters?: string;
	last_winner?: string;
	total_tally?: string;
	blocks?: Record<string, unknown>;
}

export interface GetConfirmationQuorumResponse {
	quorum: {
		quorum_delta: string;
		online_weight_quorum_percent: string;
		online_weight_minimum: string;
		online_stake_total: string;
		peers_stake_total: string;
		trended_stake_total: string;
	};
}

export interface GetElectionStatisticsResponse {
	statistics: {
		normal: string;
		priority: string;
		hinted: string;
		optimistic: string;
		total: string;
		aec_utilization_percentage: string;
		max_election_age: string;
		average_election_age: string;
	};
}

// ============ Work Responses ============

export interface GenerateWorkResponse {
	/** Hash used for work generation (v20.0+) */
	hash: string;
	/** Generated work value */
	work: string;
	/** Difficulty of the generated work (v19.0+) */
	difficulty: string;
	/** Multiplier from base difficulty (v19.0+) */
	multiplier: string;
}

export interface ValidateWorkResponse {
	work: string;
	hash: string;
	valid?: boolean;
	validAll: boolean;
	validReceive: boolean;
	difficulty: string;
	multiplier: number;
}

export interface CancelWorkResponse {
	success: boolean;
	hash: string;
}

export interface AddWorkPeerResponse {
	success: boolean;
	address: string;
	port: number;
}

export interface GetWorkPeersResponse {
	workPeers: string[];
}

export interface ClearWorkPeersResponse {
	success: boolean;
}

// ============ Key Responses ============

export interface CreateKeyResponse {
	success: boolean;
	private: string;
	public: string;
	account: string;
}

export interface SignResponse {
	signature: string;
}

export interface ExpandKeyResponse {
	privateKey: string;
	private: string;
	public: string;
	account: string;
}

export interface GetDeterministicKeyResponse {
	seed: string;
	index: number;
	private: string;
	public: string;
	account: string;
}

// ============ Representative Responses ============

export interface DelegatorsResponse {
	account: string;
	delegators: Record<string, string>;
	delegatorCount: number;
}

export interface DelegatorsCountResponse {
	account: string;
	delegatorCount: number;
}

// ============ Debug/Admin Responses ============

export interface BootstrapResponse {
	success: boolean;
	address: string;
	port: number;
}

export interface BootstrapAnyResponse {
	success: boolean;
}

export interface BootstrapLazyResponse {
	success: boolean;
	hash: string;
	force: boolean;
	keyInserted: boolean;
}

export interface GetBootstrapPrioritiesResponse {
	priorities: {
		account: string;
		priority: string;
	}[];
}

export interface ResetBootstrapResponse {
	success: boolean;
}

export interface GetBootstrapStatusResponse {
	bootstrap_threads: string;
	running_attempts_count: string;
	total_attempts_count: string;
	connections: {
		clients: string;
		connections: string;
		idle: string;
		target_connections: string;
		pulls: string;
	};
	attempts: {
		id: string;
		mode: string;
		started: string;
		pulling: string;
		total_blocks: string;
		requeued_pulls: string;
		frontier_pulls: string;
		account_count: string;
	}[];
}

export interface GetDatabaseTxnTrackerResponse {
	txn_tracking: {
		thread: string;
		time_held_open: string;
		write: string;
		stacktrace?: string[];
	}[];
}

export interface GetStatsResponse {
	type: string;
	created: string;
	entries: {
		time: string;
		type: string;
		detail: string;
		dir: string;
		value: string;
	}[];
}

export interface ClearStatsResponse {
	success: boolean;
}

export interface StopNodeResponse {
	success: boolean;
}

export interface GetUncheckedResponse {
	count: number;
	blocks: Record<string, unknown>;
}

export interface ClearUncheckedResponse {
	success: boolean;
}

export interface GetUncheckedBlockResponse {
	hash: string;
	block: BlockContents;
}

export interface GetUncheckedKeysResponse {
	keys: {
		key: string;
		hash: string;
		modified_timestamp: string;
		contents: BlockContents;
	}[];
}

// ============ Conversion Responses ============

export interface NanoToRawResponse {
	nano: string;
	raw: string;
}

export interface RawToNanoResponse {
	raw: string;
	nano: string;
}

// ============ Union Type ============

/**
 * Union of all possible node operation responses.
 * Used for generic response handling in the Nano node.
 */
export type NanoOperationResponse =
	// Account responses
	| BalanceResponse
	| AccountInfoResponse
	| AccountBlockCountResponse
	| AccountKeyResponse
	| AccountRepresentativeResponse
	| AccountWeightResponse
	| HistoryResponse
	| GetAccountsBalancesResponse
	| GetAccountFromPublicKeyResponse
	| GetAccountsFrontiersResponse
	| GetAccountsReceivableResponse
	| GetAccountsRepresentativesResponse
	| ValidateResponse
	// Block responses
	| BlockInfoResponse
	| BlockAccountResponse
	| BlockCountResponse
	| ConfirmBlockResponse
	| GetBlocksResponse
	| GetBlocksInfoResponse
	| CreateBlockResponse
	| GetBlockHashResponse
	// Transaction responses
	| SendPaymentResponse
	| ReceiveResponse
	| ReceivableResponse
	| ReceivableExistsResponse
	| ProcessBlockResponse
	| EpochUpgradeResponse
	// Wallet responses
	| CreateAccountResponse
	| ListAccountsResponse
	| AccountMoveResponse
	| AccountRemoveResponse
	| AccountRepresentativeSetResponse
	| AccountsCreateResponse
	| PasswordChangeResponse
	| PasswordEnterResponse
	| PasswordValidResponse
	| ReceiveMinimumResponse
	| ReceiveMinimumSetResponse
	| SearchReceivableResponse
	| SearchReceivableAllResponse
	| WalletAddResponse
	| WalletAddWatchResponse
	| WalletBalancesResponse
	| WalletChangeSeedResponse
	| WalletContainsResponse
	| WalletCreateResponse
	| WalletDestroyResponse
	| WalletExportResponse
	| WalletFrontiersResponse
	| WalletHistoryResponse
	| WalletInfoResponse
	| WalletLedgerResponse
	| WalletLockResponse
	| WalletLockedResponse
	| WalletReceivableResponse
	| WalletRepresentativeResponse
	| WalletRepresentativeSetResponse
	| WalletRepublishResponse
	| WalletWorkGetResponse
	| WorkGetResponse
	| WorkSetResponse
	// Network responses
	| GetAvailableSupplyResponse
	| KeepaliveResponse
	| GetNodeIdResponse
	| GetPeersResponse
	| PopulateBacklogResponse
	| GetRepresentativesResponse
	| RepresentativesOnlineResponse
	| RepublishResponse
	| GetTelemetryResponse
	| VersionResponse
	| GetUptimeResponse
	// Ledger responses
	| GetChainResponse
	| GetFrontiersResponse
	| GetFrontierCountResponse
	| GetLedgerResponse
	| GetSuccessorsResponse
	| GetUnopenedResponse
	// Confirmation responses
	| GetConfirmationActiveResponse
	| GetConfirmationHeightCurrentlyProcessingResponse
	| GetConfirmationHistoryResponse
	| GetConfirmationInfoResponse
	| GetConfirmationQuorumResponse
	| GetElectionStatisticsResponse
	// Work responses
	| GenerateWorkResponse
	| ValidateWorkResponse
	| CancelWorkResponse
	| AddWorkPeerResponse
	| GetWorkPeersResponse
	| ClearWorkPeersResponse
	// Key responses
	| CreateKeyResponse
	| SignResponse
	| ExpandKeyResponse
	| GetDeterministicKeyResponse
	// Representative responses
	| DelegatorsResponse
	| DelegatorsCountResponse
	// Debug/Admin responses
	| BootstrapResponse
	| BootstrapAnyResponse
	| BootstrapLazyResponse
	| GetBootstrapPrioritiesResponse
	| ResetBootstrapResponse
	| GetBootstrapStatusResponse
	| GetDatabaseTxnTrackerResponse
	| GetStatsResponse
	| ClearStatsResponse
	| StopNodeResponse
	| GetUncheckedResponse
	| ClearUncheckedResponse
	| GetUncheckedBlockResponse
	| GetUncheckedKeysResponse
	// Conversion responses
	| NanoToRawResponse
	| RawToNanoResponse;
