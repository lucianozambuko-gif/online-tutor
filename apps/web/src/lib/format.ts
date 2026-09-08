export function formatResetIn(resetAt: string): string {
  const ms = new Date(resetAt).getTime() - Date.now();
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
