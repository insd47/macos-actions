import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { cleanup } from '../src/cleanup.ts';
import { source } from '../src/file.ts';
import { candidates, files, inventory, select } from '../src/profile.ts';

const direct = {
  name: 'Contest Assessment',
  udid: '01234567-89AB-CDEF-0123-456789ABCDEF',
  type: 'MAC_APP_DIRECT',
};

describe('provisioning profile output', () => {
  it('selects one profile of the requested type and derives both supported file names', () => {
    const profiles = inventory(JSON.stringify([direct]));
    const profile = select(profiles, 'MAC_APP_DIRECT');

    assert.deepEqual(profile, direct);
    assert.deepEqual(candidates('/Users/runner', profile), [
      '/Users/runner/Library/MobileDevice/Provisioning Profiles/01234567-89AB-CDEF-0123-456789ABCDEF.provisionprofile',
      '/Users/runner/Library/MobileDevice/Provisioning Profiles/01234567-89AB-CDEF-0123-456789ABCDEF.mobileprovision',
    ]);
  });

  it('tracks every downloaded profile for post cleanup', () => {
    const development = {
      name: 'Contest Development',
      udid: 'FEDCBA98-7654-3210-FEDC-BA9876543210',
      type: 'MAC_APP_DEVELOPMENT',
    };
    const profiles = inventory(JSON.stringify([direct, development]));

    assert.equal(files('/Users/runner', profiles).length, 4);
  });

  it('rejects missing and ambiguous profile types', () => {
    assert.throws(() => select(inventory(JSON.stringify([direct])), 'MAC_APP_STORE'), /No 'MAC_APP_STORE'/);
    assert.throws(
      () => select(inventory(JSON.stringify([direct, { ...direct, name: 'Duplicate' }])), 'MAC_APP_DIRECT'),
      /Multiple 'MAC_APP_DIRECT'/,
    );
  });

  it('rejects malformed upstream output', () => {
    assert.throws(() => inventory('{'), /not valid JSON/);
    assert.throws(() => inventory('{}'), /must be an array/);
    assert.throws(
      () => inventory(JSON.stringify([{ ...direct, udid: '../embedded.provisionprofile' }])),
      /invalid UUID/,
    );
  });
});

describe('source', () => {
  it('returns the only file written by the downloader', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'profile-source-'));
    const path = join(directory, 'Library/MobileDevice/Provisioning Profiles/profile.provisionprofile');
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, 'profile');

    assert.equal(await source([path, `${path}.missing`]), path);
  });

  it('rejects missing and ambiguous files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'profile-source-'));
    const first = join(directory, 'first.provisionprofile');
    const second = join(directory, 'second.mobileprovision');

    await assert.rejects(() => source([first, second]), /was not found/);

    await Promise.all([writeFile(first, 'first'), writeFile(second, 'second')]);
    await assert.rejects(() => source([first, second]), /Multiple provisioning profile files/);
  });
});

describe('cleanup', () => {
  it('removes prepared and downloaded files idempotently', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'profile-cleanup-'));
    const prepared = join(directory, 'embedded.provisionprofile');
    const downloaded = join(directory, 'downloaded.provisionprofile');
    await Promise.all([writeFile(prepared, 'prepared'), writeFile(downloaded, 'downloaded')]);

    assert.deepEqual(await cleanup([prepared, downloaded, downloaded]), []);
    assert.deepEqual(await cleanup([prepared, downloaded]), []);
    await assert.rejects(() => access(prepared));
    await assert.rejects(() => access(downloaded));
  });
});
