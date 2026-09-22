import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The Bubblewrap TWA project — a separate, non-workspace Node project
    // (see android/.gitignore) that also contains a full extracted JDK
    // source tree under android/tools/, not something ESLint should ever
    // walk.
    "android/**",
  ]),
]);

export default eslintConfig;
