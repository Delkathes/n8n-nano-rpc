import type { INodeProperties } from 'n8n-workflow';

export const debugNanoRPCParameterProperties: INodeProperties[] = [
	{
		displayName: 'Lazy Hash',
		name: 'lazyHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['bootstrapLazy'],
			},
		},
		default: '',
		placeholder: 'Block hash',
		description: 'Hash for lazy bootstrap',
	},
	{
		displayName: 'Force',
		name: 'force',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['bootstrapLazy'],
			},
		},
		default: false,
		description: 'Whether to force bootstrap',
	},
	{
		displayName: 'Minimum Read Time (Ms)',
		name: 'dbTxnMinReadTime',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getDatabaseTxnTracker'],
			},
		},
		default: 1000,
		description:
			'Return transactions held open for at least this many milliseconds (read operations)',
	},
	{
		displayName: 'Minimum Write Time (Ms)',
		name: 'dbTxnMinWriteTime',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getDatabaseTxnTracker'],
			},
		},
		default: 0,
		description:
			'Return transactions held open for at least this many milliseconds (write operations)',
	},
	{
		displayName: 'Unchecked Hash',
		name: 'uncheckedHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['getUncheckedBlock'],
			},
		},
		default: '',
		placeholder: 'Block hash',
		description: 'Hash of unchecked block',
	},
	{
		displayName: 'Unchecked Key',
		name: 'uncheckedKey',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['getUncheckedKeys'],
			},
		},
		default: '',
		placeholder: 'Starting key (optional)',
		description: 'Starting key for unchecked query (optional)',
	},
	{
		displayName: 'Count',
		name: 'uncheckedKeysCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getUncheckedKeys'],
			},
		},
		default: 10,
		typeOptions: {
			minValue: 1,
		},
		description: 'Number of unchecked keys to return',
	},
	{
		displayName: 'Count',
		name: 'uncheckedCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getUnchecked'],
			},
		},
		default: 10,
		typeOptions: {
			minValue: 1,
		},
		description: 'Number of unchecked blocks to return',
	},
	{
		displayName: 'Confirm Stop Node',
		name: 'stopNodeConfirmed',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['stopNode'],
			},
		},
		default: false,
		description:
			'Whether to confirm this will immediately shut down the configured Nano node. This action cannot be undone.',
	},
];
