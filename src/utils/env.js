// Consider test environments as TTY.
const isTTY = process.stdout.isTTY || process.env.NODE_ENV === 'test';

module.exports = {
  isTTY,
};
