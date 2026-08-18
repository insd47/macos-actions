/** 전용 keychain에서 유일한 code-signing identity를 선택한다. */
export function select(output: string) {
  const identities = output.split('\n').flatMap((line) => {
    const info = line.trim();
    const match = info.match(/^\d+\)\s+([0-9a-f]{40})\s+"([^"]+)"/i);

    return match ? [{ hash: match[1]!, name: match[2]!, info }] : [];
  });

  if (identities.length === 0) {
    throw new Error('The imported certificate does not contain a code-signing identity.');
  }

  if (identities.length > 1) {
    const names = identities.map((identity) => identity.name).join(', ');
    throw new Error(`The PKCS12 file contains multiple code-signing identities: ${names}`);
  }

  return identities[0]!;
}
