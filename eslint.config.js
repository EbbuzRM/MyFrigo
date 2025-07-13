const globals = require("globals");
const tseslint = require("typescript-eslint");
const react = require("eslint-plugin-react");

module.exports = [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: react,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "no-unused-vars": "off", // Disable base rule
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^(_|e)", ignoreRestSiblings: true }],
      "no-undef": "off", // Handled by TypeScript
      "react/react-in-jsx-scope": "off", // Not needed for React 17+
      "react/prop-types": "off", // Not needed with TypeScript
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    ignores: ["android/app/build/**", "node_modules/**"],
  },
];