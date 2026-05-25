import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/prefer-as-const": "warn",
    "@typescript-eslint/no-unused-disable-directive": "off",

    // React rules
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/refs": "warn",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",

    // Next.js rules
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",

    // General JavaScript rules
    "prefer-const": "warn",
    "no-unused-vars": "off",
    "no-console": "warn",
    "no-debugger": "error",
    "no-empty": "error",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "warn",
    "no-undef": "warn",
    "no-unreachable": "off",
    "no-useless-escape": "off",
  },
}, {
  // Scripts can use console.log and don't need strict rules
  files: ["scripts/**/*.mjs", "scripts/**/*.js"],
  rules: {
    "no-console": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
}, {
  // Relaxed rules for test files
  files: ["src/__tests__/**/*.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-require-imports": "off",
    "no-unused-vars": "off",
  },
}, {
  // Ignore generated files and build artifacts
  files: ["next-env.d.ts"],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "no-unused-vars": "off",
  },
}, {
  // db-users.ts is a large legacy file — warn instead of error
  files: ["src/lib/db-users.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "_archive_extracted/**"],
}];

export default eslintConfig;
