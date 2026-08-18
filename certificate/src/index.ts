import * as core from '@actions/core';
import { execFile as rawExecFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { select } from './identity.js';

const execFile = promisify(rawExecFile);

async function run() {
  if (process.platform !== 'darwin') {
    throw new Error('This action requires a macOS runner.');
  }

  const certificate = core.getInput('apple-certificate', { required: true });
  const certificatePassword = core.getInput('apple-certificate-password', { required: true });
  const keychainPassword = randomBytes(24).toString('hex');
  const temporaryRoot = process.env.RUNNER_TEMP ?? tmpdir();
  const workDirectory = await mkdtemp(join(temporaryRoot, 'apple-certificate-'));
  const certificatePath = join(workDirectory, 'certificate.p12');
  const keychainPath = join(workDirectory, 'signing.keychain-db');

  core.setSecret(certificatePassword);
  core.setSecret(keychainPassword);
  core.saveState('work-directory', workDirectory);
  core.saveState('keychain-path', keychainPath);
  core.saveState('keychain-password', keychainPassword);

  const previousKeychains = await keychains();
  core.saveState('previous-keychains', JSON.stringify(previousKeychains));

  await writeFile(certificatePath, Buffer.from(certificate, 'base64'), { mode: 0o600 });
  await security(['create-keychain', '-p', keychainPassword, keychainPath]);
  await security(['set-keychain-settings', '-lut', '3600', keychainPath]);
  await security(['unlock-keychain', '-p', keychainPassword, keychainPath]);
  await security([
    'import',
    certificatePath,
    '-k',
    keychainPath,
    '-f',
    'pkcs12',
    '-P',
    certificatePassword,
    '-T',
    '/usr/bin/codesign',
  ]);
  await security([
    'set-key-partition-list',
    '-S',
    'apple-tool:,apple:,codesign:',
    '-s',
    '-k',
    keychainPassword,
    keychainPath,
  ]);
  await security(['list-keychains', '-d', 'user', '-s', keychainPath, ...previousKeychains]);

  const { stdout } = await security(['find-identity', '-v', '-p', 'codesigning', keychainPath]);
  const identity = select(stdout);

  core.setOutput('identity', identity.hash);
  core.setOutput('identity-name', identity.name);
  core.setOutput('cert-info', identity.info);
  core.info(`Imported code-signing identity '${identity.name}'.`);
}

async function security(args: string[]) {
  return execFile('/usr/bin/security', args);
}

async function keychains() {
  const { stdout } = await security(['list-keychains', '-d', 'user']);

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as string;
      } catch {
        throw new Error(`Unable to parse keychain search entry: ${line}`);
      }
    });
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
