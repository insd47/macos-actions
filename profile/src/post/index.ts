import * as core from '@actions/core';
import { cleanup } from '../cleanup.js';

async function run() {
  const destination = core.getState('destination');
  const downloadedFiles = paths(core.getState('downloaded-files'));
  const failures = await cleanup([destination, ...downloadedFiles]);

  for (const { path, reason } of failures) {
    core.warning(`Failed to remove provisioning profile '${path}': ${reason}`);
  }
}

function paths(value: string) {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);

    if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string')) {
      return parsed;
    }
  } catch {
    // The warning below is the single cleanup failure sink.
  }

  core.warning('Failed to parse provisioning profile cleanup state; downloaded files may remain on the runner.');
  return [];
}

run().catch((error: unknown) => {
  core.warning(error instanceof Error ? error.message : String(error));
});
