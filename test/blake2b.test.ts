import { describe, expect, it } from 'vitest';

import { blake2b, blake2b256, blake2b40 } from '../utils/blake2b';

describe('blake2b', () => {
	// RFC 7693 Appendix A test vectors
	it('matches the RFC 7693 BLAKE2b-256 vector for "abc"', () => {
		expect(blake2b256(Buffer.from('abc')).toString('hex')).toBe(
			'bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319',
		);
	});

	it('matches the RFC 7693 BLAKE2b-256 vector for the empty string', () => {
		expect(blake2b256(Buffer.alloc(0)).toString('hex')).toBe(
			'0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8',
		);
	});

	it('matches the RFC 7693 BLAKE2b-512 vector for "abc"', () => {
		expect(blake2b(Buffer.from('abc'), 64).toString('hex')).toBe(
			'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923',
		);
	});

	it('handles 128-byte-aligned inputs with a final zero block', () => {
		const data = Buffer.alloc(128, 7);
		expect(blake2b256(data)).toHaveLength(32);
	});

	it('supports the 5-byte digest used by address checksums', () => {
		expect(blake2b40(Buffer.alloc(32, 1))).toHaveLength(5);
	});
});
