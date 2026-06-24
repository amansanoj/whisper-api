import { Database } from "bun:sqlite";

const db = new Database("vault.sqlite");

db.query(
  `
  CREATE TABLE IF NOT EXISTS secrets (
    id TEXT PRIMARY KEY,
    secret TEXT NOT NULL,
    maxViews INTEGER DEFAULT 1,
    currentViews INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )  
`,
).run();

export const insertSecret = (id: string, secret: string, maxViews: number) => {
  db.query(
    "INSERT INTO secrets (id, secret, maxViews) VALUES ($id, $secret, $maxViews)",
  ).run({
    $id: id,
    $secret: secret,
    $maxViews: maxViews,
  });
};

export const readSecret = (id: string) => {
  const row = db
    .query("SELECT secret, maxViews, currentViews FROM secrets WHERE id = $id")
    .get({ $id: id }) as {
    secret: string;
    maxViews: number;
    currentViews: number;
  };

  if (!row) return null;

  const newViews = row.currentViews + 1;
  const remainingViews = row.maxViews - newViews;
  const wasBurned = remainingViews <= 0;

  if (wasBurned) {
    db.query("DELETE FROM secrets WHERE id = $id").run({ $id: id });
  } else {
    db.query("UPDATE secrets SET currentViews = $views WHERE id = $id").run({
      $views: newViews,
      $id: id,
    });
  }

  return {
    secret: row.secret,
    remainingViews,
    wasBurned,
  };
};

export const burnSecret = (id: string): string | null => {
  const row = db
    .query("SELECT secret FROM secrets WHERE id = $id")
    .get({ $id: id }) as { secret: string } | null;

  if (row) {
    db.query("DELETE FROM secrets WHERE id = $id").run({ $id: id });
    return row.secret;
  }

  return null;
};

export const getActiveVaultStats = (limit: number, offset: number) => {
  return db
    .query(
      `SELECT id, createdAt FROM secrets ORDER BY createdAT DESC LIMIT $limit OFFSET $offset`,
    )
    .all({ $limit: limit, $offset: offset });
};
