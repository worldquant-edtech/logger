const stdout = require('stdout-stream');

function stream(...args) {
  const output = args.map(String).join(' ');
  stdout.write(output + '\n');
}

module.exports = {
  log: stream,
  warn: stream,
  info: stream,
  error: stream,
  debug: stream,
};
