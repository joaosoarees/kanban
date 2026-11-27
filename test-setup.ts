import { plugin } from "bun";

plugin({
  name: "server-only-on-server",
  setup(build) {
    build.onResolve({ filter: /^server-only$/u }, () => ({
      path: `${import.meta.dir}/node_modules/server-only/empty.js`,
    }));
  },
});
