/** @type {import("lint-staged").Configuration} */
const config = {
  "*.{js,jsx,mjs,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"],
};

export default config;
