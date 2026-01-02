import { Log } from "../util/log"

export namespace Share {
  const log = Log.create({ service: "share" })

  // Share functionality is disabled for local-only mode
  // All functions are no-ops that return appropriate empty/failure values

  export async function sync(_key: string, _content: any) {
    // No-op: sharing disabled for local mode
  }

  export function init() {
    log.info("Share functionality disabled (local-only mode)")
    // No event subscriptions needed for local mode
  }

  export async function create(_sessionID: string): Promise<{ url: string; secret: string }> {
    log.warn("Share creation disabled (local-only mode)")
    throw new Error("Share functionality is disabled in local-only mode")
  }

  export async function remove(_sessionID: string, _secret: string): Promise<any> {
    log.warn("Share removal disabled (local-only mode)")
    throw new Error("Share functionality is disabled in local-only mode")
  }
}
