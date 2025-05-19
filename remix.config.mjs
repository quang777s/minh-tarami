import pkg from '@remix-run/dev';
const { defineConfig } = pkg;

export default defineConfig({
  ignoredRouteFiles: ["**/*.css"],
  tailwind: true,
  postcss: true,
});
