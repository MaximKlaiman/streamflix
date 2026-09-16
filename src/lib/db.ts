import "server-only";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// A real embedded SQL database - no external service needed to run this
// locally. Note for deployment: on serverless platforms (e.g. Vercel) the
// filesystem is ephemeral, so a file-based SQLite db will NOT persist
// writes across invocations in production. For a deployed demo where My
// List needs to persist, swap this file for a hosted SQLite-compatible
// database such as Turso (https://turso.tech) - same SQL, same queries
// below, just a different client. See README "Deploying" section.
const dbPath = path.join(process.cwd(), "data", "app.db");

let _db: Database.Database | null = null;
function getDb(): Database.Database {
  if (_db) return _db;
  // data/ is gitignored on purpose (nobody should commit a database file),
  // which means it doesn't exist yet on a fresh clone - create it before
  // better-sqlite3 tries to open a file inside it.
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS my_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tmdb_id INTEGER NOT NULL,
      media_type TEXT NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, tmdb_id, media_type)
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return _db;
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
}

export const userRepo = {
  create(email: string, passwordHash: string, displayName: string): UserRow {
    const stmt = getDb().prepare(
      "INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)"
    );
    const info = stmt.run(email.toLowerCase(), passwordHash, displayName);
    return this.findById(info.lastInsertRowid as number)!;
  },
  findByEmail(email: string): UserRow | undefined {
    return getDb()
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email.toLowerCase()) as UserRow | undefined;
  },
  findById(id: number): UserRow | undefined {
    return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
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
  listFor(userId: number): MyListRow[] {
    return getDb()
      .prepare("SELECT * FROM my_list WHERE user_id = ? ORDER BY added_at DESC")
      .all(userId) as MyListRow[];
  },
  add(userId: number, item: { tmdbId: number; mediaType: string; title: string; posterPath: string | null }) {
    getDb()
      .prepare(
        `INSERT OR IGNORE INTO my_list (user_id, tmdb_id, media_type, title, poster_path)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(userId, item.tmdbId, item.mediaType, item.title, item.posterPath);
  },
  remove(userId: number, tmdbId: number, mediaType: string) {
    getDb()
      .prepare("DELETE FROM my_list WHERE user_id = ? AND tmdb_id = ? AND media_type = ?")
      .run(userId, tmdbId, mediaType);
  },
};

export interface ProfileRow {
  id: number;
  user_id: number;
  name: string;
  avatar_color: string;
}

export const profileRepo = {
  listForUser(userId: number): ProfileRow[] {
    return getDb()
      .prepare("SELECT * FROM profiles WHERE user_id = ? ORDER BY id ASC")
      .all(userId) as ProfileRow[];
  },
  findById(id: number): ProfileRow | undefined {
    return getDb().prepare("SELECT * FROM profiles WHERE id = ?").get(id) as ProfileRow | undefined;
  },
  create(userId: number, name: string, avatarColor: string): ProfileRow {
    const info = getDb()
      .prepare("INSERT INTO profiles (user_id, name, avatar_color) VALUES (?, ?, ?)")
      .run(userId, name, avatarColor);
    return this.findById(info.lastInsertRowid as number)!;
  },
  rename(id: number, name: string) {
    getDb().prepare("UPDATE profiles SET name = ? WHERE id = ?").run(name, id);
  },
  remove(id: number) {
    getDb().prepare("DELETE FROM profiles WHERE id = ?").run(id);
  },
};
