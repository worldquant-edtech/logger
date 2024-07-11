// Consider test environments as TTY.
export const isTTY = process.stdout.isTTY || process.env.NODE_ENV === 'test';

export function isCloudEnv() {
  return !!process.env.KUBERNETES_SERVICE_HOST;
}
