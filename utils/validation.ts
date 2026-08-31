/**
 * Validate Nano address format
 */
export function isValidNanoAddress(address: string): boolean {
	const nanoRegex = /^(nano|xrb)_[13][13-9a-km-uw-z]{59}$/;
	return nanoRegex.test(address);
}

/**
 * Validate Nano wallet id format
 */
export function isValidWalletId(walletId: string): boolean {
	// Nano wallet IDs used by the RPC are 64-hex-character identifiers
	const walletIdRegex = /^[0-9A-Fa-f]{64}$/;
	return walletIdRegex.test(walletId);
}

/**
 * Validate Nano block hash format (64-character hexadecimal)
 */
export function isValidBlockHash(hash: string): boolean {
	const blockHashRegex = /^[0-9A-Fa-f]{64}$/;
	return blockHashRegex.test(hash);
}

/**
 * Validate private key format (64-character hexadecimal)
 */
export function isValidPrivateKey(privateKey: string): boolean {
	return /^[0-9A-Fa-f]{64}$/.test(privateKey);
}

/**
 * Validate work value format (16-character hexadecimal)
 */
export function isValidWorkValue(work: string): boolean {
	return /^[0-9A-Fa-f]{16}$/.test(work);
}

/**
 * Validate a positive Nano amount given as a decimal string.
 * Accepts up to 30 decimal places (Nano's precision) and rejects scientific
 * notation, which would crash BigInt parsing.
 */
export function isValidPositiveNanoAmount(amount: string): boolean {
	if (typeof amount !== 'string') {
		return false;
	}
	const trimmed = amount.trim();
	if (!/^\d+(\.\d{1,30})?$/.test(trimmed)) {
		return false;
	}
	// Must be greater than zero
	const [intPart, decPart] = trimmed.split('.');
	return BigInt(intPart) > 0n || (decPart !== undefined && /[1-9]/.test(decPart));
}

/**
 * Validate raw amount string (unsigned integer)
 */
export function isValidRawAmount(rawAmount: string): boolean {
	return /^[0-9]+$/.test(rawAmount);
}

/**
 * Validate the structure of a parsed BlockContents object.
 * Returns an array of validation errors, or an empty array if valid.
 */
export function validateBlockContents(block: unknown): string[] {
	const errors: string[] = [];

	if (block === null || block === undefined || typeof block !== 'object' || Array.isArray(block)) {
		return ['Block must be a JSON object'];
	}

	const b = block as Record<string, unknown>;

	if (typeof b.type !== 'string' || b.type.length === 0) {
		errors.push(
			'Block must have a non-empty "type" field (e.g. "state", "send", "receive", "change", "open")',
		);
	}

	if (b.account !== undefined && typeof b.account !== 'string') {
		errors.push('Block "account" must be a string');
	} else if (typeof b.account === 'string' && !isValidNanoAddress(b.account)) {
		errors.push(`Block "account" is not a valid Nano address: ${b.account}`);
	}

	if (b.previous !== undefined && typeof b.previous !== 'string') {
		errors.push('Block "previous" must be a string');
	} else if (typeof b.previous === 'string' && !isValidBlockHash(b.previous)) {
		errors.push(
			`Block "previous" is not a valid block hash (expected 64 hex chars): ${b.previous}`,
		);
	}

	if (b.representative !== undefined && typeof b.representative !== 'string') {
		errors.push('Block "representative" must be a string');
	} else if (typeof b.representative === 'string' && !isValidNanoAddress(b.representative)) {
		errors.push(`Block "representative" is not a valid Nano address: ${b.representative}`);
	}

	if (b.balance !== undefined && typeof b.balance !== 'string') {
		errors.push('Block "balance" must be a string');
	} else if (typeof b.balance === 'string' && !isValidRawAmount(b.balance)) {
		errors.push(`Block "balance" must be a decimal string (unsigned integer): ${b.balance}`);
	}

	if (b.link !== undefined && typeof b.link !== 'string') {
		errors.push('Block "link" must be a string');
	}

	if (b.signature !== undefined && typeof b.signature !== 'string') {
		errors.push('Block "signature" must be a string');
	} else if (typeof b.signature === 'string' && !/^[0-9a-fA-F]{128}$/.test(b.signature)) {
		errors.push(`Block "signature" must be a 128-character hex string: ${b.signature}`);
	}

	if (b.work !== undefined && typeof b.work !== 'string') {
		errors.push('Block "work" must be a string');
	} else if (typeof b.work === 'string' && !isValidWorkValue(b.work)) {
		errors.push(`Block "work" must be a 16-character hex string: ${b.work}`);
	}

	return errors;
}

/**
 * Validate a parsed SignOptions object (used by signBlock).
 * Returns an array of validation errors, or an empty array if valid.
 */
export function validateSignOptions(opts: unknown): string[] {
	const errors: string[] = [];

	if (opts === null || opts === undefined || typeof opts !== 'object' || Array.isArray(opts)) {
		return ['Sign options must be a JSON object'];
	}

	const o = opts as Record<string, unknown>;

	const hasKey = typeof o.key === 'string' && isValidPrivateKey(o.key as string);
	const hasWalletAccount = typeof o.wallet === 'string' && typeof o.account === 'string';

	if (!hasKey && !hasWalletAccount) {
		errors.push(
			'Sign options must include either "key" (private key) or both "wallet" and "account"',
		);
	}

	const hasBlock = o.block !== undefined;
	const hasHash = typeof o.hash === 'string';

	if (!hasBlock && !hasHash) {
		errors.push('Sign options must include either "block" or "hash"');
	}

	return errors;
}
