function firstHeaderValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0];
  return first ? first.trim() : null;
}

function unquote(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseForwardedHeader(value: string | null): { host?: string; proto?: string } {
  if (!value) return {};
  // RFC 7239: Forwarded: for=..., proto=https; host=example.com
  // We only care about the first entry.
  const first = value.split(",")[0] ?? "";
  const pairs = first.split(";").map((part) => part.trim());
  const result: { host?: string; proto?: string } = {};
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.split("=");
    const key = (rawKey ?? "").trim().toLowerCase();
    const rawVal = rest.join("=");
    if (!key || !rawVal) continue;
    const val = unquote(rawVal);
    if (key === "host") result.host = val;
    if (key === "proto") result.proto = val;
  }
  return result;
}

function isLoopbackHost(host: string) {
  const normalized = host.trim().toLowerCase();
  return (
    normalized.startsWith("localhost") ||
    normalized.startsWith("127.0.0.1") ||
    normalized.startsWith("[::1]") ||
    normalized === "::1"
  );
}

function parseAllowedOrigins(value: string | undefined) {
  if (!value) return new Set<string>();
  return new Set(
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function parseOriginLikeHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getRequestOrigin(request: Request): string {
  const forced = process.env.APP_ORIGIN;
  if (forced) {
    try {
      const url = new URL(forced);
      return url.origin;
    } catch {
      // ignore invalid APP_ORIGIN
    }
  }

  const forwarded = parseForwardedHeader(request.headers.get("forwarded"));

  const forwardedHost =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ?? forwarded.host;
  const host = forwardedHost ?? request.headers.get("host");

  const forwardedProto =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ?? forwarded.proto;
  const proto = forwardedProto ?? new URL(request.url).protocol.replace(":", "");

  if (host && !isLoopbackHost(host)) return `${proto}://${host}`;

  // If we're behind a proxy/port-forward, Host may be localhost even when the
  // browser is accessing a different origin. As a safe fallback, allow using
  // Origin/Referer only when it matches the configured dev allowlist.
  const allowlist = parseAllowedOrigins(process.env.ALLOWED_DEV_ORIGINS);
  const originHeader = parseOriginLikeHeader(request.headers.get("origin"));
  if (originHeader && allowlist.has(originHeader)) return originHeader;

  const refererOrigin = parseOriginLikeHeader(request.headers.get("referer"));
  if (refererOrigin && allowlist.has(refererOrigin)) return refererOrigin;

  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}
