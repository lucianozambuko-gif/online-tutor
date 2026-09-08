import { createHash } from 'node:crypto';

// PayFast's management REST API (distinct from the once-off "process"
// redirect + ITN flow) covers both recurring-subscription actions AND
// refunds on a completed transaction — same base URL, same auth scheme:
// every request needs merchant-id/version/timestamp headers plus a
// signature that's the MD5 of those headers merged with the body, SORTED
// by key (unlike the ITN signature, which preserves field order) and
// passphrase-suffixed the same way.
// Reference (no official public spec page rendered content at the time this
// was written — derived from PayFast's own PHP SDK, github.com/tpg/payfast
// and Payfast/payfast-php-sdk on GitHub).
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

export interface PayfastManagementOptions {
  merchantId: string;
  passphrase?: string;
  sandbox: boolean;
}

async function callPayfastManagementApi(
  path: string,
  method: 'GET' | 'PUT' | 'PATCH' | 'POST',
  options: PayfastManagementOptions,
  body: Record<string, string | number> = {},
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    'merchant-id': options.merchantId,
    version: 'v1',
    timestamp: new Date().toISOString(),
  };
  const bodyAsStrings: Record<string, string> = Object.fromEntries(
    Object.entries(body).map(([key, value]) => [key, String(value)]),
  );
  headers.signature = generateManagementSignature(
    { ...headers, ...bodyAsStrings },
    options.passphrase,
  );

  const query = options.sandbox ? '?testing=true' : '';
  const url = `${MANAGEMENT_BASE_URL}${path}${query}`;

  const res = await fetch(url, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    // Keep real JSON types in the body (e.g. amount as a number) even though
    // the signature above is computed over stringified values.
    body: method === 'GET' ? undefined : JSON.stringify(body),
  });

  const data: unknown = await res.json().catch(() => null);
  return { status: res.status, data };
}

export function callSubscriptionApi(
  token: string,
  method: 'GET' | 'PUT' | 'PATCH',
  action: 'fetch' | 'pause' | 'unpause' | 'cancel' | 'update',
  options: PayfastManagementOptions,
  body: Record<string, string> = {},
): Promise<{ status: number; data: unknown }> {
  return callPayfastManagementApi(
    `/subscriptions/${token}/${action}`,
    method,
    options,
    body,
  );
}

// amount is in cents (PayFast's refund API, not rand) and optional — omit it
// for a full refund of whatever remains on the transaction. NOTE: PayFast's
// own SDK refuses to call this in sandbox mode ("Refunds is not available in
// Sandbox mode"), so this can only be verified against live credentials.
export function callRefundApi(
  pfPaymentId: string,
  options: PayfastManagementOptions,
  body: { amount?: number; reason: string; notify_buyer?: 0 | 1 },
): Promise<{ status: number; data: unknown }> {
  return callPayfastManagementApi(
    `/refunds/${pfPaymentId}`,
    'POST',
    options,
    body,
  );
}
