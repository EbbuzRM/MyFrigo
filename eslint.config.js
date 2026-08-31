// eslint.config.js — eslint.config module.
//
// exports: tseslint
// used_by: none
// rules:   The ESLint configuration is defined through the `tseslint.config()` functional API rather than a flat config object, requiring all rule modifications to be made within the exported configuration array and not as separate overrides.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      "android/**",
      "ios/**",
      "build/**",
      "dist/**",
      "*.min.js",
      "EXDevMenuApp.android.js"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      react
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^(_|e)", ignoreRestSiblings: true }
      ],
      "no-undef": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-empty-pattern": "error",
      "no-async-promise-executor": "error",
      "no-useless-escape": "error",
      "prefer-const": "error",
      "no-empty": "error",
      "no-func-assign": "error",
      "no-prototype-builtins": "error",
      "no-control-regex": "error",
      "require-yield": "error",
      "no-dupe-keys": "error",
      // TypeScript already reports genuine redeclarations; the JS rule only fires
      // on harmless clashes between imports and the react-native/browser global sets.
      "no-redeclare": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": true, "ts-nocheck": true }
      ]
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  {
    // Node config & script files — require() is a valid module system here,
    // these never go through Metro.
    files: [
      "*.js",
      "*.cjs",
      "scripts/**/*.js",
      "plugins/**/*.js",
      "__mocks__/**/*.js"
    ],
    languageOptions: {
      globals: { ...globals.node }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    // Ambient type declarations: `any` is often the correct escape hatch here.
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    // Test files: require() is needed for the mock-hoisting pattern (see CLAUDE.md),
    // `any` / loose `Function` types are fine for mock casts, and unused symbols in
    // mock factories / partial render destructures are not worth chasing.
    files: [
      "**/__tests__/**",
      "**/*.{test,spec}.{js,jsx,ts,tsx}",
      "jest.setup.js"
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-function-type": "off"
    }
  }
);