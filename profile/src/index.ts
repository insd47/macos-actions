import * as core from '@actions/core';
import { rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { reserve, source } from './file.js';
import { candidates, files, inventory, select } from './profile.js';

async function run() {
  if (process.platform !== 'darwin') {
    throw new Error('This action requires a macOS runner.');
  }

  const profiles = inventory(core.getInput('profiles', { required: true }));
  const profileType = core.getInput('profile-type', { required: true });
  const destination = resolve(core.getInput('destination', { required: true }));
  const home = process.env.HOME;

  if (!home) {
    throw new Error('Environment variable HOME is not defined.');
  }

  const downloadedFiles = files(home, profiles);
  core.saveState('downloaded-files', JSON.stringify(downloadedFiles));

  const profile = select(profiles, profileType);
  await reserve(destination);

  core.saveState('destination', destination);

  const downloaded = await source(candidates(home, profile));
  await rename(downloaded, destination);

  core.setOutput('path', destination);
  core.info(`Prepared ${profile.type} profile '${profile.name}' at '${destination}'.`);
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
