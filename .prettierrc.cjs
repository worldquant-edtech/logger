module.exports = {
  singleQuote: true,
  bracketSameLine: true,
  proseWrap: 'always',
  overrides: [
    {
      files: '*.json',
      options: {
        parser: 'json-stringify',
      },
    },
  ],
};
