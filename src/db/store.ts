import { Database } from "bun:sqlite";

const db = new Database("vault.sqlite");

db.query(
  `
  CREATE TABLE IF NOT EXISTS secrets (
    id TEXT PRIMARY KEY,
    secret TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )  
`,
).run();

export const insertSecret = (id: string, secret: string) => {
  db.query("INSERT INTO secrets (id, secret) VALUES ($id, $secret)").run({
    $id: id,
    $secret: secret,
  });
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

export const getActiveVaultStats = () => {
  return db.query("SELECT id, createdAt FROM secrets").all();
};
