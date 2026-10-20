import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "@typescript-eslint/no-namespace": "off",
      "no-console": "off",
      "no-undef": "off",
      "no-case-declarations": "off",
      "no-empty": "warn",
      "no-useless-escape": "off",
      "no-control-regex": "off",
      "prefer-const": "warn"
    }
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/*.js",
      "**/*.cjs",
      "src/seed*.ts",
      "src/check*.ts",
      "src/verify*.ts",
      "src/scripts/**"
    ]
  }
);
