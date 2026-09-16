import "server-only";
import { createClient } from "@libsql/client";

// A real hosted SQL database (Turso/libSQL) instead of a local SQLite file -
// serverless platforms like Vercel have an ephemeral, read-only filesystem,
// so a file-based database wouldn't persist writes in production. Turso
// speaks the same SQL as the SQLite this project started with, just over
// the network, which is why the schema/queries below are unchanged.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

let schemaReady: Promise<void> | null = null;
function ready(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          display_name TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      await client.execute(`
        CREATE TABLE IF NOT EXISTS my_list (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          tmdb_id INTEGER NOT NULL,
          media_type TEXT NOT NULL,
          title TEXT NOT NULL,
          poster_path TEXT,
          added_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(user_id, tmdb_id, media_type)
        )
      `);
      await client.execute(`
        CREATE TABLE IF NOT EXISTS profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          avatar_color TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
    })();
  }
  return schemaReady;
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
}

export const userRepo = {
  async create(email: string, passwordHash: string, displayName: string): Promise<UserRow> {
    await ready();
    const result = await client.execute({
      sql: "INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)",
      args: [email.toLowerCase(), passwordHash, displayName],
    });
    return (await this.findById(Number(result.lastInsertRowid)))!;
  },
  async findByEmail(email: string): Promise<UserRow | undefined> {
    await ready();
    const result = await client.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email.toLowerCase()],
    });
    return result.rows[0] as unknown as UserRow | undefined;
  },
  async findById(id: number): Promise<UserRow | undefined> {
    await ready();
    const result = await client.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });
    return result.rows[0] as unknown as UserRow | undefined;
  },
};

export interface MyListRow {
  id: number;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  added_at: string;
}

export const myListRepo = {
  async listFor(userId: number): Promise<MyListRow[]> {
    await ready();
    const result = await client.execute({
      sql: "SELECT * FROM my_list WHERE user_id = ? ORDER BY added_at DESC",
      args: [userId],
    });
    return result.rows as unknown as MyListRow[];
  },
  async add(
    userId: number,
    item: { tmdbId: number; mediaType: string; title: string; posterPath: string | null }
  ) {
    await ready();
    await client.execute({
      sql: `INSERT OR IGNORE INTO my_list (user_id, tmdb_id, media_type, title, poster_path)
            VALUES (?, ?, ?, ?, ?)`,
      args: [userId, item.tmdbId, item.mediaType, item.title, item.posterPath],
    });
  },
  async remove(userId: number, tmdbId: number, mediaType: string) {
    await ready();
    await client.execute({
      sql: "DELETE FROM my_list WHERE user_id = ? AND tmdb_id = ? AND media_type = ?",
      args: [userId, tmdbId, mediaType],
    });
  },
};

export interface ProfileRow {
  id: number;
  user_id: number;
  name: string;
  avatar_color: string;
}

export const profileRepo = {
  async listForUser(userId: number): Promise<ProfileRow[]> {
    await ready();
    const result = await client.execute({
      sql: "SELECT * FROM profiles WHERE user_id = ? ORDER BY id ASC",
      args: [userId],
    });
    return result.rows as unknown as ProfileRow[];
  },
  async findById(id: number): Promise<ProfileRow | undefined> {
    await ready();
    const result = await client.execute({ sql: "SELECT * FROM profiles WHERE id = ?", args: [id] });
    return result.rows[0] as unknown as ProfileRow | undefined;
  },
  async create(userId: number, name: string, avatarColor: string): Promise<ProfileRow> {
    await ready();
    const result = await client.execute({
      sql: "INSERT INTO profiles (user_id, name, avatar_color) VALUES (?, ?, ?)",
      args: [userId, name, avatarColor],
    });
    return (await this.findById(Number(result.lastInsertRowid)))!;
  },
  async rename(id: number, name: string) {
    await ready();
    await client.execute({ sql: "UPDATE profiles SET name = ? WHERE id = ?", args: [name, id] });
  },
  async remove(id: number) {
    await ready();
    await client.execute({ sql: "DELETE FROM profiles WHERE id = ?", args: [id] });
  },
};
