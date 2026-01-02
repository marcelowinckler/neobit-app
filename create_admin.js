import sqlite3 from 'sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'server', 'db.sqlite')
const db = new sqlite3.Database(DB_PATH)

const EMAIL = 'matrixbit@gmail.com'
const PASSWORD = 'matrixbitoficial'
const NAME = 'Admin MatrixBit'

const hash = bcrypt.hashSync(PASSWORD, 10)
const now = Date.now()

db.get('SELECT id FROM users WHERE email = ?', [EMAIL], (err, row) => {
  if (err) {
    console.error('Error checking user:', err)
    process.exit(1)
  }

  if (row) {
    console.log('User exists. Updating password...')
    db.run('UPDATE users SET password_hash = ?, name = ? WHERE id = ?', [hash, NAME, row.id], (err) => {
      if (err) console.error('Error updating:', err)
      else console.log('Admin user updated successfully.')
      process.exit(0)
    })
  } else {
    console.log('Creating new admin user...')
    db.run('INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)', [EMAIL, NAME, hash, now], (err) => {
      if (err) console.error('Error inserting:', err)
      else console.log('Admin user created successfully.')
      process.exit(0)
    })
  }
})
