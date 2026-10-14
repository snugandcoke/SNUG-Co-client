import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      // False positive on render-prop factories that return JSX but are never rendered as <Component />.
      'react/display-name': 'off',
      // Only the two stable hook rules: eslint-plugin-react-hooks v7's "recommended" also bundles the
      // React Compiler's opinionated rules (set-state-in-effect, refs, purity, ...), which flag this
      // codebase's ordinary fetch-in-effect and ref-forwarding patterns even though they work correctly
      // and this app doesn't use the compiler.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Both uses in this codebase are deliberate: localStorage/sessionStorage can throw (private
      // browsing, quota) and the fallback is to just proceed without persisting.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['vite.config.js'],
    languageOptions: { globals: globals.node },
  },
]
