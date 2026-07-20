import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class NanoApi implements ICredentialType {
	name = 'nanoApi';
	displayName = 'Nano API';
	icon = 'file:../nodes/Nano/nano.svg' as const;
	documentationUrl = 'https://docs.nano.org/commands/rpc-protocol/';
	properties: INodeProperties[] = [
		{
			displayName: 'RPC URL',
			name: 'rpcUrl',
			type: 'string',
			default: 'http://localhost:7076',
			description: 'URL of your Nano RPC node',
			placeholder: 'https://proxy.nanos.cc/proxy',
		},
		{
			displayName: 'Authentication Method',
			name: 'authMethod',
			type: 'options',
			options: [
				{
					name: 'None',
					value: 'none',
				},
				{
					name: 'Basic Auth',
					value: 'basic',
				},
				{
					name: 'API Key Header',
					value: 'apiKey',
				},
			],
			default: 'none',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					authMethod: ['basic'],
				},
			},
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				show: {
					authMethod: ['basic'],
				},
			},
		},
		{
			displayName: 'API Key Header Name',
			name: 'headerName',
			type: 'string',
			default: 'Authorization',
			displayOptions: {
				show: {
					authMethod: ['apiKey'],
				},
			},
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				show: {
					authMethod: ['apiKey'],
				},
			},
		},
		{
			displayName: 'Wallet ID',
			name: 'walletId',
			type: 'string',
			default: '',
			description: 'Your Nano wallet ID (required for sending payments)',
			placeholder: 'A1B2C3D4E5F6...',
		},
		{
			displayName: 'Default Source Account',
			name: 'sourceAccount',
			type: 'string',
			default: '',
			description: 'Default Nano account to send from',
			placeholder: 'nano_1abc...',
		},
		{
			displayName: 'Webhook Secret',
			name: 'webhookSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description:
				"Shared secret for HMAC-SHA256 verification of incoming webhook payloads. Must match the value configured in your Nano node's callback. Leave empty to skip verification (not recommended for public webhooks).",
			placeholder: 'your-secret-string',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'={{ $credentials.authMethod === "apiKey" ? ($credentials.headerName || "Authorization") : undefined }}':
					'={{ $credentials.authMethod === "apiKey" ? $credentials.apiKey : undefined }}',
			},
			auth: {
				username: '={{ $credentials.authMethod === "basic" ? $credentials.username : undefined }}',
				password: '={{ $credentials.authMethod === "basic" ? $credentials.password : undefined }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.rpcUrl}}',
			method: 'POST',
			body: {
				action: 'version',
			},
		},
	};
}
