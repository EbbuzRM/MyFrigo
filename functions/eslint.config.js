const tseslint = require("typescript-eslint");
const globals = require("globals");

module.exports = tseslint.config(
  {
    ignores: ["lib/**"],
  },
  {
    files: ["**/*.ts"],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { "argsIgnorePattern": "^_" },
      ],
    },
  }
);
