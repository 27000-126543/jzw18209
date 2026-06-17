import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve('./data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'habit_tracker.db');
const db = new sqlite3.Database(dbPath);

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`PRAGMA foreign_keys = ON`);

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50) DEFAULT 'target',
        color VARCHAR(20) DEFAULT '#10b981',
        frequency VARCHAR(20) DEFAULT 'daily',
        target_count INTEGER DEFAULT 1,
        reminder_time VARCHAR(10),
        deadline_time VARCHAR(10) DEFAULT '22:00',
        is_public BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS check_ins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        habit_id INTEGER NOT NULL,
        content TEXT,
        photos TEXT,
        mood INTEGER CHECK(mood BETWEEN 1 AND 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (habit_id) REFERENCES habits(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id),
        FOREIGN KEY (following_id) REFERENCES users(id),
        UNIQUE(follower_id, following_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        icon VARCHAR(50) NOT NULL,
        requirement INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS user_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        badge_id INTEGER NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (badge_id) REFERENCES badges(id),
        UNIQUE(user_id, badge_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        habit_id INTEGER,
        creator_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        max_members INTEGER DEFAULT 20,
        invite_code VARCHAR(20) UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (habit_id) REFERENCES habits(id),
        FOREIGN KEY (creator_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(team_id, user_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checkin_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (checkin_id) REFERENCES check_ins(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(checkin_id, user_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checkin_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (checkin_id) REFERENCES check_ins(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        related_id INTEGER,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      db.get(`SELECT COUNT(*) as count FROM badges`, (err, row: { count: number }) => {
        if (err) {
          reject(err);
          return;
        }
        if (row.count === 0) {
          const badgeStmt = db.prepare(`INSERT INTO badges (name, description, icon, requirement, type) VALUES (?, ?, ?, ?, ?)`);
          badgeStmt.run('初露锋芒', '连续打卡7天', 'flame', 7, 'streak');
          badgeStmt.run('坚持不懈', '连续打卡30天', 'trophy', 30, 'streak');
          badgeStmt.run('习惯大师', '连续打卡100天', 'crown', 100, 'streak');
          badgeStmt.run('早起达人', '累计早起打卡100次', 'sunrise', 100, 'total');
          badgeStmt.run('健身达人', '累计健身打卡50次', 'dumbbell', 50, 'total');
          badgeStmt.run('阅读达人', '累计阅读打卡50次', 'book-open', 50, 'total');
          badgeStmt.finalize();
        }
        resolve();
      });
    });
  });
};

export const runQuery = <T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows as T[]) || []);
    });
  });
};

export const runQueryOne = <T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve((row || null) as T | null);
    });
  });
};

export const runInsert = (sql: string, params: unknown[] = []): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

export const runUpdate = (sql: string, params: unknown[] = []): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

export default db;
