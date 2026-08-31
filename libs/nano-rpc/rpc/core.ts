import { NodeOperationError, type IExecuteFunctions, type IHttpRequestMethods } from 'n8n-workflow';
import type { INanoRPCConfig, INanoRPCResponse } from '../../../types/rpc';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;

function shouldRetry(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;

	const candidate = error as {
		message?: string;
		name?: string;
		code?: string;
		statusCode?: number;
		httpCode?: string | number;
	};

	const statusCode =
		typeof candidate.statusCode === 'number'
			? candidate.statusCode
			: typeof candidate.httpCode === 'number'
				? candidate.httpCode
				: typeof candidate.httpCode === 'string'
					? parseInt(candidate.httpCode, 10)
					: undefined;

	if (typeof statusCode === 'number') {
		return statusCode === 408 || statusCode === 429 || statusCode >= 500;
	}

	const text =
		`${candidate.name ?? ''} ${candidate.code ?? ''} ${candidate.message ?? ''}`.toLowerCase();

	return (
		text.includes('timeout') ||
		text.includes('timed out') ||
		text.includes('econnreset') ||
		text.includes('econnrefused') ||
		text.includes('enotfound') ||
		text.includes('socket hang up')
	);
}

function redactParams(input: Record<string, unknown>): Record<string, unknown> {
	const sensitiveKeys = new Set([
		'key',
		'private_key',
		'seed',
		'password',
		'wallet',
		'account',
		'source',
		'destination',
		'hash',
		'link',
		'work',
		'amount',
		'json_block',
	]);

	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(input)) {
		if (sensitiveKeys.has(key.toLowerCase())) {
			result[key] = '[REDACTED]';
			continue;
		}
		if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			result[key] = redactParams(value as Record<string, unknown>);
			continue;
		}
		result[key] = value;
	}

	return result;
}

/**
 * Make RPC call to Nano node using n8n's HTTP helper
 */
export async function nanoRPCCall<T = INanoRPCResponse>(
	context: IExecuteFunctions,
	config: INanoRPCConfig,
	action: string,
	params: Record<string, unknown> = {},
): Promise<T> {
	const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;

	const requestBody = {
		action,
		...params,
	};

	const httpRequestWithAuth = context.helpers.httpRequestWithAuthentication.bind(context);

	let lastError: unknown;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const data = await httpRequestWithAuth('nanoApi', {
				method: 'POST' as IHttpRequestMethods,
				url: config.rpcUrl,
				headers: {
					'Content-Type': 'application/json',
					...(config.headers || {}),
				},
				body: requestBody,
				timeout: timeoutMs,
				json: true,
			});

			// Check for RPC errors
			if (data.error) {
				throw new NodeOperationError(
					context.getNode(),
					`Nano RPC Error (${action}): ${String(data.error)}`,
					{
						description: `RPC URL: ${config.rpcUrl}`,
					},
				);
			}

			return data as T;
		} catch (error: unknown) {
			lastError = error;

			const canRetry = attempt < maxRetries && shouldRetry(error);
			if (canRetry) {
				// Small backoff so transient failures have a chance to clear.
				await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
				continue;
			}

			const message = error instanceof Error ? error.message : String(error);
			throw new NodeOperationError(
				context.getNode(),
				`Nano RPC call failed for action "${action}": ${message}`,
				{
					description: `Attempt ${attempt + 1}/${maxRetries + 1} | URL: ${config.rpcUrl} | timeoutMs=${timeoutMs} | Params: ${JSON.stringify(redactParams(params))}`,
				},
			);
		}
	}

	const message = lastError instanceof Error ? lastError.message : String(lastError);
	throw new NodeOperationError(
		context.getNode(),
		`Nano RPC call failed for action "${action}": ${message}`,
		{ description: `URL: ${config.rpcUrl}` },
	);
}
