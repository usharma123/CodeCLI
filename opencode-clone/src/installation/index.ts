import { BusEvent } from "@/bus/bus-event"
import path from "path"
import { $ } from "bun"
import z from "zod"
import { NamedError } from "@/util-lib/error"
import { Log } from "../util/log"
import { Flag } from "../flag/flag"

declare global {
  const OPENCODE_VERSION: string
  const OPENCODE_CHANNEL: string
}

export namespace Installation {
  const log = Log.create({ service: "installation" })

  export type Method = "local" | "bun" | "unknown"

  export const Event = {
    Updated: BusEvent.define(
      "installation.updated",
      z.object({
        version: z.string(),
      }),
    ),
    UpdateAvailable: BusEvent.define(
      "installation.update-available",
      z.object({
        version: z.string(),
      }),
    ),
  }

  export const Info = z
    .object({
      version: z.string(),
      latest: z.string(),
    })
    .meta({
      ref: "InstallationInfo",
    })
  export type Info = z.infer<typeof Info>

  export async function info() {
    return {
      version: VERSION,
      latest: VERSION, // Local installation - no remote version check
    }
  }

  export function isPreview() {
    return false
  }

  export function isLocal() {
    return true // Always local for this build
  }

  export async function method(): Promise<Method> {
    if (process.execPath.includes(path.join(".bootstrap", "bin"))) return "local"
    if (process.execPath.includes(path.join(".local", "bin"))) return "local"
    if (process.execPath.toLowerCase().includes("bun")) return "bun"
    return "unknown"
  }

  export const UpgradeFailedError = NamedError.create(
    "UpgradeFailedError",
    z.object({
      stderr: z.string(),
    }),
  )

  export async function upgrade(_method: Method, _target: string) {
    // Upgrade not supported for local installation
    log.info("upgrade not supported for local installation")
    throw new Error("Upgrade not supported for local installation. Please use git pull.")
  }

  export const VERSION = typeof OPENCODE_VERSION === "string" ? OPENCODE_VERSION : "local"
  export const CHANNEL = typeof OPENCODE_CHANNEL === "string" ? OPENCODE_CHANNEL : "local"
  export const USER_AGENT = `bootstrap/${CHANNEL}/${VERSION}/${Flag.OPENCODE_CLIENT}`

  export async function latest(_installMethod?: Method): Promise<string> {
    // Local installation - return current version
    return VERSION
  }
}
