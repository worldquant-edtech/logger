// Consider test environments as TTY.
export const isTTY = process.stdout.isTTY || process.env.NODE_ENV === 'test';
