import { expect, test } from "@playwright/test";

test("production pages and APIs carry the security response policy", async ({
  request,
}) => {
  for (const path of ["/patient", "/api/demo-session", "/api/health"]) {
    const response = await request.get(path);
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("no-referrer");
    expect(headers["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["strict-transport-security"]).toBe("max-age=31536000");
    expect(headers["x-powered-by"]).toBeUndefined();
    if (path.startsWith("/api/"))
      expect(headers["cache-control"]).toBe("no-store");
  }
});
