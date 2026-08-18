import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { select } from '../src/identity.ts';

describe('select', () => {
  it('returns the only imported identity without assuming its certificate kind', () => {
    const selected = select(`
      1) 0123456789ABCDEF0123456789ABCDEF01234567 "Developer ID Application: Example Studio (TEAMID)"
         1 valid identities found
    `);

    assert.deepEqual(selected, {
      hash: '0123456789ABCDEF0123456789ABCDEF01234567',
      name: 'Developer ID Application: Example Studio (TEAMID)',
      info: '1) 0123456789ABCDEF0123456789ABCDEF01234567 "Developer ID Application: Example Studio (TEAMID)"',
    });
  });

  it('retains an identity line with a trust diagnostic', () => {
    const selected = select(`
      1) 0123456789ABCDEF0123456789ABCDEF01234567 "Apple Distribution: Example Studio (TEAMID)" (CSSMERR_TP_NOT_TRUSTED)
         0 valid identities found
    `);

    assert.equal(selected.name, 'Apple Distribution: Example Studio (TEAMID)');
  });

  it('rejects a PKCS12 file without a signing identity', () => {
    assert.throws(() => select('0 valid identities found'), /does not contain a code-signing identity/);
  });

  it('rejects ambiguous PKCS12 files', () => {
    const output = `
      1) 0123456789ABCDEF0123456789ABCDEF01234567 "Apple Development: Example Studio (TEAMID)"
      2) 89ABCDEF0123456789ABCDEF0123456789ABCDEF "Apple Distribution: Example Studio (TEAMID)"
    `;

    assert.throws(() => select(output), /contains multiple code-signing identities/);
  });
});
