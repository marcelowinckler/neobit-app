import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'server', 'db.sqlite')
const db = new sqlite3.Database(DB_PATH)

console.log('🔄 Adicionando coluna is_blocked...')
db.run('ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0', (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('❌ Erro ao adicionar is_blocked:', err)
  } else {
    console.log('✅ Coluna is_blocked adicionada (ou já existia)')
  }
  
  console.log('🎉 Banco de dados atualizado!')
  process.exit(0)
})