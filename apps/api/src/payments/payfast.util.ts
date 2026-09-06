import { createHash } from 'node:crypto';

// PayFast's signature scheme: URL-encode each value (spaces as '+'), join as
// key=value pairs IN THE ORDER THE FIELDS APPEAR (not sorted), append the
// passphrase last if one is configured, then MD5 the resulting string.
// This is used both to sign outgoing payment requests and to verify incoming
// ITN webhooks, so both sides must build the param string the same way.
// Reference: https://developers.payfast.co.za/docs#step_2_signature
export function generatePayfastSignature(
  fields: Record<string, string>,
  passphrase?: string,
): string {
  const encode = (value: string) =>
    encodeURIComponent(value.trim()).replace(/%20/g, '+');

  let paramString = Object.entries(fields)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    )
    .map(([key, value]) => `${key}=${encode(String(value))}`)
    .join('&');

  if (passphrase) {
    paramString += `&passphrase=${encode(passphrase)}`;
  }

  return createHash('md5').update(paramString).digest('hex');
}

export function getPayfastBaseUrl(): string {
  const sandbox = process.env.PAYFAST_SANDBOX !== 'false';
  return sandbox
    ? 'https://sandbox.payfast.co.za'
    : 'https://www.payfast.co.za';
}
