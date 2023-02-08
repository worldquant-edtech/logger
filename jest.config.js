process.env.TZ = 'UTC';

export default {
  moduleNameMapper: {
    kleur: '<rootDir>/test/mocks/kleur',
    console: '<rootDir>/test/mocks/console',
  },
};
