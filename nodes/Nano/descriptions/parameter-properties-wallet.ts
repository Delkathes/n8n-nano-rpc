import type { INodeProperties } from 'n8n-workflow';

export const walletNanoRPCParameterProperties: INodeProperties[] = [
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['createAccount'],
			},
		},
		default: -1,
		description:
			'Index to create account for (v18.0+), starting with 0. Set to -1 or leave empty to use next available index.',
	},
	{
		displayName: 'Generate Work',
		name: 'createAccountWork',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['createAccount'],
			},
		},
		default: true,
		description:
			'Whether to generate work after creating account (v9.0+). Disabling can speed up account creation.',
	},
	{
		displayName: 'Target Wallet',
		name: 'targetWallet',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['accountMove'],
			},
		},
		default: '',
		placeholder: 'Target wallet ID',
		description: 'Wallet ID to move accounts to',
	},
	{
		displayName: 'Accounts to Move',
		name: 'accountsToMove',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['accountMove'],
			},
		},
		default: '',
		placeholder: 'nano_1abc...,nano_2def...',
		description: 'Comma-separated list of accounts to move',
	},
	{
		displayName: 'Account to Remove',
		name: 'accountToRemove',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['accountRemove'],
			},
		},
		default: '',
		placeholder: 'nano_1abc...',
		description: 'Account address to remove from wallet',
	},
	{
		displayName: 'Account',
		name: 'walletAccount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['accountRepresentativeSet', 'walletContains', 'workGet', 'workSet'],
			},
		},
		default: '',
		placeholder: 'nano_1abc...',
		description: 'Account address',
	},
	{
		displayName: 'Representative',
		name: 'representativeAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['accountRepresentativeSet', 'walletRepresentativeSet'],
			},
		},
		default: '',
		placeholder: 'nano_1rep...',
		description: 'Representative account address',
	},
	{
		displayName: 'External Work Value',
		name: 'accountRepSetWork',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['accountRepresentativeSet'],
			},
		},
		default: '',
		placeholder: '16-character hex string',
		description: 'Work value from external source (v9.0+). Disables work precaching if provided.',
	},
	{
		displayName: 'Number of Accounts',
		name: 'accountCount',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				operation: ['accountsCreate'],
			},
		},
		default: 1,
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
		},
		description: 'Number of accounts to create',
	},
	{
		displayName: 'Enable Work Generation',
		name: 'accountsCreateWork',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['accountsCreate'],
			},
		},
		default: false,
		description:
			'Whether to enable work generation after creating accounts (v11.2+, disabled by default)',
	},
	{
		displayName: 'Password',
		name: 'walletPassword',
		type: 'string',
		typeOptions: {
			password: true,
		},
		required: true,
		displayOptions: {
			show: {
				operation: ['passwordChange', 'passwordEnter'],
			},
		},
		default: '',
		description: 'Wallet password',
	},
	{
		displayName: 'Minimum Amount (Raw)',
		name: 'minimumAmount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['receiveMinimumSet'],
			},
		},
		default: '',
		placeholder: '1000000000000000000000000',
		description: 'Minimum receive threshold in raw units',
	},
	{
		displayName: 'Search Wallet',
		name: 'searchWallet',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['searchReceivable'],
			},
		},
		default: '',
		placeholder: 'Wallet ID',
		description: 'Wallet ID to search for receivable blocks',
	},
	{
		displayName:
			'Security notice: importing a private key gives this workflow full control over the corresponding account. Prefer wallet-managed operations when possible and treat pasted keys as compromised if they ever appear in logs, exports, or chat history.',
		name: 'walletPrivateKeySecurityNotice',
		type: 'notice',
		displayOptions: {
			show: {
				operation: ['walletAdd'],
			},
		},
		default: '',
	},
	{
		displayName: 'Private Key',
		name: 'walletPrivateKey',
		type: 'string',
		typeOptions: {
			password: true,
		},
		required: true,
		displayOptions: {
			show: {
				operation: ['walletAdd'],
			},
		},
		default: '',
		placeholder: '64-character hex string',
		description: 'Private key to add to wallet',
	},
	{
		displayName: 'Disable Work Generation',
		name: 'walletAddDisableWork',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['walletAdd'],
			},
		},
		default: false,
		description: 'Whether to disable work generation after adding account (v9.0+)',
	},
	{
		displayName: 'Watch Accounts',
		name: 'watchAccounts',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['walletAddWatch'],
			},
		},
		default: '',
		placeholder: 'nano_1abc...,nano_2def...',
		description: 'Comma-separated list of accounts to watch',
	},
	{
		displayName: 'Balance Threshold',
		name: 'balanceThreshold',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['walletBalances', 'walletReceivable'],
			},
		},
		default: '',
		placeholder: '1000000000000000000000000',
		description: 'Minimum balance threshold in raw (optional)',
	},
	{
		displayName:
			'Security notice: replacing or supplying a wallet seed can re-derive every account in that wallet. Only use trusted seeds, avoid storing them in workflow data, and rotate the wallet if the seed may have been exposed.',
		name: 'walletSeedSecurityNotice',
		type: 'notice',
		displayOptions: {
			show: {
				operation: ['walletChangeSeed', 'walletCreate'],
			},
		},
		default: '',
	},
	{
		displayName: 'New Seed',
		name: 'newSeed',
		type: 'string',
		typeOptions: {
			password: true,
		},
		required: true,
		displayOptions: {
			show: {
				operation: ['walletChangeSeed'],
			},
		},
		default: '',
		placeholder: '64-character hex string',
		description: 'New seed for wallet',
	},
	{
		displayName: 'Restore Count',
		name: 'restoreCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['walletChangeSeed', 'walletCreate'],
			},
		},
		default: 0,
		description: 'Number of accounts to restore (0 for none)',
	},
	{
		displayName: 'Initial Seed',
		name: 'initialSeed',
		type: 'string',
		typeOptions: {
			password: true,
		},
		displayOptions: {
			show: {
				operation: ['walletCreate'],
			},
		},
		default: '',
		placeholder: '64-character hex string (optional)',
		description: 'Initial seed for wallet (optional, random if empty)',
	},
	{
		displayName: 'Wallet to Destroy',
		name: 'walletToDestroy',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['walletDestroy'],
			},
		},
		default: '',
		placeholder: 'Wallet ID',
		description: 'Wallet ID to destroy',
	},
	{
		displayName: 'Modified Since',
		name: 'modifiedSince',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['walletHistory', 'walletLedger'],
			},
		},
		default: 0,
		description: 'Unix timestamp to filter results (0 for all)',
	},
	{
		displayName: 'Include Representative',
		name: 'includeRepresentative',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['walletLedger'],
			},
		},
		default: false,
		description: 'Whether to include representative info',
	},
	{
		displayName: 'Include Weight',
		name: 'includeWeight',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['walletLedger'],
			},
		},
		default: false,
		description: 'Whether to include weight info',
	},
	{
		displayName: 'Include Receivable',
		name: 'includeReceivable',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['walletLedger'],
			},
		},
		default: false,
		description:
			'Whether to include receivable balance info (replaces deprecated pending parameter)',
	},
	{
		displayName: 'Count',
		name: 'walletReceivableCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['walletReceivable'],
			},
		},
		default: 10,
		typeOptions: {
			minValue: 1,
		},
		description: 'Number of receivable blocks to return',
	},
	{
		displayName: 'Include Source',
		name: 'includeSource',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['walletReceivable'],
			},
		},
		default: true,
		description: 'Whether to include source account info',
	},
	{
		displayName: 'Include Active',
		name: 'walletReceivableIncludeActive',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['walletReceivable'],
			},
		},
		default: false,
		description: 'Whether to include active blocks without finished confirmations (v15.0+)',
	},
	{
		displayName: 'Include Only Confirmed',
		name: 'walletReceivableIncludeOnlyConfirmed',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['walletReceivable'],
			},
		},
		default: true,
		description: 'Whether to only return confirmed blocks (v19.0+, default true in v22.0+)',
	},
	{
		displayName: 'Update Existing Accounts',
		name: 'updateExisting',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['walletRepresentativeSet'],
			},
		},
		default: true,
		description: 'Whether to update existing accounts to the new representative',
	},
	{
		displayName: 'Republish Count',
		name: 'republishCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['walletRepublish'],
			},
		},
		default: 1,
		description: 'Number of blocks to republish per account',
	},
	{
		displayName: 'Work Value',
		name: 'workValue',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['workSet'],
			},
		},
		default: '',
		placeholder: 'Work hex string',
		description: 'Pre-computed work value',
	},
	{
		displayName: 'Wallet ID (Manual)',
		name: 'manualWalletId',
		type: 'string',
		displayOptions: {
			show: {
				operation: [
					'walletAdd',
					'walletAddWatch',
					'passwordChange',
					'walletChangeSeed',
					'walletLocked',
					'createAccount',
					'accountsCreate',
					'passwordEnter',
					'walletExport',
					'workGet',
					'receiveMinimum',
					'walletBalances',
					'walletFrontiers',
					'walletHistory',
					'walletInfo',
					'walletLedger',
					'walletReceivable',
					'walletRepresentative',
					'walletWorkGet',
					'listAccounts',
					'walletLock',
					'accountRemove',
					'walletRepublish',
					'accountRepresentativeSet',
					'workSet',
					'receiveMinimumSet',
					'walletRepresentativeSet',
					'passwordValid',
					'walletContains',
					'signBlock',
				],
			},
		},
		default: '',
		placeholder: 'Wallet ID',
		description: 'Manually specify the wallet ID (optional), default to credential wallet',
	},
	{
		displayName: 'Wallet (Manual)',
		name: 'manualWalletId',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['accountMove'],
			},
		},
		default: '',
		placeholder: 'Source wallet ID',
		description: 'Wallet ID to move accounts from (optional), default to credential wallet ID',
	},
];
