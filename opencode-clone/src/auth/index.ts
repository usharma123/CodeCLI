import z from "zod"

/**
 * Simplified Auth module - uses environment variables only, no file storage.
 * API keys should be set in .env file (OPENROUTER_API_KEY, etc.)
 */
export namespace Auth {
  export const Oauth = z
    .object({
      type: z.literal("oauth"),
      refresh: z.string(),
      access: z.string(),
      expires: z.number(),
      enterpriseUrl: z.string().optional(),
    })
    .meta({ ref: "OAuth" })

  export const Api = z
    .object({
      type: z.literal("api"),
      key: z.string(),
    })
    .meta({ ref: "ApiAuth" })

  export const WellKnown = z
    .object({
      type: z.literal("wellknown"),
      key: z.string(),
      token: z.string(),
    })
    .meta({ ref: "WellKnownAuth" })

  export const Info = z.discriminatedUnion("type", [Oauth, Api, WellKnown]).meta({ ref: "Auth" })
  export type Info = z.infer<typeof Info>

  // In-memory storage for any runtime-set auth (mainly for compatibility)
  const _authStore: Record<string, Info> = {}

  export async function get(providerID: string): Promise<Info | undefined> {
    // First check in-memory store
    if (_authStore[providerID]) {
      return _authStore[providerID]
    }
    // No file-based auth - use environment variables directly in provider.ts
    return undefined
  }

  export async function all(): Promise<Record<string, Info>> {
    // Return in-memory store only
    return { ..._authStore }
  }

  export async function set(key: string, info: Info) {
    // Store in memory only
    _authStore[key] = info
  }

  export async function remove(key: string) {
    delete _authStore[key]
  }
}
