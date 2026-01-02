/**
 * Build script for the SolidJS TUI
 *
 * Compiles SolidJS components using esbuild with the solid plugin.
 */

import * as esbuild from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";
import path from "path";

const srcDir = path.resolve(import.meta.dir, "../src/tui");
const outDir = path.resolve(import.meta.dir, "../dist/tui");

async function build() {
  console.log("Building SolidJS TUI...");

  try {
    await esbuild.build({
      entryPoints: [path.join(srcDir, "entry.ts")],
      bundle: true,
      outdir: outDir,
      format: "esm",
      platform: "node",
      target: "node20",
      external: [
        // Don't bundle these - must be external for proper runtime
        "@opentui/core",
        "@opentui/solid",
        // Node built-ins
        "events",
        "path",
        "fs",
        "process",
      ],
      // Use browser condition for solid-js to get reactive primitives (not SSR)
      conditions: ["browser", "module"],
      plugins: [
        // Plugin to rewrite relative paths for external imports
        // Maps ../core, ../../core, ../../../core -> ../core (for dist/tui/ output)
        {
          name: "rewrite-external-paths",
          setup(build) {
            // Match any relative import to core or utils
            build.onResolve({ filter: /^\.\.\/.*\/(core|utils)\// }, (args) => {
              // Extract the module path after core/ or utils/
              const match = args.path.match(/\/(core|utils)\/(.+)$/);
              if (match) {
                const [, folder, rest] = match;
                return {
                  path: `../${folder}/${rest}`,
                  external: true,
                };
              }
              return null;
            });
          },
        },
        solidPlugin({
          solid: {
            generate: "universal",
            hydratable: false,
            // Use @opentui/solid for renderer primitives instead of solid-js/web
            moduleName: "@opentui/solid",
          },
        }),
      ],
      sourcemap: true,
      minify: false,
      keepNames: true,
    });

    console.log("TUI build complete!");
  } catch (error) {
    console.error("TUI build failed:", error);
    process.exit(1);
  }
}

build();
