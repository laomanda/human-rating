/**
 * Google OAuth2 JWT authentication for FCM HTTP v1 API.
 *
 * Generates a self-signed JWT from a service account key,
 * exchanges it for an OAuth2 access token via Google's token endpoint.
 *
 * This avoids the need for the firebase-admin Node.js SDK.
 */

// Deno built-in crypto for JWT signing

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function textToBase64url(text: string): string {
  return base64url(new TextEncoder().encode(text));
}

/**
 * Imports a PEM-encoded RSA private key for JWT signing.
 */
async function importPrivateKey(
  pem: string,
): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) =>
    c.charCodeAt(0),
  );

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
}

/**
 * Creates a self-signed JWT for Google OAuth2.
 */
async function createJwt(
  serviceAccount: ServiceAccountKey,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: serviceAccount.private_key_id,
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600, // 1 hour
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const headerB64 = textToBase64url(JSON.stringify(header));
  const payloadB64 = textToBase64url(JSON.stringify(payload));

  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importPrivateKey(serviceAccount.private_key);

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );

  const signatureB64 = base64url(new Uint8Array(signature));

  return `${signingInput}.${signatureB64}`;
}

/**
 * Returns a valid OAuth2 access token for FCM API calls.
 * Caches the token and refreshes it when expired.
 */
export async function getAccessToken(
  serviceAccountJson: string,
): Promise<string> {
  // Check cache — refresh 5 minutes before expiry
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300_000) {
    return cachedToken.token;
  }

  const serviceAccount: ServiceAccountKey = JSON.parse(serviceAccountJson);

  const jwt = await createJwt(serviceAccount);

  const response = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Google OAuth2 token exchange failed (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Returns the project ID from the service account JSON.
 */
export function getProjectId(serviceAccountJson: string): string {
  const sa: ServiceAccountKey = JSON.parse(serviceAccountJson);
  return sa.project_id;
}
