import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'server', 'db.sqlite');
const db = new sqlite3.Database(DB_PATH);

const createTables = () => {
  db.serialize(() => {
    // Tabela de usuários
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        plan TEXT,
        is_admin INTEGER DEFAULT 0,
        subscription_end INTEGER,
        is_blocked INTEGER DEFAULT 0
      )
    `);

    // Tabela de IAs
    db.run(`
      CREATE TABLE IF NOT EXISTS ais (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        short_desc TEXT,
        prompt TEXT,
        model TEXT,
        image_url TEXT,
        is_public INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        extra_context TEXT,
        FOREIGN KEY(owner_user_id) REFERENCES users(id)
      )
    `);

    // Tabela de conversas
    db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ai_id INTEGER,
        title TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(ai_id) REFERENCES ais(id)
      )
    `);

    // Tabela de mensagens
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Tabela de compartilhamentos
    db.run(`
      CREATE TABLE IF NOT EXISTS shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER NOT NULL,
        title TEXT,
        model TEXT,
        ai_id INTEGER,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(owner_user_id) REFERENCES users(id)
      )
    `);

    // Tabela de preferências
    db.run(`
      CREATE TABLE IF NOT EXISTS preferences (
        user_id INTEGER PRIMARY KEY,
        preferred_name TEXT,
        persona TEXT,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    console.log('Tabelas verificadas e criadas com sucesso.');
  });
};

createTables();
db.close();