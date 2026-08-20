import { join } from 'node:path';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Apple-Actions 출력을 provisioning profile 목록으로 해석한다. */
export function inventory(value: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('The provisioning profile output is not valid JSON.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('The provisioning profile output must be an array.');
  }

  return parsed.map((entry, index) => profile(entry, index));
}

/** 요청한 type의 유일한 provisioning profile을 선택한다. */
export function select(profiles: readonly Profile[], type: string) {
  const matches = profiles.filter((profile) => profile.type === type);

  if (matches.length === 0) {
    throw new Error(`No '${type}' provisioning profile was downloaded.`);
  }

  if (matches.length > 1) {
    const names = matches.map((profile) => profile.name).join(', ');
    throw new Error(`Multiple '${type}' provisioning profiles were downloaded: ${names}`);
  }

  return matches[0]!;
}

/** 다운로드 Action이 만들 수 있는 모든 profile 경로를 반환한다. */
export function files(home: string, profiles: readonly Profile[]) {
  return profiles.flatMap((profile) => candidates(home, profile));
}

/** 선택한 profile의 macOS 및 Apple mobile 확장자 후보를 반환한다. */
export function candidates(home: string, profile: Profile) {
  const directory = join(home, 'Library', 'MobileDevice', 'Provisioning Profiles');

  return [join(directory, `${profile.udid}.provisionprofile`), join(directory, `${profile.udid}.mobileprovision`)];
}

function profile(value: unknown, index: number): Profile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Provisioning profile at index ${index} must be an object.`);
  }

  const { name, udid, type } = value as Record<string, unknown>;

  if (typeof name !== 'string' || typeof udid !== 'string' || typeof type !== 'string') {
    throw new Error(`Provisioning profile at index ${index} must contain string name, udid, and type fields.`);
  }

  if (!uuid.test(udid)) {
    throw new Error(`Provisioning profile at index ${index} contains an invalid UUID: ${udid}`);
  }

  return { name, udid, type };
}

interface Profile {
  name: string;
  udid: string;
  type: string;
}
