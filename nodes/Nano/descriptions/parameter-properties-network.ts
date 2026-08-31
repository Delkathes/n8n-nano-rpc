import type { INodeProperties } from 'n8n-workflow';

export const networkNanoRPCParameterProperties: INodeProperties[] = [
	{
		displayName: 'Peer Address',
		name: 'peerAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['keepalive'],
			},
		},
		default: '',
		placeholder: '::1 or 192.168.1.1',
		description: 'Peer IP address',
	},
	{
		displayName: 'Peer Port',
		name: 'peerPort',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				operation: ['keepalive'],
			},
		},
		default: 7075,
		description: 'Peer port number',
	},
	{
		displayName: 'Include Peer Details',
		name: 'peerDetails',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['getPeers'],
			},
		},
		default: false,
		description:
			'Whether to include detailed peer info including node_id and connection type (v18.0+)',
	},
	{
		displayName: 'Sort by Weight',
		name: 'sorting',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['getRepresentatives'],
			},
		},
		default: false,
		description:
			'Whether to sort representatives by voting weight in descending order. Note: When enabled, the Count option is ignored and all representatives are returned sorted.',
	},
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getRepresentatives'],
				sorting: [false],
			},
		},
		default: 0,
		typeOptions: {
			minValue: 0,
		},
		hint: 'Set to 0 to return all representatives',
		description: 'Maximum number of representatives to return',
	},
	{
		displayName: 'Include Weight',
		name: 'includeWeight',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['representativesOnline'],
			},
		},
		default: false,
		description: 'Whether to include voting weight for each representative',
	},
	{
		displayName: 'Filter by Accounts',
		name: 'filterAccounts',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['representativesOnline'],
			},
		},
		default: '',
		placeholder: 'nano_1abc...,nano_2def...',
		hint: 'Leave empty to return all online representatives',
		description:
			'Comma-separated list of accounts to filter results (only returns representatives from this list that are online)',
	},
	{
		displayName: 'Stats Type',
		name: 'statsType',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['getStats'],
			},
		},
		options: [
			{ name: 'Counters', value: 'counters' },
			{ name: 'Samples', value: 'samples' },
			{ name: 'Objects', value: 'objects' },
		],
		default: 'counters',
		description: 'Type of statistics to retrieve',
	},
	{
		displayName: 'Raw Metrics',
		name: 'telemetryRaw',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['getTelemetry'],
			},
		},
		default: false,
		description: 'Whether to return metrics from all nodes with address and port for each peer',
	},
	{
		displayName: 'Specific Peer Address',
		name: 'telemetryAddress',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['getTelemetry'],
				telemetryRaw: [false],
			},
		},
		default: '',
		placeholder: '192.168.1.1 or ::ffff:192.168.1.1',
		hint: 'Leave empty to get aggregated telemetry from all peers',
		description: 'Get telemetry from a specific peer. Accepts both IPv4 and IPv6 addresses.',
	},
	{
		displayName: 'Specific Peer Port',
		name: 'telemetryPort',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['getTelemetry'],
				telemetryRaw: [false],
			},
		},
		default: 7075,
		description:
			'Port of the specific peer to get telemetry from (required if address is provided)',
	},
	{
		displayName: 'Republish Hash',
		name: 'republishHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['republish'],
			},
		},
		default: '',
		placeholder: 'Block hash to republish',
		description: 'Hash of block to republish',
	},
	{
		displayName: 'Count',
		name: 'republishCount',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['republish'],
			},
		},
		default: 1,
		typeOptions: {
			minValue: 1,
		},
		description: 'Number of blocks to republish (starts from the given hash)',
	},
	{
		displayName: 'Sources',
		name: 'sources',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['republish'],
			},
		},
		default: 2,
		description: 'Number of source peers',
	},
	{
		displayName: 'Destinations',
		name: 'destinations',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['republish'],
			},
		},
		default: 2,
		description: 'Number of destination peers',
	},
	{
		displayName: 'Bootstrap Address',
		name: 'bootstrapAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['bootstrap'],
			},
		},
		default: '',
		placeholder: '::1 or 192.168.1.1',
		description: 'IP address of the peer to bootstrap from',
	},
	{
		displayName: 'Bootstrap Port',
		name: 'bootstrapPort',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				operation: ['bootstrap'],
			},
		},
		default: 7075,
		description: 'Port of the peer to bootstrap from',
	},
	{
		displayName: 'Bypass Frontier Confirmation',
		name: 'bootstrapBypassFrontierConfirmation',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['bootstrap'],
			},
		},
		default: false,
		description: 'Whether to skip frontier confirmation during bootstrap (v20.0-21.3)',
	},
	{
		displayName: 'Bootstrap ID',
		name: 'bootstrapId',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['bootstrap', 'bootstrapAny', 'bootstrapLazy'],
			},
		},
		default: '',
		placeholder: 'my-bootstrap-001',
		description: 'Set a specific ID for the bootstrap attempt for tracking (v21.0+)',
	},
	{
		displayName: 'Force',
		name: 'bootstrapAnyForce',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['bootstrapAny'],
			},
		},
		default: false,
		description: 'Whether to force closing of all current bootstraps (v20.0+)',
	},
	{
		displayName: 'Target Account',
		name: 'bootstrapAnyAccount',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['bootstrapAny'],
			},
		},
		default: '',
		placeholder: 'nano_1abc...',
		description: 'Target a specific account for the bootstrap attempt (v22.0+)',
	},
];
