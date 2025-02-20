export default {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:next/recommended',
  ],
  plugins: ['@typescript-eslint', 'react'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'import/no-unresolved': ['error', { ignore: ['utils/*', 'app/*'] }], // Ignore utils/ and app/ for imports
  },
};