module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: ['eslint:recommended', 'plugin:react-hooks/recommended', 'plugin:prettier/recommended'],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh', '@typescript-eslint', 'prettier'],
  globals: {
    Spotify: 'readonly',
    NodeJS: 'readonly',
    process: 'readonly',
  },
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-redeclare': 'off',
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
  },
};
