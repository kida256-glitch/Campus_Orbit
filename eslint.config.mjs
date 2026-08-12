import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      // Generated from the live database schema; not hand-maintained.
      "src/lib/types/database.ts",
      // Supabase CLI scratch space.
      "supabase/.temp/**",
      "supabase/.branches/**",
      // Stand-alone Node scripts — not part of the Next.js app.
      "scripts/**",
      "*.log",
    ],
  },
  {
    rules: {
      // Server Actions legitimately take `FormData` and return unions; the
      // explicit-any ban is more useful than the unused-vars default here.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];


export default config;
