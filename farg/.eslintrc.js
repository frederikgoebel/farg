module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    "plugin:vue/essential",
    "eslint:recommended",
    "@vue/typescript/recommended",
    "@vue/prettier",
    "@vue/prettier/@typescript-eslint"
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-var": "warn",
    "no-redeclare": "warn",
    "prefer-const": "warn",
    "no-unreachable": "warn",
    "vue/no-unused-components": "warn",
    "@typescript-eslint/camelcase": "warn",
    "@typescript-eslint/no-use-before-define": "warn"
  }
};
