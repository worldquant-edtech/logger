export const realConsole = global.console;

let messages;

function delegate(level) {
  return (...args) => {
    messages.push([level, ...args]);
  };
}

const fakeConsole = {
  log: delegate('log'),
  debug: delegate('debug'),
  info: delegate('info'),
  warn: delegate('warn'),
  error: delegate('error'),
};

export function mockConsole() {
  messages = [];
  global.console = fakeConsole;
}

export function unmockConsole() {
  global.console = realConsole;
}

export function getMessages() {
  return messages;
}

export function getParsedMessages() {
  return messages.map(([level, msg]) => {
    return [level, JSON.parse(msg)];
  });
}
