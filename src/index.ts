import { Hono } from "hono";
import { createSecretSchema } from "./types";
import {
  burnSecret,
  getActiveVaultStats,
  insertSecret,
  readSecret,
} from "./db/store";
import { bearerAuth } from "hono/bearer-auth";
import { rateLimiter } from "./middleware/rateLimiter";
import { sendDiscordAlert } from "./utils/discord";

const app = new Hono();

app.post("/api/secrets", rateLimiter, async (c) => {
  try {
    const body = await c.req.json();

    const result = createSecretSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { error: "Invalid payload", details: result.error.issues },
        400,
      );
    }

    const id = Math.random().toString(36).substring(2, 8);

    insertSecret(id, result.data.secret, result.data.allowedViews);

    const burnLink = `${new URL(c.req.url).origin}/s/${id}`;

    sendDiscordAlert("Created", id);

    return c.json(
      {
        message: "Secret vaulted.",
        burnLink,
        expires:
          result.data.allowedViews === 1
            ? "Upon first read."
            : `After ${result.data.allowedViews} reads.`,
      },
      201,
    );
  } catch (error) {
    return c.json({ error: "Failed to process request." }, 500);
  }
});

app.get("/s/:id", (c) => {
  const id = c.req.param("id");

  const result = readSecret(id);

  if (!result) {
    return c.json(
      {
        error: "410 Gone",
        message: "This secret has already been burned or does not exist.",
      },
      410,
    );
  }

  if (result.wasBurned) {
    sendDiscordAlert("Burned", id);
  } else {
    console.log(`Secret ${id} was read. ${result.remainingViews} views left.`);
  }

  return c.json(
    {
      warning: result.wasBurned
        ? "This message has been permanently deleted from the server."
        : `This message will self-destruct in ${result.remainingViews} more views.`,
      secret: result.secret,
    },
    200,
  );
});

app.get(
  "/api/vault",
  bearerAuth({ token: process.env.TOKEN as string }),
  (c) => {
    const limit = Number(c.req.query("limit")) || 10;
    const page = Number(c.req.query("page")) || 1;
    const offset = (page - 1) * limit;

    const stats = getActiveVaultStats(limit, offset);

    return c.json(
      {
        message: "Vault access granted.",
        pagination: {
          page,
          limit,
          returnedRecords: stats.length,
        },
        data: stats,
      },
      200,
    );
  },
);

export default app;
