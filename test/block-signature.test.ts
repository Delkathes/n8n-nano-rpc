import { describe, expect, it } from 'vitest';

import { decodeNanoAddress } from '../utils/nano-address';
import { computeStateBlockHash, verifyBlockSignature } from '../utils/block-signature';
import { verifyEd25519Blake2b } from '../utils/ed25519-blake2b';
import type { BlockContents } from '../types';

// Real mainnet fixtures (fetched from a public Nano RPC node).
const BURN_ACCOUNT = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
const BURN_ACCOUNT_PUBLIC_HEX = 'e89208dd038fbb269987689621d52292ae9c35941a7484756ecced92a65093ba';

// A regular state block from the burn chain. Its signature is a valid
// ed25519-blake2b signature over the block hash.
const REGULAR_BLOCK: BlockContents = {
	type: 'state',
	account: BURN_ACCOUNT,
	previous: 'ECCB8CB65CD3106EDA8CE9AA893FEAD497A91BCA903890CBD7A5C59F06AB9113',
	representative: BURN_ACCOUNT,
	balance: '325586539664609129644855132177',
	link: '65706F636820763120626C6F636B000000000000000000000000000000000000',
	link_as_account: 'nano_1sdifxjpia5p86i86u5hefoi1111111111111111111111111111g7jhnpfy',
	signature:
		'57BFE93F4675FC16DF0CCFC7EE4F78CC68047B5C14E2E2EED243F17348D8BAB3CCA04F8CBC2D291B4DDEC5F7A74C1BE1E872DF78D560C46365EB15270A1D1201',
	work: '0f78168d5b30191d',
};
const REGULAR_BLOCK_HASH = '6875C0DBFE5C44D8F8CFF431BC69ED5587C68F89F0663F2BC1FBBFCB46DC5989';

// The epoch v2 block. The network accepts it by hash, not by signature.
const EPOCH_V2_BLOCK: BlockContents = {
	type: 'state',
	account: BURN_ACCOUNT,
	previous: REGULAR_BLOCK_HASH,
	representative: BURN_ACCOUNT,
	balance: '325586539664609129644855132177',
	link: '65706F636820763220626C6F636B000000000000000000000000000000000000',
	link_as_account: 'nano_1sdifxjpia5p8ai86u5hefoi1111111111111111111111111111ngspq7ps',
	signature:
		'B0FD724D1B341C7FB117AC51EB6B8D0BD56F424E7188F31718321C8B0CAEC92AE402D382917D65E9ECC741B3B31203569E9FB7B898EC4A08BEBCE859EA24BB0E',
	work: '494dbb4e8bd688aa',
};
const EPOCH_V2_HASH = '023B94B7D27B311666C8636954FE17F1FD2EAA97A8BAC27DE5084FBBD5C6B02C';

describe('decodeNanoAddress', () => {
	it('decodes a valid address with correct checksum', () => {
		const publicKey = decodeNanoAddress(BURN_ACCOUNT);
		expect(publicKey).not.toBeNull();
		expect(publicKey!.toString('hex')).toBe(BURN_ACCOUNT_PUBLIC_HEX);
	});

	it('rejects an address with a corrupted checksum', () => {
		const corrupted = BURN_ACCOUNT.slice(0, -1) + (BURN_ACCOUNT.endsWith('r') ? 'a' : 'r');
		expect(decodeNanoAddress(corrupted)).toBeNull();
	});

	it('rejects malformed addresses', () => {
		expect(decodeNanoAddress('nano_123')).toBeNull();
		expect(decodeNanoAddress('')).toBeNull();
		expect(decodeNanoAddress('ban_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3')).toBeNull();
	});
});

describe('computeStateBlockHash', () => {
	it('computes the correct hash for the real regular block', () => {
		const hash = computeStateBlockHash(REGULAR_BLOCK);
		expect(hash).not.toBeNull();
		expect(hash!.toString('hex')).toBe(REGULAR_BLOCK_HASH.toLowerCase());
	});

	it('computes the correct hash for the real epoch v2 block', () => {
		const hash = computeStateBlockHash(EPOCH_V2_BLOCK);
		expect(hash).not.toBeNull();
		expect(hash!.toString('hex')).toBe(EPOCH_V2_HASH.toLowerCase());
	});

	it('changes when the balance changes', () => {
		const tampered: BlockContents = {
			...REGULAR_BLOCK,
			balance: (BigInt(REGULAR_BLOCK.balance) + 1n).toString(),
		};
		const hash = computeStateBlockHash(tampered);
		expect(hash!.toString('hex')).not.toBe(REGULAR_BLOCK_HASH.toLowerCase());
	});

	it('returns null for unsupported block types', () => {
		expect(computeStateBlockHash({ ...REGULAR_BLOCK, type: 'open' })).toBeNull();
	});
});

describe('verifyEd25519Blake2b', () => {
	const signature = Buffer.from(REGULAR_BLOCK.signature, 'hex');
	const message = Buffer.from(REGULAR_BLOCK_HASH, 'hex');
	const publicKey = Buffer.from(BURN_ACCOUNT_PUBLIC_HEX, 'hex');

	it('verifies a real mainnet signature', () => {
		expect(verifyEd25519Blake2b(signature, message, publicKey)).toBe(true);
	});

	it('rejects a tampered message', () => {
		const tamperedMessage = Buffer.from(REGULAR_BLOCK_HASH.replace('68', '69'), 'hex');
		expect(verifyEd25519Blake2b(signature, tamperedMessage, publicKey)).toBe(false);
	});

	it('rejects a tampered signature', () => {
		const tampered = Buffer.from(signature);
		tampered[0] ^= 0xff;
		expect(verifyEd25519Blake2b(tampered, message, publicKey)).toBe(false);
	});

	it('rejects wrong key lengths', () => {
		expect(verifyEd25519Blake2b(signature, message, Buffer.alloc(31))).toBe(false);
	});
});

describe('verifyBlockSignature', () => {
	it('verifies the real regular block', () => {
		expect(verifyBlockSignature(REGULAR_BLOCK, REGULAR_BLOCK_HASH)).toBe(true);
	});

	it('accepts the epoch v2 block by consensus hash', () => {
		expect(verifyBlockSignature(EPOCH_V2_BLOCK, EPOCH_V2_HASH)).toBe(true);
	});

	it('rejects tampered block contents', () => {
		const tampered: BlockContents = {
			...REGULAR_BLOCK,
			balance: (BigInt(REGULAR_BLOCK.balance) + 1n).toString(),
		};
		expect(verifyBlockSignature(tampered, REGULAR_BLOCK_HASH)).toBe(false);
	});

	it('rejects a block whose contents hash does not match the reported hash', () => {
		expect(verifyBlockSignature(REGULAR_BLOCK, EPOCH_V2_HASH)).toBe(false);
	});

	it('rejects an epoch hash with different contents', () => {
		const tampered: BlockContents = {
			...EPOCH_V2_BLOCK,
			balance: (BigInt(EPOCH_V2_BLOCK.balance) + 1n).toString(),
		};
		expect(verifyBlockSignature(tampered, EPOCH_V2_HASH)).toBe(false);
	});
});
