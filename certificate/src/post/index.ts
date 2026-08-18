import * as core from '@actions/core';
import { execFile as rawExecFile } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFile = promisify(rawExecFile);

async function run() {
  const workDirectory = core.getState('work-directory');
  const keychainPath = core.getState('keychain-path');
  const keychainPassword = core.getState('keychain-password');
  const previousKeychains = keychains(core.getState('previous-keychains'));

  if (previousKeychains) {
    await attempt('restore the previous keychain search list', () =>
      security(['list-keychains', '-d', 'user', '-s', ...previousKeychains]),
    );
  }

  if (keychainPath && keychainPassword) {
    await attempt('unlock the temporary keychain', () =>
      security(['unlock-keychain', '-p', keychainPassword, keychainPath]),
    );
  }

  if (keychainPath) {
    await attempt('delete the temporary keychain', () => security(['delete-keychain', keychainPath]));
  }

  if (workDirectory) {
    await attempt('delete the temporary certificate directory', () =>
      rm(workDirectory, { recursive: true, force: true }),
    );
  }
}

async function security(args: string[]) {
  return execFile('/usr/bin/security', args);
}

async function attempt(description: string, operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    core.warning(`Failed to ${description}: ${reason}`);
  }
}

function keychains(value: string) {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value) as unknown;

    if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string')) {
      return parsed;
    }
  } catch {
    // The warning below is the single cleanup failure sink.
  }

  core.warning('Failed to parse the previous keychain search list; leaving the current list unchanged.');
  return undefined;
}

run().catch((error: unknown) => {
  core.warning(error instanceof Error ? error.message : String(error));
});
