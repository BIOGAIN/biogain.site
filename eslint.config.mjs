import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    // _disabled-pages holds parked template pages that never ship; skip them.
    ignores: ['dist/**', 'node_modules/**', '.astro/**', 'src/_disabled-pages/**'],
  },
  {
    rules: {
      // Allow unused vars starting with underscore
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Allow any types in some cases (starter kit flexibility)
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Astro frontmatter references ambient TS types (e.g. ImageMetadata) that
    // no-undef can't resolve; declare them as readonly globals.
    files: ['**/*.astro'],
    languageOptions: {
      globals: {
        ImageMetadata: 'readonly',
      },
    },
  },
  {
    // CommonJS config files run in the Node environment.
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  }
);
