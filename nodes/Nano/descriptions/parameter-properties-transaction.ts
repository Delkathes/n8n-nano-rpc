import type { INodeProperties } from 'n8n-workflow';

export const transactionNanoRPCParameterProperties: INodeProperties[] = [
	{
		displayName: 'Wallet ID (Manual)',
		name: 'manualWalletId',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['send'],
			},
		},
		default: '',
		placeholder: 'Wallet ID',
		description:
			'Manually specify the wallet ID to send fund from (optional), default to credential wallet',
	},
	{
		displayName: 'Destination Address',
		name: 'destination',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['send'],
			},
		},
		default: '',
		placeholder: 'nano_1abc...',
		description: 'Nano address to send funds to',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['send'],
			},
		},
		default: '',
		placeholder: '0.5',
		hint: 'Up to 30 decimal places',
		description:
			'Amount to send in NANO as a decimal string (e.g. "1.234567890123456789012345678901"). Nano has 30 decimal places; use a string to avoid floating-point rounding.',
	},
	{
		displayName: 'Source Account',
		name: 'sourceAccount',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['send'],
			},
		},
		default: '',
		placeholder: 'nano_1xyz... (leave empty to use default)',
		description: 'Source account to send from. Leave empty to use default from credentials.',
	},
	{
		displayName: 'Idempotency ID',
		name: 'sendId',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['send'],
			},
		},
		default: '',
		placeholder: '7081e2b8fec9146e',
		hint: 'Highly recommended to prevent duplicate sends on retries',
		description:
			'Unique ID for this send request. If provided, calling send again with the same ID will return the original block instead of creating a duplicate transaction. Use a UUID or unique string per transaction.',
	},
	{
		displayName: 'External Work',
		name: 'sendWork',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['send'],
			},
		},
		default: '',
		placeholder: '2bf29ef00786a6bc',
		hint: 'Leave empty to let the node generate work',
		description:
			'Pre-computed work value (16 hexadecimal digits). When provided, disables work precaching for this account.',
	},
	{
		displayName: 'Threshold',
		name: 'threshold',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['receivable'],
			},
		},
		default: '',
		placeholder: '1000000000000000000000000',
		description: 'Minimum amount in raw (optional, v8.0+)',
	},
	{
		displayName: 'Include Source',
		name: 'receivableSource',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['receivable'],
			},
		},
		default: true,
		description: 'Whether to include source account information (v9.0+)',
	},
	{
		displayName: 'Include Active',
		name: 'receivableIncludeActive',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['receivable'],
			},
		},
		default: false,
		description: 'Whether to include active blocks without finished confirmations (v15.0+)',
	},
	{
		displayName: 'Min Version',
		name: 'receivableMinVersion',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['receivable'],
			},
		},
		default: false,
		description: 'Whether to return minimum epoch version required to receive each block (v15.0+)',
	},
	{
		displayName: 'Sort by Amount',
		name: 'receivableSorting',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['receivable'],
			},
		},
		default: false,
		description:
			'Whether to sort blocks by amount descending (v19.0+, v22.0+ for absolute sorting)',
	},
	{
		displayName: 'Confirmed Only',
		name: 'receivableIncludeOnlyConfirmed',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['receivable'],
			},
		},
		default: true,
		description: 'Whether to only return confirmed blocks (v19.0+, default true in v22.0+)',
	},
	{
		displayName: 'Wallet ID (Manual)',
		name: 'manualWalletId',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['receive'],
			},
		},
		default: '',
		placeholder: 'Wallet ID',
		description:
			'Manually specify the wallet ID to receive funds to (optional), default to credential wallet',
	},
	{
		displayName: 'Receiving Account',
		name: 'receivingAccount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['receive'],
			},
		},
		default: '',
		placeholder: 'nano_1abc...',
		description: 'Account that will receive the pending block',
	},
	{
		displayName: 'Include Active',
		name: 'receiveExistsIncludeActive',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['receivableExists'],
			},
		},
		default: false,
		description: 'Whether to include active blocks without finished confirmations (v15.0+)',
	},
	{
		displayName: 'Include Only Confirmed',
		name: 'receiveExistsIncludeOnlyConfirmed',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['receivableExists'],
			},
		},
		default: true,
		description: 'Whether to only return confirmed blocks (v19.0+, default true in v22.0+)',
	},
	{
		displayName: 'Work',
		name: 'receiveWork',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['receive'],
			},
		},
		default: '',
		placeholder: 'FFFF000000000000',
		description:
			'Optional precomputed work value (16 hexadecimal digits). Uses work value for block from external source and disables work precaching for this account (v9.0+).',
	},
	{
		displayName: 'Block JSON',
		name: 'blockJson',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				operation: ['processBlock'],
			},
		},
		default: '{}',
		description: 'Block data in JSON format',
	},
	{
		displayName: 'Subtype',
		name: 'subtype',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['processBlock'],
			},
		},
		options: [
			{ name: 'Change', value: 'change' },
			{ name: 'Epoch', value: 'epoch' },
			{ name: 'Open', value: 'open' },
			{ name: 'Receive', value: 'receive' },
			{ name: 'Send', value: 'send' },
		],
		default: 'send',
		description: 'Block subtype - highly recommended to prevent accidental operations (v18.0+)',
	},
	{
		displayName: 'Force',
		name: 'processForce',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['processBlock'],
			},
		},
		default: false,
		description: 'Whether to force fork resolution if block is not accepted (v13.1+)',
	},
	{
		displayName: 'Async',
		name: 'processAsync',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['processBlock'],
			},
		},
		default: false,
		description: 'Whether to process asynchronously and return immediately (v22.0+)',
	},
	{
		displayName: 'Epoch',
		name: 'epoch',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				operation: ['epochUpgrade'],
			},
		},
		default: 2,
		description: 'Epoch number',
	},
	{
		displayName: 'Epoch Key',
		name: 'epochKey',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['epochUpgrade'],
			},
		},
		default: '',
		placeholder: 'Private key for epoch signing',
		description: 'Private key for epoch upgrade',
	},
];
