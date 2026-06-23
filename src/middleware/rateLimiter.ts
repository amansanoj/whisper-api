import { Context, Next } from "hono";

const rateLimitCache = new Map<string, number[]>();

export const rateLimiter = async (c: Context, next: Next) => {
  const ip = c.req.header("x-forwarded-for") || "127.0.0.1";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 5;

  const userRequests = rateLimitCache.get(ip) || [];

  const recentRequests = userRequests.filter((time) => now - time < windowMs);

  if (recentRequests.length >= limit) {
    return c.json(
      {
        error: "429 Too Many Requests",
        message: "Chill out bro. Try again in a minute.",
      },
      429,
    );
  }

  recentRequests.push(now);
  rateLimitCache.set(ip, recentRequests);

  await next();
};
