/** Version stored with a consent timestamp. Bump when the /kvkk text changes. */
export const KVKK_VERSION = '2026-11-10';

export function kvkkMetadata(acceptedAt = new Date()): { kvkk_accepted_at: string; kvkk_version: string } {
  return {
    kvkk_accepted_at: acceptedAt.toISOString(),
    kvkk_version: KVKK_VERSION,
  };
}
