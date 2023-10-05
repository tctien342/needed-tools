module.exports = {
  env: { browser: true, es2021: true, jest: true },
  extends: ['plugin:@typescript-eslint/recommended', 'prettier', 'plugin:perfectionist/recommended-natural'],
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['*.d.ts'],
      rules: { '@typescript-eslint/ban-types': 'off' },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'perfectionist', 'prettier'],
  root: true,
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [1, { argsIgnorePattern: '^_', vars: 'all' }],
    'arrow-body-style': 'off',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-arrow-callback': 'off',
    'prettier/prettier': 'error',
  },
};
