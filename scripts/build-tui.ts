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
        // Don't bundle these
        "@opentui/core",
        "@opentui/solid",
        "solid-js",
        "solid-js/store",
        "solid-js/web",
        // Node built-ins
        "events",
        "path",
        "fs",
        "process",
        // Project dependencies
        "../core/*",
        "../../core/*",
        "../utils/*",
        "../../utils/*",
      ],
      plugins: [
        solidPlugin({
          solid: {
            generate: "universal",
            hydratable: false,
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
