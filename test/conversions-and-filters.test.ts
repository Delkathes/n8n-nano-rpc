import { describe, expect, it } from 'vitest';

import { nanoToRaw, rawToNano } from '../utils/conversions';
import { isValidPositiveNanoAmount } from '../utils/validation';
import { isAmountInRange, isSubtypeAllowed, shouldFilterWebhook } from '../nodes/Nano/NanoTrigger.node';

describe('isValidPositiveNanoAmount', () => {
	it('accepts valid decimal strings', () => {
		expect(isValidPositiveNanoAmount('1')).toBe(true);
		expect(isValidPositiveNanoAmount('0.5')).toBe(true);
		expect(isValidPositiveNanoAmount('1.234567890123456789012345678901')).toBe(true);
		expect(isValidPositiveNanoAmount(' 0.1 ')).toBe(true);
	});

	it('rejects scientific notation (would crash BigInt)', () => {
		expect(isValidPositiveNanoAmount('1e-7')).toBe(false);
		expect(isValidPositiveNanoAmount('1E7')).toBe(false);
	});

	it('rejects zero, negatives and non-decimals', () => {
		expect(isValidPositiveNanoAmount('0')).toBe(false);
		expect(isValidPositiveNanoAmount('0.000')).toBe(false);
		expect(isValidPositiveNanoAmount('-1')).toBe(false);
		expect(isValidPositiveNanoAmount('abc')).toBe(false);
		expect(isValidPositiveNanoAmount('1.2.3')).toBe(false);
	});

	it('rejects more than 30 decimal places', () => {
		expect(isValidPositiveNanoAmount('0.' + '1'.repeat(31))).toBe(false);
	});
});

describe('nano conversions', () => {
	it('converts 30-decimal NANO amounts to raw without floating point loss', () => {
		expect(nanoToRaw('1.234567890123456789012345678901')).toBe(
			'1234567890123456789012345678901',
		);
		expect(nanoToRaw('0.000000000000000000000000000001')).toBe('1');
	});

	it('converts raw back to NANO', () => {
		expect(rawToNano('1234567890123456789012345678901')).toBe(
			'1.234567890123456789012345678901',
		);
		expect(rawToNano('1')).toBe('0.000000000000000000000000000001');
	});

	it('handles the maximum supply raw value', () => {
		const maxSupply = '340282366920938463463374607431768211455';
		expect(rawToNano(maxSupply)).toBe('340282366.920938463463374607431768211455');
	});
});

describe('trigger filters', () => {
	const body = {
		account: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3',
		hash: 'A'.repeat(64),
		block: '{}',
		amount: '1000000000000000000000000000000',
		subtype: 'send',
	};

	it('compares amounts in raw units without precision loss', () => {
		// 1 NANO = 10^30 raw
		const oneNano = nanoToRaw('1');
		expect(isAmountInRange(body.amount, oneNano, undefined)).toBe(true);
		expect(isAmountInRange(body.amount, undefined, oneNano)).toBe(true); // amount == max passes
		expect(
			isAmountInRange(body.amount, undefined, nanoToRaw('0.999999999999999999999999999999')),
		).toBe(false);
		expect(isAmountInRange('1', nanoToRaw('0.000000000000000000000000000001'), undefined)).toBe(
			true,
		);
	});

	it('passes events matching all filters', () => {
		const result = shouldFilterWebhook(
			body,
			{ accounts: body.account, subtypes: ['send'], minAmount: '0.5', maxAmount: '2' },
			nanoToRaw('0.5'),
			nanoToRaw('2'),
		);
		expect(result).toBe(false);
	});

	it('rejects events failing the subtype filter', () => {
		expect(
			shouldFilterWebhook(body, { subtypes: ['receive'] }, undefined, undefined),
		).toBe(true);
	});

	it('rejects events with a mismatched account', () => {
		expect(
			shouldFilterWebhook(
				body,
				{ accounts: 'nano_1abc' },
				undefined,
				undefined,
			),
		).toBe(true);
	});

	it('subtype filter rejects when subtype is missing', () => {
		expect(isSubtypeAllowed(undefined, ['send'])).toBe(false);
		expect(isSubtypeAllowed('send', [])).toBe(true);
	});
});
