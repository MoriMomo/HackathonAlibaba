import crypto from 'crypto';

// Helper to remove null/undefined fields as required by PayLabs docs
function cleanPayload(obj: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            continue;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
            cleaned[key] = cleanPayload(value as Record<string, unknown>);
        } else {
            cleaned[key] = value;
        }
    }
    return cleaned;
}

export function generatePaylabsSignature(
    method: 'POST' | 'GET',
    endpoint: string,
    body: Record<string, unknown>,
    timestamp: string,
    privateKey: string
): string {
    // 1. Minify the JSON body without spaces and remove nulls
    const cleanedBody = cleanPayload(body);
    const minifiedBody = JSON.stringify(cleanedBody);

    // 2. Hash the minified body using SHA-256
    const hashFunc = crypto.createHash('sha256');
    hashFunc.update(minifiedBody);
    const hexDigest = hashFunc.digest('hex').toLowerCase();

    // 3. Construct StringToSign
    const stringToSign = `${method}:${endpoint}:${hexDigest}:${timestamp}`;

    // 4. Sign with RSA-SHA256
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(stringToSign);

    // Verify private key is formatted properly
    const key = privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')
        ? privateKey
        : `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`;

    const signature = signer.sign(key, 'base64');
    return signature;
}

export function generateTimestamp(): string {
    // ISO 8601 strict format as required by Indonesian SNI / SNAP API
    return new Date().toISOString();
}
