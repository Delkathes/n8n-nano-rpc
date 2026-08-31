import type { INodeProperties } from 'n8n-workflow';

export const ledgerNanoRPCParameterProperties: INodeProperties[] = [
	{
		displayName: 'Starting Block',
		name: 'startingBlock',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['getSuccessors'],
			},
		},
		default: '',
		placeholder: 'Block hash',
		description: 'Block hash to start from',
	},
	{
		displayName: 'Offset',
		name: 'chainOffset',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getChain', 'getSuccessors'],
			},
		},
		default: 0,
		typeOptions: {
			minValue: 0,
		},
		description: 'Number of blocks to skip from the starting block (v18.0+)',
	},
	{
		displayName: 'Count',
		name: 'chainCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getChain'],
			},
		},
		default: 10,
		typeOptions: {
			minValue: 1,
		},
		description: 'Number of blocks to return',
	},
	{
		displayName: 'Reverse Direction',
		name: 'chainReverse',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['getChain', 'getSuccessors'],
			},
		},
		default: false,
		description:
			'Whether to reverse the direction of traversal. For chain: returns open→frontier instead of frontier→open. For successors: returns frontier→open instead of open→frontier (v18.0+).',
	},
	{
		displayName: 'Starting Account (Optional)',
		name: 'unopenedAccount',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['getUnopened'],
			},
		},
		default: '',
		placeholder: 'nano_1abc...',
		description: 'Starting account for unopened query (optional)',
	},
	{
		displayName: 'Count',
		name: 'unopenedCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getUnopened'],
			},
		},
		default: 10,
		typeOptions: {
			minValue: 1,
		},
		description: 'Number of unopened accounts to return',
	},
	{
		displayName: 'Count',
		name: 'successorsCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getSuccessors'],
			},
		},
		default: 10,
		typeOptions: {
			minValue: 1,
		},
		description: 'Number of successor blocks to return',
	},
	{
		displayName: 'Count',
		name: 'frontiersCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getFrontiers'],
			},
		},
		default: 10,
		typeOptions: {
			minValue: 1,
		},
		description: 'Number of accounts to return',
	},
	{
		displayName: 'Starting Account',
		name: 'startingAccount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['getFrontiers', 'getLedger'],
			},
		},
		default: '',
		placeholder: 'nano_1abc...',
		description: 'Account to start from',
	},
	{
		displayName: 'Count',
		name: 'ledgerCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getLedger'],
			},
		},
		default: 10,
		typeOptions: {
			minValue: 1,
		},
		hint: 'Ignored if Sort by Balance is enabled',
		description: 'Number of accounts to return',
	},
	{
		displayName: 'Include Representative',
		name: 'ledgerRepresentative',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['getLedger'],
			},
		},
		default: false,
		description: 'Whether to include representative for each account',
	},
	{
		displayName: 'Include Weight',
		name: 'ledgerWeight',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['getLedger'],
			},
		},
		default: false,
		description: 'Whether to include voting weight for each account',
	},
	{
		displayName: 'Include Receivable',
		name: 'ledgerReceivable',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['getLedger'],
			},
		},
		default: false,
		description: 'Whether to include receivable balance for each account',
	},
	{
		displayName: 'Modified Since',
		name: 'ledgerModifiedSince',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getLedger'],
			},
		},
		default: 0,
		typeOptions: {
			minValue: 0,
		},
		hint: 'Set to 0 to return all accounts regardless of modification time',
		description: 'Return only accounts modified after this UNIX timestamp (v11.0+)',
	},
	{
		displayName: 'Sort by Balance',
		name: 'ledgerSorting',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['getLedger'],
			},
		},
		default: false,
		description:
			'Whether to sort accounts by balance in descending order. Note: When enabled, the Count option is ignored.',
	},
	{
		displayName: 'Threshold (Raw)',
		name: 'ledgerThreshold',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['getLedger'],
			},
		},
		default: '',
		placeholder: '1000000000000000000000000000000',
		hint: 'Leave empty to return all accounts regardless of balance',
		description:
			'Return only accounts with balance above this threshold in raw (v19.0+). If Include Receivable is enabled, compares sum of balance and receivable.',
	},
];
