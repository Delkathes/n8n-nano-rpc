import {
	type IAuthenticate,
	type ICredentialDataDecryptedObject,
	type ICredentialTestRequest,
	type ICredentialType,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export class NanoApi implements ICredentialType {
	name = 'nanoApi';
	displayName = 'Nano API';
	icon = 'file:nano.svg' as const;
	documentationUrl = 'https://docs.nano.org/commands/rpc-protocol/';
	properties: INodeProperties[] = [
		{
			displayName: 'RPC URL',
			name: 'rpcUrl',
			type: 'string',
			default: 'http://localhost:7076',
			description:
				'URL of your Nano RPC node. For public proxies, e.g. https://rpc.nano.to (requires Bearer auth)',
			placeholder: 'https://rpc.nano.to',
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
					name: 'Bearer Token',
					value: 'bearer',
					description: 'Sends an "Authorization: Bearer <token>" header (used by rpc.nano.to)',
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
			displayName: 'Bearer Token',
			name: 'bearerToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description:
				'Token sent as "Authorization: Bearer <token>". Required by public proxies like rpc.nano.to',
			displayOptions: {
				show: {
					authMethod: ['bearer'],
				},
			},
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

	authenticate: IAuthenticate = async (
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> => {
		const authMethod = credentials.authMethod as string;

		if (authMethod === 'bearer' && credentials.bearerToken) {
			requestOptions.headers = {
				...requestOptions.headers,
				Authorization: `Bearer ${credentials.bearerToken}`,
			};
		} else if (authMethod === 'apiKey' && credentials.apiKey) {
			requestOptions.headers = {
				...requestOptions.headers,
				[(credentials.headerName as string) || 'Authorization']: credentials.apiKey as string,
			};
		} else if (authMethod === 'basic') {
			requestOptions.auth = {
				username: credentials.username as string,
				password: credentials.password as string,
			};
		}

		return requestOptions;
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
