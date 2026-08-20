import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/** 존재하는 유일한 provisioning profile 후보를 반환한다. */
export async function source(candidates: readonly string[]) {
  const present = (
    await Promise.all(candidates.map(async (candidate) => ((await exists(candidate)) ? candidate : undefined)))
  ).filter((candidate) => candidate !== undefined);

  if (present.length === 0) {
    throw new Error(`The downloaded provisioning profile was not found at: ${candidates.join(', ')}`);
  }

  if (present.length > 1) {
    throw new Error(`Multiple provisioning profile files exist for the selected UUID: ${present.join(', ')}`);
  }

  return present[0]!;
}

/** destination이 비어 있고 부모 디렉터리가 준비되었는지 보장한다. */
export async function reserve(destination: string) {
  if (await exists(destination)) {
    throw new Error(`The provisioning profile destination already exists: ${destination}`);
  }

  await mkdir(dirname(destination), { recursive: true });
}

async function exists(path: string) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}
