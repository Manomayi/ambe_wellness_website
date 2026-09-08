import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let secretClient = null;
const secretCache = {};

/**
 * Fetches a secret from Google Cloud Secret Manager with in-memory caching.
 * Falls back to process.env if available or if fetch fails.
 *
 * @param {string} secretName
 * @returns {Promise<string|null>}
 */
export async function getSecret(secretName) {
  const envVal = process.env[secretName];
  if (
    envVal &&
    !envVal.startsWith('ACxxxx') &&
    envVal !== 'YOUR_AUTH_TOKEN' &&
    !envVal.includes('XXXXXXXXXX')
  ) {
    return envVal.trim();
  }
  if (secretCache[secretName]) {
    return secretCache[secretName];
  }
  try {
    if (!secretClient) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ambe-wellness';
      secretClient = new SecretManagerServiceClient({ projectId });
    }
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ambe-wellness';
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    const secretVal = version.payload?.data?.toString('utf8')?.trim();
    if (secretVal) {
      secretCache[secretName] = secretVal;
      return secretVal;
    }
  } catch (err) {
    console.warn(`[SecretManager Web] Could not fetch "${secretName}":`, err.message);
  }
  return envVal ? envVal.trim() : null;
}
