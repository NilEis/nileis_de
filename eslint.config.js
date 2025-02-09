import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import stylisticTS from "@stylistic/eslint-plugin";
import eslint from "@eslint/js";

export default tseslint.config(
    {
      ignores: ["dist/**", "**/*.mjs", "eslint.config.mjs", "**/*.js"],
    },
    {
      files: ["src/**/*.ts"],
    },
    {
      plugins: {
        "@stylistic": stylistic,
        "@stylistic/ts": stylisticTS,
      },
    },
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    eslintPluginAstro.configs.recommended,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: "./",
        },
      },
    },
    {
      rules: {
        "@stylistic/indent": ["error", 2, { SwitchCase: 1 }],
        "@stylistic/array-bracket-spacing": ["error", "always"],
        "@stylistic/arrow-spacing": "error",
        "@stylistic/block-spacing": "error",
        "@stylistic/brace-style": ["error", "allman", { allowSingleLine: true }],
        "@stylistic/dot-location": ["error", "property"],
        "@stylistic/eol-last": ["error", "always"],
        "@stylistic/function-call-spacing": ["error", "always"],
        "@stylistic/function-paren-newline": ["error", "multiline"],
        "@stylistic/indent-binary-ops": ["error", 2],
        "@stylistic/key-spacing": [
          "error",
          { beforeColon: false, afterColon: true },
        ],
        "@stylistic/linebreak-style": ["error", "unix"],
        "@stylistic/lines-around-comment": [
          "error",
          {
            beforeBlockComment: true,
            beforeLineComment: true,
            allowBlockStart: true,
            allowBlockEnd: false,
            allowClassStart: true,
            allowClassEnd: false,
            allowObjectStart: true,
            allowObjectEnd: false,
            allowArrayStart: true,
            allowArrayEnd: false,
            allowEnumStart: true,
            allowEnumEnd: false,
            allowInterfaceStart: true,
            allowInterfaceEnd: false,
            allowModuleStart: true,
            allowModuleEnd: false,
          },
        ],
        "@stylistic/ts/member-delimiter-style": "error",
        "@stylistic/multiline-ternary": ["error", "always-multiline"],
        "@stylistic/new-parens": ["error", "never"],
        "@stylistic/newline-per-chained-call": [
          "error",
          { ignoreChainWithDepth: 2 },
        ],
        "@stylistic/no-floating-decimal": "error",
        "@stylistic/no-mixed-operators": "error",
        "@stylistic/no-mixed-spaces-and-tabs": "error",
        "@stylistic/no-multi-spaces": "error",
        "@stylistic/no-multiple-empty-lines": ["error", { max: 2 }],
        "@stylistic/no-trailing-spaces": "error",
        "@stylistic/no-whitespace-before-property": "error",
        "@stylistic/operator-linebreak": ["error", "before"],
        "@stylistic/quotes": ["error", "double", { "allowTemplateLiterals": true }],
        quotes: ["error", "double", { allowTemplateLiterals: true }],
      },
    }
  );
  