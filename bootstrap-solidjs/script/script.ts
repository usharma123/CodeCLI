/**
 * Build script configuration.
 * Reads version from package.json and channel/preview from environment.
 */

import pkg from "../package.json"

const version = process.env.OPENCODE_VERSION || pkg.version
const channel = process.env.OPENCODE_CHANNEL || "latest"
const preview = version.includes("-") || channel !== "latest"

export const Script = {
  version,
  channel,
  preview,
}
