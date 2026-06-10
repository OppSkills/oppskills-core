import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,

  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  {
    files: ["src/features/chat/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/chat/api/*", "**/features/chat/api/*"],
              message:
                "Chat components must not import the API layer directly. Use hooks.",
            },
            {
              group: ["@/features/chat/cache/*", "**/features/chat/cache/*"],
              message:
                "Chat components must not import cache internals. Use hooks or the public feature API.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["src/app/dashboard/chats/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features/chat/**",
                "!@/features/chat",
                "!@/features/chat/pages/ChatsPageShell",
              ],
              message:
                "Chat routes must import from @/features/chat public API only.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
