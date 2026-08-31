import {
	type IHookFunctions,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type INodeType,
	type INodeTypeDescription,
	type IDataObject,
	NodeOperationError,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { createHmac, timingSafeEqual } from 'crypto';

import { nanoToRaw, rawToNano } from '../../utils/conversions';

import { verifyBlockSignature } from '../../utils/block-signature';

import type { BlockContents } from '../../types';

/**
 * Filter options for Nano confirmations
 */
interface NanoFilterOptions {
	accounts?: string;
	subtypes?: string[];
	minAmount?: string;
	maxAmount?: string;
}

/**
 * Advanced options for Nano trigger
 */
interface NanoAdvancedOptions {
	includeBlock?: boolean;
	validateSignature?: boolean;
	enrichAccountInfo?: boolean;
	deduplicateHash?: boolean;
}

export class NanoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Nano Trigger',
		name: 'nanoTrigger',
		icon: {
			light: 'file:nano.svg',
			dark: 'file:nano.dark.svg',
		},
		group: ['trigger'],
		version: 1,
		subtitle: 'Webhook trigger',
		description: 'Receive Nano block confirmations via HTTP callback',
		defaults: {
			name: 'Nano Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'nanoApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Configuration Info',
				name: 'configNotice',
				type: 'notice',
				default:
					'Configure your Nano node to send HTTP callbacks to the webhook URL shown above. Only block confirmation events are supported via HTTP callbacks.',
			},
			{
				displayName: 'Filter Options',
				name: 'filterOptions',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				options: [
					{
						displayName: 'Accounts',
						name: 'accounts',
						type: 'string',
						default: '',
						placeholder: 'nano_1abc...,nano_2def...',
						description:
							'Comma-separated list of accounts to filter events for. Only events matching these accounts will trigger the workflow.',
					},
					{
						displayName: 'Block Subtypes',
						name: 'subtypes',
						type: 'multiOptions',
						default: [],
						options: [
							{ name: 'Send', value: 'send', description: 'Sending transactions' },
							{ name: 'Receive', value: 'receive', description: 'Receiving transactions' },
							{
								name: 'Change',
								value: 'change',
								description: 'Representative change blocks',
							},
							{ name: 'Epoch', value: 'epoch', description: 'Epoch upgrade blocks' },
						],
						description: 'Filter by block subtypes. Leave empty to receive all subtypes.',
					},
					{
						displayName: 'Minimum Amount (Nano)',
						name: 'minAmount',
						type: 'string',
						default: '',
						placeholder: '0.000001',
						description:
							'Only trigger for confirmations with at least this amount in NANO (decimal string). Leave empty to disable.',
					},
					{
						displayName: 'Maximum Amount (Nano)',
						name: 'maxAmount',
						type: 'string',
						default: '',
						placeholder: '10',
						description:
							'Only trigger for confirmations with at most this amount in NANO (decimal string). Leave empty to disable.',
					},
				],
			},
			{
				displayName: 'Advanced Options',
				name: 'advancedOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Include Block Contents',
						name: 'includeBlock',
						type: 'boolean',
						default: true,
						description: 'Whether to include full block contents in the response',
					},
					{
						displayName: 'Validate Block Signature',
						name: 'validateSignature',
						type: 'boolean',
						default: false,
						description: 'Whether to cryptographically verify the block signature (Ed25519) and that the block contents hash to the reported hash. No extra RPC call needed.',
					},
					{
						displayName: 'Enrich With Account Info',
						name: 'enrichAccountInfo',
						type: 'boolean',
						default: false,
						description:
							'Whether to fetch additional account information (balance, representative) via RPC',
					},
					{
						displayName: 'Deduplicate By Hash',
						name: 'deduplicateHash',
						type: 'boolean',
						default: true,
						description: 'Whether to prevent duplicate triggers for the same block hash',
					},
				],
			},
		],
	};

	// Deduplication constants
	private static readonly MAX_HASH_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
	private static readonly CLEANUP_THRESHOLD = 1000; // Cleanup when exceeding this many entries

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				return !!(staticData as Record<string, unknown>).webhookRegistered;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				(staticData as Record<string, unknown>).webhookRegistered = true;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				delete (staticData as Record<string, unknown>).webhookRegistered;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		// Get node parameters
		const filterOptions = this.getNodeParameter('filterOptions', {}) as NanoFilterOptions;
		const advancedOptions = this.getNodeParameter('advancedOptions', {}) as NanoAdvancedOptions;
		const credentials = await this.getCredentials('nanoApi');
		const webhookSecret = credentials.webhookSecret as string | undefined;

		// Default advanced options
		const includeBlock = advancedOptions.includeBlock !== false;
		const deduplicateHash = advancedOptions.deduplicateHash !== false;

		// Verify webhook signature if a secret is configured
		if (webhookSecret && webhookSecret.length > 0) {
			const isValid = verifyWebhookSignature(this, webhookSecret);
			if (!isValid) {
				throw new NodeOperationError(this.getNode(), 'Invalid webhook signature', {
					type: 'WebhookError',
				});
			}
		}

		// Parse incoming request data
		const bodyData = parseRequestBody(this);
		let parsedBlock: BlockContents;

		try {
			parsedBlock = JSON.parse(bodyData.block);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new NodeOperationError(
				this.getNode(),
				`Failed to parse block data from webhook payload: ${message}`,
			);
		}

		// Convert amount to Nano (display value; raw is authoritative)
		const amountNano = Number(rawToNano(bodyData.amount));

		// Build raw-unit filter thresholds from the decimal-string UI inputs
		let minAmountRaw: string | undefined;
		let maxAmountRaw: string | undefined;
		if (filterOptions.minAmount && filterOptions.minAmount.trim().length > 0) {
			minAmountRaw = filterAmountToRaw(this, filterOptions.minAmount, 'Minimum Amount');
		}
		if (filterOptions.maxAmount && filterOptions.maxAmount.trim().length > 0) {
			maxAmountRaw = filterAmountToRaw(this, filterOptions.maxAmount, 'Maximum Amount');
		}

		// Get workflow-scoped static data for deduplication
		let seenHashes: Record<string, number> = {};
		if (deduplicateHash) {
			const staticData = this.getWorkflowStaticData('node');
			if (!staticData.seenHashes) {
				staticData.seenHashes = {};
			}
			seenHashes = staticData.seenHashes as Record<string, number>;

			// Periodic cleanup of old entries
			if (Object.keys(seenHashes).length > NanoTrigger.CLEANUP_THRESHOLD) {
				const cutoff = Date.now() - NanoTrigger.MAX_HASH_AGE_MS;
				for (const hash of Object.keys(seenHashes)) {
					if (seenHashes[hash] < cutoff) {
						delete seenHashes[hash];
					}
				}
			}
		}

		// Apply filters
		if (shouldFilterWebhook(bodyData, filterOptions, minAmountRaw, maxAmountRaw)) {
			return { noWebhookResponse: true };
		}

		// Deduplicate by block hash (applied last so filtered events do not
		// consume the dedup slot)
		if (deduplicateHash && bodyData.hash && isDuplicateHash(bodyData.hash, seenHashes)) {
			return { noWebhookResponse: true };
		}

		// Build base response
		const webhookData = buildWebhookResponse(bodyData, parsedBlock, amountNano, includeBlock);

		// Optional: Validate block signature (cryptographic, client-side)
		if (advancedOptions.validateSignature && parsedBlock) {
			webhookData.signatureValid = verifyBlockSignature(parsedBlock, bodyData.hash);
		}

		// Optional: Enrich with account info
		if (advancedOptions.enrichAccountInfo && bodyData.account) {
			webhookData.accountInfo = await fetchAccountInfo(this, bodyData.account);
		}

		return {
			workflowData: [this.helpers.returnJsonArray([webhookData])],
		};
	}
}

