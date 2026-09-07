import { createHash } from 'node:crypto';

// PayFast's separate subscription-management REST API (distinct from the
// once-off "process" redirect + ITN flow): every request needs merchant-id/
// version/timestamp headers plus a signature that's the MD5 of those headers
// merged with the body, SORTED by key (unlike the ITN signature, which
// preserves field order) and passphrase-suffixed the same way.
// Reference (no official public spec page rendered content at the time this
// was written — derived from PayFast's own PHP SDK, github.com/tpg/payfast).
const MANAGEMENT_BASE_URL = 'https://api.payfast.co.za';

function generateManagementSignature(
  fields: Record<string, string>,
  passphrase?: string,
): string {
  const encode = (value: string) =>
    encodeURIComponent(value.trim()).replace(/%20/g, '+');

  const withPassphrase = passphrase ? { ...fields, passphrase } : { ...fields };

  const paramString = Object.keys(withPassphrase)
    .sort()
    .map((key) => `${key}=${encode(String(withPassphrase[key]))}`)
    .join('&');

  return createHash('md5').update(paramString).digest('hex');
}

interface SubscriptionApiOptions {
  merchantId: string;
  passphrase?: string;
  sandbox: boolean;
}

export async function callSubscriptionApi(
  token: string,
  method: 'GET' | 'PUT' | 'PATCH',
  action: 'fetch' | 'pause' | 'unpause' | 'cancel' | 'update',
  options: SubscriptionApiOptions,
  body: Record<string, string> = {},
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    'merchant-id': options.merchantId,
    version: 'v1',
    timestamp: new Date().toISOString(),
  };
  headers.signature = generateManagementSignature(
    { ...headers, ...body },
    options.passphrase,
  );

  const query = options.sandbox ? '?testing=true' : '';
  const url = `${MANAGEMENT_BASE_URL}/subscriptions/${token}/${action}${query}`;

  const res = await fetch(url, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body),
  });

  const data: unknown = await res.json().catch(() => null);
  return { status: res.status, data };
}
