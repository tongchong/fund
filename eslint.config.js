const base = require("@ddadaal/eslint-config");

module.exports = [
  {
    ignores: [
      "**/node_modules/",
      "**/build/",
      "**/coverage/",
      "**/next-env.d.ts",
      "**/generated/",
      "**/.turbo/",
      "**/.next",
      "**/.docusaurus/",
    ]
  },
  ...base,
  {
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "require-await": "off",
      "@typescript-eslint/require-await": "off",
    }
  }
];
