import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Translate Next.js's legacy ESLint config (`next/core-web-vitals`) into
// flat-config form. FlatCompat is the upstream-recommended bridge until
// eslint-config-next ships native flat support (planned for the 16.x line).
// https://eslint.org/docs/latest/use/configure/migration-guide
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
