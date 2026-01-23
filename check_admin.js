import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'server', 'db.sqlite')
const db = new sqlite3.Database(DB_PATH)

// Verificar usuário admin
console.log('🔍 Verificando usuário admin...')
db.get('SELECT id, email, name, is_admin, plan, subscription_end FROM users WHERE email = ?', ['matrixbit@gmail.com'], (err, row) => {
  if (err) {
    console.error('❌ Erro ao buscar usuário:', err)
    process.exit(1)
  }

  if (row) {
    console.log('✅ Usuário admin encontrado:')
    console.log('  ID:', row.id)
    console.log('  Email:', row.email)
    console.log('  Nome:', row.name)
    console.log('  is_admin:', row.is_admin)
    console.log('  Plano:', row.plan)
    console.log('  Fim da assinatura:', new Date(row.subscription_end).toLocaleString())
    
    // Se não for admin, tornar admin
    if (!row.is_admin) {
      console.log('🔄 Tornando usuário admin...')
      db.run('UPDATE users SET is_admin = 1 WHERE id = ?', [row.id], (err) => {
        if (err) {
          console.error('❌ Erro ao atualizar:', err)
        } else {
          console.log('✅ Usuário agora é admin!')
        }
        process.exit(0)
      })
    } else {
      console.log('✅ Usuário já é admin!')
      process.exit(0)
    }
  } else {
    console.log('❌ Usuário admin não encontrado!')
    process.exit(1)
  }
})