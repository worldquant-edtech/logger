import stdout from 'stdout-stream';

function stream(...args) {
  const output = args.map(String).join(' ');
  stdout.write(output + '\n');
}

export default {
  log: stream,
  warn: stream,
  info: stream,
  error: stream,
  debug: stream,
};
