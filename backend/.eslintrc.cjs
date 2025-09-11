module.exports = {
  root: true,
  env: { node: true, es2020: true },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-unused-vars': 'off',
    'prettier/prettier': 'error',
  },
};