/**
 * Raw HTTP callback payload from Nano node
 */
interface NanoCallbackPayload {
	account: string;
	hash: string;
	block: string;
	amount: string;
	subtype: string;
}

/**
 * Account info response from RPC
 */
interface NanoAccountInfo {
	balance: string;
	balanceRaw: string;
	representative: string;
	blockCount: string;
	weight: string;
	pending: string;
}

/**
 * Webhook response data
 */
interface NanoWebhookData extends IDataObject {
	topic: string;
	receivedAt: string;

	account: string;
	hash: string;
	subtype: string;

	amountRaw: string;
	amountNano: number;

	block?: BlockContents;
	signatureValid?: boolean;
	accountInfo?: NanoAccountInfo | null;
}

/**
 * Verifies the HMAC-SHA256 signature of the incoming webhook payload.
 * The Nano node sends the signature in the nano_callback_auth header (hex-encoded).
 * Returns true if verification passes or no header is present; false otherwise.
 */
function verifyWebhookSignature(context: IWebhookFunctions, secret: string): boolean {
	try {
		const req = context.getRequestObject();
		const authHeader: string | undefined = req.headers?.nano_callback_auth as string | undefined;

		if (!authHeader) {
			return false;
		}

		const rawBody = req.rawBody;
		if (!rawBody) {
			return false;
		}

		const bodyBuffer = Buffer.isBuffer(rawBody)
			? rawBody
			: Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody), 'utf8');
		if (bodyBuffer.length === 0) {
			return false;
		}

		const expectedSig = Buffer.from(authHeader, 'hex');
		const computedHmac = createHmac('sha256', secret).update(bodyBuffer).digest();

		if (expectedSig.length !== computedHmac.length) {
			return false;
		}

		return timingSafeEqual(expectedSig, computedHmac);
	} catch {
		return false;
	}
}

/**
 * Parses the request body data
 */
function parseRequestBody(context: IWebhookFunctions): NanoCallbackPayload {
	let bodyData;

	try {
		bodyData = context.getBodyData();
	} catch {
		bodyData = {};
	}

	// Fallback to raw body if needed
	if (!bodyData || Object.keys(bodyData).length === 0) {
		const req = context.getRequestObject();
		const rawBody = req.rawBody || req.body;

		if (typeof rawBody === 'string') {
			try {
				bodyData = JSON.parse(rawBody);
			} catch {
				// Failed to parse
			}
		} else if (rawBody) {
			bodyData = rawBody;
		}
	}

	return bodyData;
}

