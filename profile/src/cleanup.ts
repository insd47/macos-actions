import { rm } from 'node:fs/promises';

/** provisioning profile 파일을 지우고 실패한 경로와 이유를 반환한다. */
export async function cleanup(paths: readonly string[]) {
  const files = new Set(paths.filter(Boolean));
  const failures = await Promise.all(
    [...files].map(async (path) => {
      try {
        await rm(path, { force: true });
        return undefined;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { path, reason };
      }
    }),
  );

  return failures.filter((failure) => failure !== undefined);
}
