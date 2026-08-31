/**
 * Nano block hash computation and signature verification.
 *
 * Zero runtime dependencies:
 * - BLAKE2b-256 comes from the vendored implementation in ./blake2b.
 * - Signature verification uses the vendored ed25519-blake2b implementation
 *   (Nano replaces SHA-512 with BLAKE2b-512 in Ed25519, so Node's built-in
 *   crypto.verify cannot be used).
 *
 * Only state blocks are supported (the Nano network has only produced state
 * blocks since the V21 epoch). Reference:
 * https://docs.nano.org/protocol-design/blocks/#hashing-a-block
 */

import { decodeNanoAddress } from './nano-address';
import { blake2b256 } from './blake2b';
import { verifyEd25519Blake2b } from './ed25519-blake2b';

import type { BlockContents } from '../types';

const MAX_UINT128 = (1n << 128n) - 1n;

/**
 * Epoch blocks are special: the network accepts them by hardcoded hash rather
 * than by signature verification (their signatures are not valid Ed25519
 * signatures over the block hash). These are the two known epoch block hashes
 * on the live network.
 */
const EPOCH_BLOCK_HASHES = new Set([
	'991cf190094c00f0b68e2e5f75f6bee95a2e0bd93ceaa4a6734db9f19b728948', // epoch v1
	'023b94b7d27b311666c8636954fe17f1fd2eaa97a8bac27de5084fbbd5c6b02c', // epoch v2
]);

function hexToBytes(hex: string): Buffer | null {
	if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
		return null;
	}
	return Buffer.from(hex, 'hex');
}

/**
 * Compute the BLAKE2b-256 hash of a state block from its contents.
 * Returns null if any field is malformed or the block is not a state block.
 */
export function computeStateBlockHash(block: BlockContents): Buffer | null {
	if (block.type !== 'state') {
		return null;
	}

	const accountKey = decodeNanoAddress(block.account);
	if (!accountKey) {
		return null;
	}

	const previous = hexToBytes(block.previous);
	if (!previous || previous.length !== 32) {
		return null;
	}

	const representativeKey = decodeNanoAddress(block.representative);
	if (!representativeKey) {
		return null;
	}

	let balance: bigint;
	try {
		balance = BigInt(block.balance);
	} catch {
		return null;
	}
	if (balance < 0n || balance > MAX_UINT128) {
		return null;
	}
	const balanceBytes = Buffer.alloc(16);
	for (let i = 0; i < 16; i++) {
		balanceBytes[15 - i] = Number(balance & 0xffn);
		balance >>= 8n;
	}

	// The link field is either a 64-hex hash (receive/open blocks) or the
	// public key of the destination account (send blocks, hex form). Some
	// nodes return the account-address form instead of hex.
	let linkBytes = hexToBytes(block.link);
	if (linkBytes && linkBytes.length !== 32) {
		return null;
	}
	if (!linkBytes) {
		const linkKey = decodeNanoAddress(block.link);
		if (!linkKey) {
			return null;
		}
		linkBytes = linkKey;
	}

	// Preamble: 32 bytes, all zero except the last byte (state block type 6).
	const preamble = Buffer.alloc(32);
	preamble[31] = 6;

	return blake2b256(
		Buffer.concat([
			preamble,
			accountKey,
			previous,
			representativeKey,
			balanceBytes,
			linkBytes,
		]),
	);
}

/**
 * Cryptographically verify a block: the block's contents must hash to the
 * reported hash AND the ed25519-blake2b signature must verify against the
 * account's public key. Returns false for unsupported block types or
 * malformed data.
 */
export function verifyBlockSignature(block: BlockContents, reportedHash?: string): boolean {
	if (!block || block.type !== 'state') {
		return false;
	}

	const computedHash = computeStateBlockHash(block);
	if (!computedHash) {
		return false;
	}

	if (reportedHash) {
		const expected = hexToBytes(reportedHash);
		if (!expected || expected.length !== 32) {
			return false;
		}
		if (!computedHash.equals(expected)) {
			return false;
		}
	}

	// Epoch blocks are accepted by the network based on their hash alone (their
	// signatures are not valid Ed25519 signatures over the block hash). The
	// contents must hash to the known epoch hash to pass.
	if (EPOCH_BLOCK_HASHES.has(computedHash.toString('hex'))) {
		return true;
	}

	const publicKey = decodeNanoAddress(block.account);
	const signature = hexToBytes(block.signature);
	if (!publicKey || !signature || signature.length !== 64) {
		return false;
	}

	return verifyEd25519Blake2b(signature, computedHash, publicKey);
}