/**
 * Fetches account information via RPC call
 */
async function fetchAccountInfo(
	context: IWebhookFunctions,
	account: string,
): Promise<NanoAccountInfo | null> {
	try {
		const credentials = await context.getCredentials('nanoApi');
		const rpcUrl = credentials.rpcUrl as string;

		const httpRequestWithAuthentication =
			context.helpers.httpRequestWithAuthentication.bind(context);

		const accountInfo = await httpRequestWithAuthentication('nanoApi', {
			method: 'POST',
			url: rpcUrl,
			body: {
				action: 'account_info',
				account,
				representative: true,
				weight: true,
				pending: true,
			},
			json: true,
			timeout: 10000,
		});

		return {
			balance: rawToNano(accountInfo.balance),
			balanceRaw: accountInfo.balance,
			representative: accountInfo.representative,
			blockCount: accountInfo.block_count,
			weight: accountInfo.weight,
			pending: accountInfo.pending,
		};
	} catch {
		// Account might not exist yet
		return null;
	}
}

function buildWebhookResponse(
	bodyData: NanoCallbackPayload,
	parsedBlock: BlockContents,
	amountNano: number,
	includeBlock: boolean,
): NanoWebhookData {
	const webhookData: NanoWebhookData = {
		topic: 'confirmation',
		receivedAt: new Date().toISOString(),
		account: bodyData.account,
		hash: bodyData.hash,
		subtype: bodyData.subtype,
		amountRaw: bodyData.amount,
		amountNano: amountNano,
	};

	// Block data (all other block fields are inside this object)
	if (parsedBlock && includeBlock) {
		webhookData.block = parsedBlock;
	}

	return webhookData;
}

/**
 * Validates if a block hash has been seen before (deduplication)
 * Uses a Record with timestamps for automatic cleanup of old entries
 */
export function isDuplicateHash(hash: string, seenHashes: Record<string, number>): boolean {
	if (seenHashes[hash]) {
		return true;
	}

	// Store hash with current timestamp
	seenHashes[hash] = Date.now();
	return false;
}

/**
 * Validates if account matches filter criteria
 */
export function isAccountAllowed(
	account: string | undefined,
	filterAccounts: string | undefined,
): boolean {
	if (!filterAccounts || !account) {
		return true; // No filter or no account = pass through
	}

	const allowedAccounts = filterAccounts
		.split(',')
		.map((a) => a.trim())
		.filter((a) => a);

	if (allowedAccounts.length === 0) {
		return true;
	}

	return allowedAccounts.includes(account);
}

/**
 * Validates if block subtype matches filter criteria
 */
export function isSubtypeAllowed(
	subtype: string | undefined,
	filterSubtypes: string[] | undefined,
): boolean {
	if (!filterSubtypes || filterSubtypes.length === 0) {
		return true; // No filter = pass through
	}

	if (!subtype) {
		return false; // Filter exists but no subtype = reject
	}

	return filterSubtypes.includes(subtype);
}

/**
 * Convert a user-supplied NANO decimal string filter threshold to raw units,
 * throwing a clear error when the input is malformed.
 */
function filterAmountToRaw(context: IWebhookFunctions, input: string, label: string): string {
	const trimmed = input.trim();
	if (!/^\d+(\.\d{1,30})?$/.test(trimmed)) {
		throw new NodeOperationError(
			context.getNode(),
			`${label} filter must be a decimal string with up to 30 decimal places: "${input}"`,
		);
	}
	return nanoToRaw(trimmed);
}

/**
 * Validates if amount is within min/max range
 * Comparisons are done on raw-unit strings with BigInt to avoid precision loss.
 */
export function isAmountInRange(
	amountRaw: string | undefined,
	minAmountRaw: string | undefined,
	maxAmountRaw: string | undefined,
): boolean {
	if (!amountRaw) {
		return true; // No amount data = pass through
	}

	const amount = BigInt(amountRaw);

	if (minAmountRaw !== undefined) {
		if (amount < BigInt(minAmountRaw)) {
			return false;
		}
	}

	if (maxAmountRaw !== undefined) {
		if (amount > BigInt(maxAmountRaw)) {
			return false;
		}
	}

	return true;
}

/**
 * Applies all filters to determine if webhook should trigger
 * Returns true if the webhook should be rejected (filtered out)
 * Deduplication is handled separately by the caller (after filters).
 */
export function shouldFilterWebhook(
	bodyData: NanoCallbackPayload,
	filterOptions: NanoFilterOptions,
	minAmountRaw: string | undefined,
	maxAmountRaw: string | undefined,
): boolean {
	// Account filter
	if (!isAccountAllowed(bodyData.account, filterOptions.accounts)) {
		return true;
	}

	// Subtype filter
	if (!isSubtypeAllowed(bodyData.subtype, filterOptions.subtypes)) {
		return true;
	}

	// Amount filter
	if (!isAmountInRange(bodyData.amount, minAmountRaw, maxAmountRaw)) {
		return true;
	}

	return false; // All filters passed
}
