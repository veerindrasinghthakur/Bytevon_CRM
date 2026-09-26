import js from '@eslint/js'
import typescriptEslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'

export default typescriptEslint.config(
  { ignores: ['dist/', 'node_modules/', '*.config.*', 'coverage/'] },
  js.configs.recommended,
  ...typescriptEslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // RBAC hygiene: barrel-only imports avoid the win32 can.ts/Can.tsx casing collision;
      // canLegacy is sync-mock and scope-unaware — use useRbac().can instead.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/shared/rbac/Can',
              message: "Import { Can } from '@/shared/rbac' instead (case-sensitivity).",
            },
            {
              name: '@/shared/rbac/can',
              message: "Import { canWith, hasPermission } from '@/shared/rbac' instead.",
            },
          ],
          patterns: [
            {
              group: ['**/shared/rbac/legacy', '**/shared/rbac/legacy.*'],
              message: 'canLegacy/useCanLegacy are deprecated — use useRbac().can instead.',
            },
          ],
        },
      ],
    },
  }
)