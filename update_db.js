import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'server', 'db.sqlite')
const db = new sqlite3.Database(DB_PATH)

console.log('🔄 Atualizando estrutura do banco de dados...')

// Adicionar coluna is_admin
console.log('Adicionando coluna is_admin...')
db.run('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0', (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('❌ Erro ao adicionar is_admin:', err)
  } else {
    console.log('✅ Coluna is_admin adicionada (ou já existia)')
  }
  
  // Adicionar coluna subscription_end
  console.log('Adicionando coluna subscription_end...')
  db.run('ALTER TABLE users ADD COLUMN subscription_end INTEGER', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('❌ Erro ao adicionar subscription_end:', err)
    } else {
      console.log('✅ Coluna subscription_end adicionada (ou já existia)')
    }
    
    // Tornar o usuário matrixbit@gmail.com como admin
    console.log('🔄 Tornando matrixbit@gmail.com admin...')
    db.run('UPDATE users SET is_admin = 1 WHERE email = "matrixbit@gmail.com"', (err) => {
      if (err) {
        console.error('❌ Erro ao tornar admin:', err)
      } else {
        console.log('✅ Usuário matrixbit@gmail.com agora é admin!')
      }
      
      // Definir subscription_end para admin (lifetime)
      console.log('🔄 Definindo assinatura lifetime para admin...')
      db.run('UPDATE users SET subscription_end = 4102444800000 WHERE email = "matrixbit@gmail.com"', (err) => {
        if (err) {
          console.error('❌ Erro ao definir assinatura:', err)
        } else {
          console.log('✅ Admin agora tem assinatura lifetime!')
        }
        
        console.log('🎉 Banco de dados atualizado com sucesso!')
        process.exit(0)
      })
    })
  })
})