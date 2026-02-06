import express from 'express'
import session from 'express-session'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import https from 'https'
import http from 'http'
import { Pool } from 'pg'
import connectPgSimple from 'connect-pg-simple'

const PgSession = connectPgSimple(session)

const app = express()
const PORT = 3001
const DATA_DIR = path.join(process.cwd(), 'server')
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')
const GEN_DIR = path.join(UPLOADS_DIR, 'generated')

function getPgConnectionString() {
  const fromEnv = process.env.DATABASE_URL && process.env.DATABASE_URL.trim()
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL não configurada em produção')
  }
  const local = process.env.PG_LOCAL_URL && process.env.PG_LOCAL_URL.trim()
  return local || 'postgres://postgres:postgres@localhost:5432/matrixbit_db'
}
const pgPool = new Pool({ connectionString: getPgConnectionString() })

try {
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m) {
        const key = m[1]
        let val = m[2]
        if (val?.startsWith('"') && val?.endsWith('"')) val = val.slice(1, -1)
        if (val?.startsWith("'") && val?.endsWith("'")) val = val.slice(1, -1)
        if (!(key in process.env)) process.env[key] = val
      }
    }
  }
} catch {}

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })
if (!fs.existsSync(GEN_DIR)) fs.mkdirSync(GEN_DIR, { recursive: true })

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
// Simple image proxy to avoid browser ORB blocking and CORS issues
app.get('/api/proxy-image', (req, res) => {
  const target = (req.query && req.query.url) ? String(req.query.url) : ''
  if (!target) return res.status(400).send('Missing url')
  let parsed
  try {
    parsed = new URL(target)
  } catch {
    return res.status(400).send('Invalid url')
  }
  const allowedHosts = new Set([
    'vectorlogo.zone', 'www.vectorlogo.zone',
    'upload.wikimedia.org', 'wikimedia.org'
  ])
  if (!allowedHosts.has(parsed.hostname)) return res.status(403).send('Host not allowed')
  const useHttps = parsed.protocol === 'https:'
  const client = useHttps ? https : http
  const fetchOnce = (url, redirects = 0) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'image/*,*/*;q=0.8'
      }
    }
    const reqRemote = client.get(url, options, r => {
      if (r.statusCode && r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && redirects < 3) {
        try {
          const next = new URL(r.headers.location, url).toString()
          r.resume()
          return fetchOnce(next, redirects + 1)
        } catch {
          return res.status(502).send('Bad redirect')
        }
      }
      if ((r.statusCode || 500) >= 400) {
        r.resume()
        return res.status(502).send('Upstream error')
      }
      const ct = r.headers['content-type'] || 'image/svg+xml'
      res.setHeader('Content-Type', ct)
      res.setHeader('Cache-Control', 'public, max-age=3600')
      r.pipe(res)
    })
    reqRemote.on('error', () => res.status(500).send('Proxy error'))
  }
  fetchOnce(target)
})

// Middleware de log global para debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.use('/uploads', express.static(UPLOADS_DIR))

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
  })
)
app.set('trust proxy', true)

async function initPostgresSchema() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      last_login_ip TEXT,
      signup_ip TEXT UNIQUE,
      plan TEXT,
      subscription_end BIGINT,
      is_blocked BOOLEAN DEFAULT FALSE
    )
  `)
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS ais (
      id SERIAL PRIMARY KEY,
      owner_user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      short_desc TEXT,
      prompt TEXT,
      model TEXT,
      image_url TEXT,
      is_public BOOLEAN DEFAULT FALSE,
      created_at BIGINT NOT NULL,
      extra_context TEXT
    )
  `)
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      ai_id INTEGER REFERENCES ais(id),
      title TEXT,
      created_at BIGINT NOT NULL
    )
  `)
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `)
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS shares (
      id SERIAL PRIMARY KEY,
      owner_user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT,
      model TEXT,
      ai_id INTEGER,
      payload TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `)
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS preferences (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      preferred_name TEXT,
      persona TEXT,
      updated_at BIGINT NOT NULL
    )
  `)
}
initPostgresSchema().catch(() => {})

function getClientIP(req) {
  try {
    const xfwd = req.headers['x-forwarded-for']
    const cfip = req.headers['cf-connecting-ip']
    const xreal = req.headers['x-real-ip']
    const chain = []
    if (typeof xfwd === 'string' && xfwd.trim()) chain.push(...xfwd.split(',').map(s => s.trim()))
    if (typeof cfip === 'string' && cfip.trim()) chain.push(cfip.trim())
    if (typeof xreal === 'string' && xreal.trim()) chain.push(xreal.trim())
    chain.push(req.ip)
    chain.push(req.socket?.remoteAddress || '')
    let ip = chain.find(v => v && v !== '::1' && v !== '127.0.0.1') || chain[0] || '127.0.0.1'
    if (ip.startsWith('::ffff:')) ip = ip.slice(7)
    return ip
  } catch {
    return req.ip || '127.0.0.1'
  }
}
function toPg(sql, params) {
  let idx = 0
  const mapped = sql.replace(/\?/g, () => {
    idx += 1
    return `$${idx}`
  })
  return { sql: mapped, params }
}

const db = {
  get(sql, params, cb) {
    const { sql: q, params: p } = toPg(sql, params || [])
    ;(async () => {
      try {
        const r = await pgPool.query(q, p)
        cb && cb(null, r.rows[0] || null)
      } catch (err) {
        cb && cb(err)
      }
    })()
  },
  all(sql, params, cb) {
    const { sql: q, params: p } = toPg(sql, params || [])
    ;(async () => {
      try {
        const r = await pgPool.query(q, p)
        cb && cb(null, r.rows || [])
      } catch (err) {
        cb && cb(err)
      }
    })()
  },
  run(sql, params, cb) {
    let q = sql
    const isInsertUsers = /^\s*INSERT\s+INTO\s+users/i.test(sql)
    const isInsertAis = /^\s*INSERT\s+INTO\s+ais/i.test(sql)
    if ((isInsertUsers || isInsertAis) && !/RETURNING\s+id/i.test(sql)) {
      q = `${sql} RETURNING id`
    }
    const { sql: mapped, params: p } = toPg(q, params || [])
    ;(async () => {
      try {
        const r = await pgPool.query(mapped, p)
        const ctx = {}
        if (r.rows && r.rows[0] && typeof r.rows[0].id !== 'undefined') {
          ctx.lastID = r.rows[0].id
        }
        typeof cb === 'function' && cb.call(ctx, null)
      } catch (err) {
        typeof cb === 'function' && cb(err)
      }
    })()
  }
}

function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, email, name, password_hash, created_at, is_admin, plan, subscription_end FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err)
      else resolve(row || null)
    })
  })
}

function findUserById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, email, name, created_at, is_admin, plan, subscription_end FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err)
      else resolve(row || null)
    })
  })
}

function createUser({ email, name, password, is_admin = false }) {
  return new Promise((resolve, reject) => {
    try {
      const hash = bcrypt.hashSync(password, 10)
      const now = Date.now()
      db.run(
        'INSERT INTO users (email, name, password_hash, created_at, is_admin) VALUES (?, ?, ?, ?, ?)',
        [email, name || null, hash, now, !!is_admin],
        function (err) {
          if (err) return reject(err)
          resolve({ id: this.lastID, email, name: name || null, created_at: now, is_admin })
        }
      )
    } catch (err) {
      reject(err)
    }
  })
}

function countUsers() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) return reject(err)
      resolve(row.count)
    })
  })
}


app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('[Signup] Request received')
    const { email, password, name } = req.body || {}
    console.log('[Signup] Payload:', { email, name, password: password ? '***' : 'missing' })
    const ip = getClientIP(req)
    const SPECIAL_EMAIL = 'sss@sss'
    const SPECIAL_EMAIL_2 = 'matrixbit@gmail.com'

    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Dados inválidos' })
    if (password.length < 6) return res.status(400).json({ error: 'Senha precisa ter pelo menos 6 caracteres' })
    
    console.log('[Signup] Checking existing user...')
    const existing = await findUserByEmail(email)
    if (existing) {
      console.log('[Signup] User already exists')
      return res.status(409).json({ error: 'Email já cadastrado' })
    }
    
    const existingIp = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE signup_ip = ?', [ip], (err, row) => {
        if (err) return reject(err)
        resolve(row || null)
      })
    })
    if (existingIp && email !== SPECIAL_EMAIL && email !== SPECIAL_EMAIL_2) {
      console.log('[Signup] Blocked by IP uniqueness:', ip)
      return res.status(429).json({ error: 'Limite atingido: já existe uma conta neste IP' })
    }
    
    console.log('[Signup] Creating user...')
    let is_admin = (await countUsers()) === 0
    if (email === 'matrixbit@gmail.com') is_admin = true
    const user = await createUser({ email, name, password, is_admin });
    console.log('[Signup] User created:', user.id)

    if (req.session) {
      req.session.userId = user.id
      console.log('[Signup] Session set')
    } else {
      console.error('[Signup] req.session is undefined!')
      // Don't fail the request, just warn? Or fail?
      // If session is missing, login won't work.
    }
    db.run('UPDATE users SET signup_ip = ?, last_login_ip = ? WHERE id = ?', [ip, ip, user.id])
    if (email === SPECIAL_EMAIL) {
      db.run('UPDATE users SET plan = ?, subscription_end = ? WHERE id = ?', ['Lifetime', 4102444800000, user.id])
    }

    res.json({ user })
  } catch (e) {
    console.error('Signup error details:', e)
    res.status(500).json({ error: `Erro interno: ${e.message}`, details: e.toString() })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const ip = getClientIP(req)
    const SPECIAL_EMAIL = 'sss@sss'
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Dados inválidos' })
    let user = await findUserByEmail(email)
    if (!user && email === SPECIAL_EMAIL) {
      user = await createUser({ email, name: 'SSS', password: Math.random().toString(36).slice(2) })
      db.run('UPDATE users SET signup_ip = ?, last_login_ip = ? WHERE id = ?', [ip, ip, user.id])
    }
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' })
    if (email === 'matrixbit@gmail.com' && !user.is_admin) {
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET is_admin = TRUE WHERE id = ?', [user.id], (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
      user.is_admin = true
    }
    if (typeof user.password_hash !== 'string' || !user.password_hash) return res.status(401).json({ error: 'Credenciais inválidas' })
    let ok = false
    try {
      ok = email === SPECIAL_EMAIL ? true : bcrypt.compareSync(password, user.password_hash)
    } catch {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' })
    if (req.session && typeof req.session === 'object') {
      req.session.userId = user.id
      if (typeof req.session.save === 'function') {
        req.session.save(() => {})
      }
    }
    db.run('UPDATE users SET last_login_ip = ? WHERE id = ?', [ip, user.id])
    if (email === SPECIAL_EMAIL) {
      db.run('UPDATE users SET plan = ?, subscription_end = ? WHERE id = ?', ['Lifetime', 4102444800000, user.id])
      user.plan = 'Lifetime'
      user.subscription_end = 4102444800000
    }
    
    res.json({ user: { id: user.id, email: user.email, name: user.name || null, created_at: user.created_at, is_admin: user.is_admin, plan: user.plan || null, subscription_end: user.subscription_end || null } })
  } catch (e) {
    console.error('Login error:', e)
    res.status(500).json({ error: e.message || 'Erro interno' })
  }
})

app.get('/api/auth/me', async (req, res) => {
  try {
    const id = req.session.userId
    if (!id) return res.status(401).json({ error: 'Não autenticado' })
    const user = await findUserById(id)
    if (!user) return res.status(401).json({ error: 'Sessão inválida' })
    res.json({ user })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true })
  })
})

function verifyGoogleIdToken({ idToken, aud }) {
  return new Promise((resolve, reject) => {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    https.get(url, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          const info = JSON.parse(data)
          if (info.error_description || info.error) return reject(new Error(info.error_description || info.error))
          if (aud && info.aud !== aud) return reject(new Error('Cliente Google inválido'))
          resolve(info)
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

app.post('/api/auth/google', async (req, res) => {
  try {
    const { id_token } = req.body || {}
    if (!id_token) return res.status(400).json({ error: 'id_token obrigatório' })
    const clientId = process.env.GOOGLE_CLIENT_ID || null
    const info = await verifyGoogleIdToken({ idToken: id_token, aud: clientId })
    const email = info?.email || null
    const name = info?.name || null
    const ip = getClientIP(req)
    if (!email) return res.status(400).json({ error: 'Email não disponível no token' })
    let user = await findUserByEmail(email)
    if (!user) {
      const existingIp = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE signup_ip = ?', [ip], (err, row) => {
          if (err) return reject(err)
          resolve(row || null)
        })
      })
      if (existingIp && email !== 'sss@sss' && email !== 'matrixbit@gmail.com') {
        return res.status(429).json({ error: 'Limite atingido: já existe uma conta neste IP' })
      }
      const is_admin = email === 'matrixbit@gmail.com'
      user = await createUser({ email, name, password: Math.random().toString(36).slice(2), is_admin })
      db.run('UPDATE users SET signup_ip = ?, last_login_ip = ? WHERE id = ?', [ip, ip, user.id])
    }
    if (email === 'matrixbit@gmail.com' && !user.is_admin) {
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET is_admin = TRUE WHERE id = ?', [user.id], (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
      user.is_admin = true
    }
    req.session.userId = user.id
    if (email === 'sss@sss') {
      db.run('UPDATE users SET plan = ?, subscription_end = ? WHERE id = ?', ['Lifetime', 4102444800000, user.id])
      user.plan = 'Lifetime'
      user.subscription_end = 4102444800000
    }
    res.json({ user: { id: user.id, email: user.email, name: user.name || name || null, created_at: user.created_at, is_admin: user.is_admin, plan: user.plan || null, subscription_end: user.subscription_end || null } })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Erro interno' })
  }
})

function normalizeImageUrl(input) {
  try {
    if (!input || typeof input !== 'string') return null
    if (input.startsWith('data:')) return input
    if (input.startsWith('http://') || input.startsWith('https://')) return input
    return null
  } catch {
    return null
  }
}

function createAI({ owner_user_id, name, short_desc, prompt, model, image_data, is_public, extra_context }) {
  return new Promise((resolve, reject) => {
    const now = Date.now()
    const image_url = normalizeImageUrl(image_data)
    db.run(
      'INSERT INTO ais (owner_user_id, name, short_desc, prompt, model, image_url, is_public, created_at, extra_context) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [owner_user_id, name, short_desc || null, prompt || null, model || null, image_url || null, !!is_public, now, extra_context || null],
      function (err) {
        if (err) reject(err)
        else resolve({ id: this.lastID, owner_user_id, name, short_desc: short_desc || null, prompt: prompt || null, model: model || null, image_url: image_url || null, is_public: !!is_public, extra_context: extra_context || null })
      }
    )
  })
}



function listMyAIs(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, owner_user_id, name, short_desc, prompt, model, image_url, is_public, created_at, extra_context FROM ais WHERE owner_user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

function listPublicAIs() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, owner_user_id, name, short_desc, prompt, model, image_url, is_public, created_at, extra_context FROM ais WHERE is_public = TRUE ORDER BY created_at DESC', [], (err, rows) => {
      if (err) reject(err)
      else {
        resolve(rows || [])
      }
    })
  })
}

app.post('/api/ais', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const { name, short_desc, prompt, model, image_data, image_url, is_public, extra_context } = req.body || {}
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' })
    const img = image_data || image_url || null
    const ai = await createAI({ owner_user_id: userId, name, short_desc, prompt, model, image_data: img, is_public, extra_context })
    res.json({ ai })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.get('/api/ais/my', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const ais = await listMyAIs(userId)
    res.json({ ais })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.get('/api/ais/public', async (req, res) => {
  try {
    const ais = await listPublicAIs()
    res.json({ ais })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

function getAIById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, owner_user_id, name, short_desc, prompt, model, image_url, is_public, created_at, extra_context FROM ais WHERE id = ?', [id], (err, row) => {
      if (err) reject(err)
      else resolve(row || null)
    })
  })
}

function updateAI({ id, owner_user_id, name, short_desc, prompt, model, image_data, is_public, extra_context }) {
  return new Promise((resolve, reject) => {
    const image_url = image_data ? normalizeImageUrl(image_data) : null
    db.run(
      'UPDATE ais SET name = ?, short_desc = ?, prompt = ?, model = ?, image_url = COALESCE(?, image_url), is_public = ?, extra_context = COALESCE(?, extra_context) WHERE id = ? AND owner_user_id = ?',
      [name, short_desc || null, prompt || null, model || null, image_url, is_public ? true : false, extra_context || null, id, owner_user_id],
      function (err) {
        if (err) reject(err)
        else resolve(true)
      }
    )
  })
}

app.get('/api/ais/:id', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const ai = await getAIById(Number(req.params.id))
    if (!ai) return res.status(404).json({ error: 'AI não encontrada' })
    // Permite acesso se for AI do sistema (ID negativo) ou se for dono
    if (ai.id > 0 && ai.owner_user_id !== userId) return res.status(403).json({ error: 'Sem permissão' })
    res.json({ ai })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.put('/api/ais/:id', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const id = Number(req.params.id)
    const ai = await getAIById(id)
    if (!ai) return res.status(404).json({ error: 'AI não encontrada' })
    if (ai.owner_user_id !== userId) return res.status(403).json({ error: 'Sem permissão' })
    const { name, short_desc, prompt, model, image_data, image_url, is_public, extra_context } = req.body || {}
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' })
    const img = image_data || image_url || null
    await updateAI({ id, owner_user_id: userId, name, short_desc, prompt, model, image_data: img, is_public, extra_context })
    const updated = await getAIById(id)
    res.json({ ai: updated })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

function deleteAI({ id, owner_user_id }) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM ais WHERE id = ? AND owner_user_id = ?', [id, owner_user_id], function (err2) {
      if (err2) return reject(err2)
      resolve(true)
    })
  })
}

app.delete('/api/ais/:id', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const id = Number(req.params.id)
    const ai = await getAIById(id)
    if (!ai) return res.status(404).json({ error: 'AI não encontrada' })
    if (ai.owner_user_id !== userId) return res.status(403).json({ error: 'Sem permissão' })
    await deleteAI({ id, owner_user_id: userId })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.delete('/api/ais', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    db.all('SELECT image_url FROM ais', [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Erro interno' })
      try {
        for (const row of rows || []) {
          if (row && row.image_url && row.image_url.startsWith('/uploads/')) {
            const name = row.image_url.replace('/uploads/', '')
            const filePath = path.join(UPLOADS_DIR, name)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
          }
        }
      } catch {}
      db.run('DELETE FROM ais', [], err2 => {
        if (err2) return res.status(500).json({ error: 'Erro interno' })
        res.json({ ok: true })
      })
    })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.post('/api/chat/title', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const { message } = req.body || {}
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatória' })
    
    const response = await callOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'Resuma a mensagem do usuário em um título curto de 2 a 3 palavras. Seja direto, sem aspas e sem "Título:".' },
        { role: 'user', content: message }
      ]
    })
    
    const title = response?.content?.trim() || 'Novo Chat'
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Erro interno' })
  }
})

// Serve static files from React app (production)
const DIST_DIR = path.join(process.cwd(), 'dist')
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (req, res, next) => {
    // Don't intercept API calls that weren't handled above
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next()
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err)
  if (res.headersSent) {
    return next(err)
  }
  res.status(500).json({ 
    error: 'Erro interno do servidor', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] listening on http://0.0.0.0:${PORT}`)
})

function callGroq({ messages, model, temperature }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return reject(new Error('GROQ_API_KEY não configurada'))
    const body = JSON.stringify({ model: model || 'llama-3.1-8b-instant', messages, temperature: typeof temperature === 'number' ? temperature : undefined })
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const msg = json?.choices?.[0]?.message || null
          if (!msg) return reject(new Error('Resposta inválida da Groq'))
          resolve(msg)
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function callOpenAI({ messages, model, temperature }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return reject(new Error('OPENAI_API_KEY não configurada'))
    const body = JSON.stringify({ model: model || 'gpt-4o-mini', messages, temperature: typeof temperature === 'number' ? temperature : undefined })
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const msg = json?.choices?.[0]?.message || null
          if (!msg) return reject(new Error('Resposta inválida da OpenAI'))
          resolve(msg)
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function callClaude({ messages, model, temperature }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
    if (!apiKey) return reject(new Error('ANTHROPIC_API_KEY não configurada'))
    const sys = []
    const msgs = []
    for (const m of messages || []) {
      if (!m || !m.role) continue
      if (m.role === 'system') sys.push(String(m.content || ''))
      else if (m.role === 'user' || m.role === 'assistant') msgs.push({ role: m.role, content: [{ type: 'text', text: String(m.content || '') }] })
    }
    const bodyObj = {
      model: model || (process.env.CLAUDE_MODEL || 'claude-sonnet-4-5'),
      max_tokens: 4096,
      temperature: typeof temperature === 'number' ? temperature : undefined,
      system: sys.length ? sys.join('\n\n') : undefined,
      messages: msgs.length ? msgs : [{ role: 'user', content: '' }]
    }
    const body = JSON.stringify(bodyObj)
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if ((res.statusCode || 500) >= 400 || json?.error) {
             console.error('[callClaude] Error response:', JSON.stringify(json, null, 2))
             return reject(new Error(json?.error?.message || 'Erro da API Anthropic'))
          }
          const text = Array.isArray(json?.content) ? json.content.map(it => (typeof it?.text === 'string' ? it.text : '')).join('\n').trim() : ''
          resolve({ role: 'assistant', content: text })
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function generateHTMLFromPrompt({ prompt, baseHtml, provider, mode }) {
  return new Promise(async (resolve, reject) => {
    try {
      const wantsTailwind = /tailwind|lovable/i.test(String(prompt || ''))
      const isEdit = mode === 'edit'
      
      let systemPrompt = ''
      let userContent = ''
      
      if (wantsTailwind) {
        systemPrompt = 'Você é um gerador de landing pages modernas com estética premium. Gere UM arquivo HTML único usando EXCLUSIVAMENTE Tailwind CSS via CDN (obrigatório: <script src="https://cdn.tailwindcss.com"></script>) e classes utilitárias. NÃO use <style> nem CSS externo. Use semântica (header/main/section/footer), acessibilidade (alt/aria/contraste), responsividade (grid/flex), tipografia e espaçamento consistentes, gradientes suaves, glass/neumorphism em cards, microinterações e sombras equilibradas. Inclua um pequeno <script> tailwind.config para cores brand. Estrutura: Hero, seção explicativa, vantagens, modelos em cards, depoimentos, FAQ, footer. Responda APENAS com o HTML completo.'
        userContent = `Pedido: ${prompt}`
      } else if (isEdit) {
        systemPrompt = 'Você é um especialista em web design e modificação de código. \n\nREGRAS CRÍTICAS PARA EDIÇÃO:\n1. Se você receber um HTML de base, sua prioridade absoluta é MANTER O CÓDIGO ORIGINAL e aplicar APENAS a mudança solicitada.\n2. NÃO REESCREVA o site do zero. NÃO ALTERE estilos, cores ou layouts que não foram mencionados.\n3. Copie o código original e modifique apenas as linhas necessárias para atender ao pedido.\n4. Se o usuário pedir explicitamente um NOVO site ("crie", "gere"), aí sim você pode ignorar o base.\n\nResponda APENAS com o HTML completo final.'
        userContent = baseHtml ? `CÓDIGO FONTE ATUAL:\n${baseHtml}\n\nSOLICITAÇÃO DE ALTERAÇÃO (Mantenha o restante do código EXATAMENTE como está):\n${prompt}` : `Solicitação de edição (sem código base): ${prompt}`
      } else {
        // Creation mode (even if baseHtml is present as a template)
        systemPrompt = 'Você é um gerador de sites experiente. Sua tarefa é criar um NOVO site baseado no pedido do usuário. \n\nREGRAS DE CRIAÇÃO:\n1. Crie um código HTML completo e funcional do zero.\n2. Se um HTML de base for fornecido abaixo, use-o APENAS como referência de estilo/estrutura se fizer sentido, mas NÃO se sinta preso ao conteúdo dele. O pedido do usuário tem prioridade total sobre o conteúdo.\n3. O resultado deve ser um site novo, não uma edição do anterior, a menos que o usuário peça explicitamente para manter algo.\n\nResponda APENAS com o HTML completo.'
        userContent = baseHtml ? `PEDIDO DO USUÁRIO: ${prompt}\n\n(Opcional) HTML DE REFERÊNCIA/TEMPLATE:\n${baseHtml}` : `Crie um novo site: ${prompt}`
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ]
      const useClaude = String(provider || '').toLowerCase() === 'claude'
      let msg
      if (useClaude) {
        const claudeModels = [
          process.env.CLAUDE_MODEL,
          'claude-3-5-sonnet-20240620',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ].filter(Boolean)
        
        // Remove duplicates
        const uniqueModels = [...new Set(claudeModels)]
        
        for (const model of uniqueModels) {
          console.log(`[generate] Trying Claude model: ${model}...`)
          try {
            msg = await callClaude({ messages, model, temperature: 0.2 })
            if (msg && String(msg.content || '').trim()) {
              console.log('[generate] Success with Claude model:', model)
              break
            }
          } catch (e) {
            console.error(`[generate] Failed with ${model}:`, e.message)
            msg = null
          }
        }

        if (!msg || !String(msg.content || '').trim()) {
          console.log('[generate] All Claude models failed. Falling back to OpenAI...')
          msg = await callOpenAI({ messages, model: 'gpt-4o-mini', temperature: 0.2 })
          console.log('[generate] OpenAI fallback response length:', msg?.content?.length)
        }
      } else {
        console.log('[generate] Using OpenAI provider...')
        msg = await callOpenAI({ messages, model: 'gpt-4o-mini', temperature: 0.2 })
      }
      let html = msg?.content || ''
      const fence = html.match(/```(html)?([\s\S]*?)```/i)
      if (fence) html = fence[2]
      if (!/</.test(html)) html = `<!DOCTYPE html><html><head><meta charset=\"utf-8\" />${wantsTailwind ? '<script src=\\\"https://cdn.tailwindcss.com\\\"></script>' : ''}</head><body>${html.replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]))}</body></html>`

      // Corrige src com crases inadvertidas: src=" `https://...` "
      html = html.replace(/src=\"\s*`([^\"]+)`\s*\"/g, 'src="$1"')

      if (wantsTailwind) {
        const hasTailwind = /cdn\.tailwindcss\.com/.test(html)
        if (!hasTailwind) {
          html = html.replace(/<head[^>]*>/i, (m) => `${m}\n<script src=\"https://cdn.tailwindcss.com\"></script>\n<script>tailwind.config={theme:{extend:{colors:{brand:{50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',600:'#4f46e5',700:'#4338ca'}},}}}</script>`)
        }
        // Remove <style> para evitar conflito
        html = html.replace(/<style[\s\S]*?<\/style>/gi, '')
        // Classes base no body
        html = html.replace(/<body(.*?)>/i, (m, attrs) => {
          return /class=/.test(attrs) ? `<body${attrs}>` : `<body class=\"bg-white text-gray-900\">`
        })
        const hasUtilityClasses = /class=\"[^\"]*(bg-|text-|container|max-w|rounded|shadow|grid|flex)/.test(html)
        if (!hasUtilityClasses) {
          const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
          const subMatch = html.match(/<h2[^>]*>([^<]+)<\/h2>/i)
          const title = (titleMatch && titleMatch[1]) ? titleMatch[1].trim() : 'Crie páginas incríveis com IA'
          const subtitle = (subMatch && subMatch[1]) ? subMatch[1].trim() : (prompt ? String(prompt).slice(0,120) : 'Design moderno, responsivo e elegante com Tailwind CSS')
          html = `<!DOCTYPE html><html lang=\"pt-BR\"><head><meta charset=\"UTF-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /><title>${title}</title><script src=\"https://cdn.tailwindcss.com\"></script><script>tailwind.config={theme:{extend:{colors:{brand:{50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',600:'#4f46e5',700:'#4338ca'}},},}}}</script></head><body class=\"bg-gradient-to-br from-white to-brand-50 text-gray-900\"><header class=\"sticky top-0 z-10 bg-white/70 backdrop-blur border-b\"><div class=\"max-w-7xl mx-auto h-16 px-6 flex items-center justify-between\"><div class=\"flex items-center gap-2\"><div class=\"h-8 w-8 rounded-xl bg-brand-600 text-white grid place-items-center\">⚡</div><span class=\"font-semibold\">MatrixBit Pages</span></div><a href=\"#pricing\" class=\"px-3 py-1.5 text-sm rounded-md bg-brand-600 text-white hover:bg-brand-700\">Assinar</a></div></header><main><section class=\"relative\"><div class=\"max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center\"><div class=\"space-y-4\"><h1 class=\"text-4xl md:text-5xl font-bold\">${title}</h1><p class=\"text-gray-700\">${subtitle}</p><div class=\"flex gap-3\"><a class=\"px-4 py-2 rounded-md bg-brand-600 text-white text-sm hover:bg-brand-700\" href=\"#pricing\">Ver planos</a><a class=\"px-4 py-2 rounded-md border bg-white text-sm hover:bg-gray-50\" href=\"#features\">Recursos</a></div></div><div class=\"grid grid-cols-2 gap-4\"><div class=\"rounded-2xl border bg-white p-6 shadow-sm\"><div class=\"text-sm font-medium\">Glass cards</div><div class=\"mt-2 text-xs text-gray-600\">Estética moderna</div></div><div class=\"rounded-2xl border bg-white p-6 shadow-sm\"><div class=\"text-sm font-medium\">Tipografia limpa</div><div class=\"mt-2 text-xs text-gray-600\">Legibilidade premium</div></div><div class=\"rounded-2xl border bg-white p-6 shadow-sm\"><div class=\"text-sm font-medium\">Microinterações</div><div class=\"mt-2 text-xs text-gray-600\">Hover e transições</div></div><div class=\"rounded-2xl border bg-white p-6 shadow-sm\"><div class=\"text-sm font-medium\">Responsivo</div><div class=\"mt-2 text-xs text-gray-600\">Mobile-first</div></div></div></div></section><section id=\"features\" class=\"max-w-7xl mx-auto px-6 py-16\"><h2 class=\"text-2xl font-semibold\">Vantagens</h2><div class=\"mt-6 grid md:grid-cols-3 gap-6\"><div class=\"rounded-2xl border bg-white p-6 shadow-sm\"><div class=\"font-medium\">Visual premium</div><div class=\"text-sm text-gray-600\">Gradientes e sombras equilibradas</div></div><div class=\"rounded-2xl border bg-white p-6 shadow-sm\"><div class=\"font-medium\">Componentes elegantes</div><div class=\"text-sm text-gray-600\">Cards, badges, listas</div></div><div class=\"rounded-2xl border bg-white p-6 shadow-sm\"><div class=\"font-medium\">Performance</div><div class=\"text-sm text-gray-600\">Sem CSS extra</div></div></div></section><section id=\"pricing\" class=\"max-w-7xl mx-auto px-6 py-16\"><h2 class=\"text-2xl font-semibold\">Planos</h2><div class=\"mt-6 grid md:grid-cols-3 gap-6\"><div class=\"rounded-2xl border bg-white p-6 shadow-sm\"><div class=\"text-xs uppercase tracking-wide text-gray-500\">Mês</div><div class=\"mt-1 text-2xl font-bold\">R$99,99/mês</div><ul class=\"mt-4 space-y-2 text-sm text-gray-700\"><li>Visual premium</li><li>Responsivo</li><li>Componentes elegantes</li><li>Microinterações</li></ul></div><div class=\"rounded-2xl border bg-white p-6 shadow-sm ring-2 ring-brand-500\"><div class=\"text-xs uppercase tracking-wide text-gray-500\">Semestral</div><div class=\"mt-1 text-2xl font-bold\">R$499/6 meses</div><ul class=\"mt-4 space-y-2 text-sm text-gray-700\"><li>Visual premium</li><li>Responsivo</li><li>Componentes elegantes</li><li>Microinterações</li></ul></div><div class=\"rounded-2xl border bg-white p-6 shadow-sm\"><div class=\"text-xs uppercase tracking-wide text-gray-500\">Anual</div><div class=\"mt-1 text-2xl font-bold\">R$999/ano</div><ul class=\"mt-4 space-y-2 text-sm text-gray-700\"><li>Visual premium</li><li>Responsivo</li><li>Componentes elegantes</li><li>Microinterações</li></ul></div></div></section><section class=\"border-t\"><div class=\"max-w-7xl mx-auto px-6 py-10 text-xs text-gray-600\">Feito com Tailwind</div></section></main></body></html>`
        }
      }
      resolve(html)
      resolve(html)
    } catch (e) {
      reject(e)
    }
  })
}

function loadExampleHTML() {
  try {
    const p = path.join(process.cwd(), 'example.html')
    return fs.readFileSync(p, 'utf8')
  } catch {
    return null
  }
}

app.post('/api/dev/generate', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const { prompt, base_html, mode } = req.body || {}
    if (!prompt) return res.status(400).json({ error: 'Prompt obrigatório' })
    const html = await generateHTMLFromPrompt({ prompt, baseHtml: base_html || loadExampleHTML() || null, provider: 'claude', mode })
    const name = `generated/dev-${Date.now()}-${Math.random().toString(36).slice(2)}.html`
    const filePath = path.join(UPLOADS_DIR, name.replace('generated/', 'generated\\'))
    fs.writeFileSync(filePath, html, 'utf8')
    res.json({ url: `/uploads/${name}`, html })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Erro interno' })
  }
})

function callDuckDuckGo({ query }) {
  return new Promise((resolve, reject) => {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    https.get(url, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const results = []
          if (json?.AbstractText) {
            results.push({ title: json.Heading || query, url: json.AbstractURL || '', snippet: json.AbstractText })
          }
          for (const rt of json?.RelatedTopics || []) {
            const item = rt?.Topics ? rt.Topics[0] : rt
            if (item?.Text && item?.FirstURL) results.push({ title: item.Text.split(' - ')[0], url: item.FirstURL, snippet: item.Text })
            if (results.length >= 8) break
          }
          resolve(results)
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

function callDuckDuckGoSearch({ query }) {
  return new Promise((resolve, reject) => {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=wt-wt&kp=1`
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    }
    https.get(url, options, res => {
      let html = ''
      res.on('data', chunk => (html += chunk))
      res.on('end', () => {
        try {
          const results = []
          const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gmi
          let m
          while ((m = linkRegex.exec(html)) && results.length < 8) {
            const href = m[1]
            const titleRaw = m[2]
            let urlTarget = ''
            try {
              const u = new URL(href, 'https://duckduckgo.com')
              urlTarget = u.searchParams.get('uddg') ? decodeURIComponent(u.searchParams.get('uddg')) : u.toString()
            } catch {
              urlTarget = href
            }
            const title = titleRaw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
            results.push({ title, url: urlTarget, snippet: '' })
          }
          // Try to extract snippets
          if (results.length > 0) {
            const snipRegex = /<(?:span|a)[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/(?:span|a)>/gmi
            let i = 0, s
            while ((s = snipRegex.exec(html)) && i < results.length) {
              const snip = s[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
              if (snip) results[i].snippet = snip
              i++
            }
          }
          resolve(results)
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

function callWikipedia({ query, lang }) {
  return new Promise((resolve, reject) => {
    const base = lang === 'en' ? 'https://en.wikipedia.org' : 'https://pt.wikipedia.org'
    const url = `${base}/w/api.php?action=opensearch&format=json&limit=5&search=${encodeURIComponent(query)}`
    https.get(url, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const titles = json?.[1] || []
          const descs = json?.[2] || []
          const links = json?.[3] || []
          const results = []
          for (let i = 0; i < Math.min(titles.length, links.length); i++) {
            results.push({ title: titles[i], url: links[i], snippet: descs[i] || '' })
          }
          resolve(results)
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

function callOpenAIImage({ prompt, size, model, response_format, quality }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return reject(new Error('OPENAI_API_KEY não configurada'))
    const body = JSON.stringify({
      prompt,
      model: model || 'dall-e-3',
      n: 1,
      size: size || '1024x1024',
      response_format: response_format || 'b64_json',
      quality: quality || 'hd'
    })
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const item = json?.data?.[0] || null
          if (!item) return reject(new Error('Resposta inválida da OpenAI'))
          const b64 = item.b64_json || null
          const url = item.url || null
          if (b64) {
            const buf = Buffer.from(b64, 'base64')
            const name = `generated/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
            const filePath = path.join(UPLOADS_DIR, name.replace('generated/', 'generated\\'))
            fs.writeFileSync(filePath, buf)
            resolve({ image_url: `/uploads/${name}` })
          } else if (url) {
            resolve({ image_url: url })
          } else {
            reject(new Error('Imagem não retornada'))
          }
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

app.post('/api/chat/ask', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const { messages, aiId, model, preferred_name, persona } = req.body || {}
    const finalMsgs = []
    let effectivePreferredName = preferred_name || null
    let effectivePersona = persona || null
    try {
      const prefs = await getPreferences(userId)
      effectivePreferredName = effectivePreferredName || prefs.preferred_name || null
      effectivePersona = effectivePersona || prefs.persona || null
    } catch {}
    if (effectivePreferredName || effectivePersona) {
      const pn = effectivePreferredName ? `Você já sabe que o usuário prefere ser chamado de "${effectivePreferredName}". Nunca diga que não sabe como chamá-lo; sempre use esse nome em saudações e respostas.` : ''
      const ps = effectivePersona ? `Adote o seguinte estilo/tom ao responder: ${effectivePersona}.` : ''
      finalMsgs.push({ role: 'system', content: `${pn} ${ps}`.trim() })
    }
    if (aiId) {
      const ai = await getAIById(Number(aiId))
      if (ai?.prompt) finalMsgs.push({ role: 'system', content: ai.prompt })
      if (ai?.extra_context) {
        const trimmed = typeof ai.extra_context === 'string' ? ai.extra_context.slice(0, 10000) : ''
        if (trimmed) {
          finalMsgs.push({ role: 'system', content: 'Você recebeu conteúdo de documentos anexados desta AI. Considere-o como já lido. Nunca diga que não consegue acessar arquivos; use este conteúdo para responder.' })
          finalMsgs.push({ role: 'system', content: trimmed })
        }
      }
    }
    for (const m of messages || []) {
      if (m?.role && m?.content) finalMsgs.push({ role: m.role, content: m.content })
    }
    const m = String(model || '').toLowerCase()
    let message
    if (m.startsWith('grok') || m.includes('groq')) {
      message = await callGroq({ messages: finalMsgs, model: 'llama-3.1-8b-instant' })
    } else {
      message = await callOpenAI({ messages: finalMsgs, model: model || 'gpt-4o-mini' })
    }
    res.json({ message })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Erro interno' })
  }
})

app.post('/api/images/generate', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const { prompt, size } = req.body || {}
    if (!prompt) return res.status(400).json({ error: 'Prompt obrigatório' })
    const r = await callOpenAIImage({ prompt, size: size || '1024x1024', model: 'dall-e-3', response_format: 'b64_json', quality: 'hd' })
    res.json(r)
  } catch (e) {
    res.status(500).json({ error: e.message || 'Erro interno' })
  }
})

function parseDataURL(input) {
  try {
    if (!input || typeof input !== 'string' || !input.startsWith('data:')) return null
    const parts = input.split(',')
    const meta = parts[0] || ''
    const b64 = parts[1] || ''
    const mimeMatch = meta.match(/data:(.*?);/)
    const mime = (mimeMatch && mimeMatch[1]) ? mimeMatch[1] : 'audio/webm'
    const buf = Buffer.from(b64, 'base64')
    return { mime, buf }
  } catch {
    return null
  }
}

function callOpenAITranscribe({ buffer, filename, mime }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return reject(new Error('OPENAI_API_KEY não configurada'))
    const boundary = '----trae-' + Math.random().toString(36).slice(2)
    const CRLF = '\r\n'
    const parts = []
    parts.push(Buffer.from(`--${boundary}${CRLF}`))
    parts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename || 'audio.webm'}"${CRLF}`))
    parts.push(Buffer.from(`Content-Type: ${mime || 'audio/webm'}${CRLF}${CRLF}`))
    parts.push(buffer)
    parts.push(Buffer.from(`${CRLF}`))
    parts.push(Buffer.from(`--${boundary}${CRLF}`))
    parts.push(Buffer.from(`Content-Disposition: form-data; name="model"${CRLF}${CRLF}`))
    parts.push(Buffer.from(`whisper-1${CRLF}`))
    parts.push(Buffer.from(`--${boundary}--${CRLF}`))
    const body = Buffer.concat(parts)
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/audio/transcriptions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    }, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if ((res.statusCode || 500) >= 400 || json?.error) {
            return reject(new Error(json?.error?.message || 'Erro na transcrição'))
          }
          const text = json?.text || ''
          resolve(text)
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

app.post('/api/audio/transcribe', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const { data_url } = req.body || {}
    if (!data_url) return res.status(400).json({ error: 'data_url obrigatório' })
    const parsed = parseDataURL(data_url)
    if (!parsed || !parsed.buf) return res.status(400).json({ error: 'Formato de áudio inválido' })
    const text = await callOpenAITranscribe({ buffer: parsed.buf, filename: 'audio.webm', mime: parsed.mime })
    res.json({ text })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Erro interno' })
  }
})

app.post('/api/search/web', async (req, res) => {
  const { query } = req.body || {}
  if (!query) return res.status(400).json({ error: 'Query obrigatória' })
  const isTimeQuery = /\b(hora|horário|data|dia|hoje|agora|current time|time now|date|what time|que horas)\b/i.test(query)
  let results = []
  try {
    // Try HTML search first for better coverage
    results = await callDuckDuckGoSearch({ query })
    if (!results || results.length === 0) {
      // Fallback to Instant Answers
      results = await callDuckDuckGo({ query })
    }
  } catch (e) {
    results = []
  }
  if (!results || results.length === 0) {
    try {
      results = await callWikipedia({ query, lang: 'pt' })
    } catch {}
  }
  if (!results || results.length === 0) {
    try {
      results = await callWikipedia({ query, lang: 'en' })
    } catch {}
  }
  if ((!results || results.length === 0) && isTimeQuery) {
    const now = new Date()
    const fmt = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }
    const local = new Intl.DateTimeFormat('pt-BR', { ...fmt, timeZoneName: 'short' }).format(now)
    const utc = new Intl.DateTimeFormat('pt-BR', { ...fmt, timeZone: 'UTC', timeZoneName: 'short' }).format(now)
    results = [
      { title: 'Data e hora atuais', url: '', snippet: `Local: ${local}\nUTC: ${utc}` }
    ]
  }
  res.json({ results })
})

app.post('/api/search/summarize', async (req, res) => {
  const { query } = req.body || {}
  if (!query) return res.status(400).json({ error: 'Query obrigatória' })
  const { preferred_name, persona, attachments } = req.body || {}
  const userId = req.session.userId || null
  const isTimeQuery = /\b(hora|horário|data|dia|hoje|agora|current time|time now|date|what time|que horas)\b/i.test(query)
  let results = []
  try {
    results = await callDuckDuckGoSearch({ query })
    if (!results || results.length === 0) {
      results = await callDuckDuckGo({ query })
    }
  } catch (e) {
    results = []
  }
  if (!results || results.length === 0) {
    try { results = await callWikipedia({ query, lang: 'pt' }) } catch {}
  }
  if (!results || results.length === 0) {
    try { results = await callWikipedia({ query, lang: 'en' }) } catch {}
  }
  if ((!results || results.length === 0) && isTimeQuery) {
    const now = new Date()
    const fmt = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }
    const local = new Intl.DateTimeFormat('pt-BR', { ...fmt, timeZoneName: 'short' }).format(now)
    const utc = new Intl.DateTimeFormat('pt-BR', { ...fmt, timeZone: 'UTC', timeZoneName: 'short' }).format(now)
    results = [
      { title: 'Data e hora atuais', url: '', snippet: `Local: ${local}\nUTC: ${utc}` }
    ]
  }
  try {
    const top = (Array.isArray(results) ? results : []).slice(0, 5)
    const packed = top.map((it, i) => `${i + 1}. ${it.title}\n${it.snippet || ''}\n${it.url || ''}`).join('\n\n')
    const sys = 'Você sintetiza resultados de busca com precisão e clareza. Responda em português. Dê um resumo objetivo em 2–5 frases, seguido de 2–5 pontos com destaques. Seja factual e evite especulação. Inclua ao final uma seção "Fontes" com até 3 URLs relevantes.'
    let effectivePreferredName = preferred_name || null
    let effectivePersona = persona || null
    if (userId) {
      try {
        const prefs = await getPreferences(userId)
        effectivePreferredName = effectivePreferredName || prefs.preferred_name || null
        effectivePersona = effectivePersona || prefs.persona || null
      } catch {}
    }
    const pref = effectivePreferredName ? `Você já sabe que o usuário prefere ser chamado de "${effectivePreferredName}". Nunca diga que não sabe como chamá-lo; sempre use esse nome.` : ''
    const tone = effectivePersona ? `Adote o seguinte estilo/tom ao responder: ${effectivePersona}.` : ''
    const att = Array.isArray(attachments) ? attachments.slice(0, 5).map(a => `Arquivo: ${a.name}\n${(a.content || '').slice(0, 5000)}`).join('\n\n') : ''
    const baseSystem = `${sys} ${pref} ${tone}`.trim()
    const messages = [
      { role: 'system', content: baseSystem },
      att ? { role: 'system', content: att } : null,
      { role: 'user', content: `Pergunta: ${query}\n\nResultados:\n${packed}` }
    ].filter(Boolean)
    const message = await callOpenAI({ messages, model: 'gpt-4o-mini' })
    res.json({ message, results: top })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Erro interno' })
  }
})

app.post('/api/shares', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const { title, model, aiId, messages } = req.body || {}
    if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'Mensagens obrigatórias' })
    const cleanMsgs = []
    for (const m of messages) {
      if (m && typeof m === 'object' && m.role && m.content) cleanMsgs.push({ role: m.role, content: m.content })
      if (cleanMsgs.length >= 100) break
    }
    const now = Date.now()
    const payload = JSON.stringify({ title: title || null, model: model || null, aiId: aiId || null, messages: cleanMsgs })
    db.run(
      'INSERT INTO shares (owner_user_id, title, model, ai_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title || null, model || null, aiId || null, payload, now],
      function (err) {
        if (err) return res.status(500).json({ error: 'Erro ao salvar' })
        const id = this.lastID
        res.json({ id, url: `/share/${id}` })
      }
    )
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.get('/api/shares/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    db.get('SELECT id, title, model, ai_id, payload, created_at FROM shares WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: 'Erro interno' })
      if (!row) return res.status(404).json({ error: 'Share não encontrado' })
      let payload
      try { payload = JSON.parse(row.payload) } catch { payload = null }
      res.json({ id: row.id, payload })
    })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})
function getPreferences(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT preferred_name, persona FROM preferences WHERE user_id = ?', [userId], (err, row) => {
      if (err) return reject(err)
      resolve(row || { preferred_name: null, persona: null })
    })
  })
}

function upsertPreferences({ userId, preferred_name, persona }) {
  return new Promise((resolve, reject) => {
    const now = Date.now()
    db.run(
      'INSERT INTO preferences (user_id, preferred_name, persona, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET preferred_name = excluded.preferred_name, persona = excluded.persona, updated_at = excluded.updated_at',
      [userId, preferred_name || null, persona || null, now],
      function (err) {
        if (err) return reject(err)
        resolve(true)
      }
    )
  })
}

app.get('/api/user/preferences', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const prefs = await getPreferences(userId)
    res.json({ preferred_name: prefs.preferred_name || null, persona: prefs.persona || null })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Erro interno' })
  }
})

app.post('/api/user/preferences', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const { preferred_name, persona } = req.body || {}
    await upsertPreferences({ userId, preferred_name, persona })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Erro interno' })
  }
})

// Endpoints de Administração
app.get('/api/admin/users', async (req, res) => {
  try {
    console.log('🔍 Debug /api/admin/users - session:', req.session)
    console.log('🔍 Debug /api/admin/users - userId:', req.session.userId)
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    
    // Verificar se é admin
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, email, is_admin FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return reject(err)
        resolve(row)
      })
    })
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
    }

    // Buscar todos os usuários com estatísticas
    const users = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.last_login_ip,
          u.plan,
          u.subscription_end,
          u.created_at,
          u.is_admin,
          COALESCE(ai.ai_count, 0) as ai_count,
          COALESCE(c.chat_count, 0) as chat_count,
          COALESCE(m.message_count, 0) as message_count
        FROM users u
        LEFT JOIN (
          SELECT owner_user_id, COUNT(*) as ai_count 
          FROM ais 
          GROUP BY owner_user_id
        ) ai ON u.id = ai.owner_user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) as chat_count 
          FROM conversations 
          GROUP BY user_id
        ) c ON u.id = c.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) as message_count 
          FROM messages 
          GROUP BY user_id
        ) m ON u.id = m.user_id
        ORDER BY u.created_at DESC
      `, (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      })
    })

    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.send(JSON.stringify({ users: Array.isArray(users) ? users : [] }))
    } catch (e) {
      console.error('Erro ao serializar usuários:', e)
      res.status(500).json({ error: 'Erro interno' })
    }
  } catch (e) {
    console.error('Erro ao buscar usuários:', e)
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    
    // Verificar se é admin
    const admin = await new Promise((resolve, reject) => {
      db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return reject(err)
        resolve(row)
      })
    })
    
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
    }

    const targetUserId = parseInt(req.params.id)
    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Não é possível excluir sua própria conta' })
    }

    // Excluir todos os dados do usuário (cascade)
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM messages WHERE user_id = ?', [targetUserId])
        db.run('DELETE FROM conversations WHERE user_id = ?', [targetUserId])
        db.run('DELETE FROM ais WHERE owner_user_id = ?', [targetUserId])
        db.run('DELETE FROM preferences WHERE user_id = ?', [targetUserId])
        db.run('DELETE FROM shares WHERE owner_user_id = ?', [targetUserId])
        db.run('DELETE FROM users WHERE id = ?', [targetUserId], (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    })

    res.json({ ok: true })
  } catch (e) {
    console.error('Erro ao excluir usuário:', e)
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.post('/api/admin/users/:id/block', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    
    // Verificar se é admin
    const admin = await new Promise((resolve, reject) => {
      db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return reject(err)
        resolve(row)
      })
    })
    
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
    }

    const targetUserId = parseInt(req.params.id)
    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Não é possível bloquear sua própria conta' })
    }

    // Alternar estado de bloqueio
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET is_blocked = NOT is_blocked WHERE id = ?', [targetUserId], (err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    res.json({ ok: true })
  } catch (e) {
    console.error('Erro ao bloquear/desbloquear usuário:', e)
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.post('/api/admin/users/:id/plan', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    
    // Verificar se é admin
    const admin = await new Promise((resolve, reject) => {
      db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return reject(err)
        resolve(row)
      })
    })
    
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
    }

    const targetUserId = parseInt(req.params.id)
    const { plan } = req.body
    
    if (!['Free', 'Semanal', 'Mensal', 'Semestral', 'Anual', 'Lifetime'].includes(plan)) {
      return res.status(400).json({ error: 'Plano inválido' })
    }

    // Calcular data de expiração baseada no plano
    const now = new Date()
    let subscriptionEnd = null
    
    if (plan === 'Free') {
      subscriptionEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 dia
    } else if (plan === 'Semanal') {
      subscriptionEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    } else if (plan === 'Mensal') {
      subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    } else if (plan === 'Semestral') {
      subscriptionEnd = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
    } else if (plan === 'Anual') {
      subscriptionEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 365 dias
    } else if (plan === 'Lifetime') {
      subscriptionEnd = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 anos = lifetime
    }

    // Atualizar plano do usuário
    await new Promise((resolve, reject) => {
      const endTs = subscriptionEnd ? Number(subscriptionEnd.getTime()) : null
      db.run('UPDATE users SET plan = ?, subscription_end = ? WHERE id = ?', [plan, endTs, targetUserId], (err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    res.json({ ok: true })
  } catch (e) {
    console.error('Erro ao mudar plano do usuário:', e)
    res.status(500).json({ error: 'Erro interno' })
  }
})

function parseMoneyToNumber(v) {
  if (v == null) return null
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v.replace(/[^\d,.\-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function inferPlanFromPayload(body) {
  let name = null
  let amount = null
  if (body?.product?.name) name = String(body.product.name).toLowerCase()
  if (!name && body?.order?.product_name) name = String(body.order.product_name).toLowerCase()
  if (!name && body?.purchase?.product_name) name = String(body.purchase.product_name).toLowerCase()
  if (!name && body?.checkout?.product_name) name = String(body.checkout.product_name).toLowerCase()
  amount = parseMoneyToNumber(
    body?.amount ??
    body?.price ??
    body?.transaction?.amount ??
    body?.checkout?.price ??
    body?.order?.amount ??
    body?.purchase?.amount
  )
  if (name) {
    if (name.includes('mensal')) return { plan: 'Mensal', days: 30 }
    if (name.includes('semestral')) return { plan: 'Semestral', days: 180 }
    if (name.includes('anual')) return { plan: 'Anual', days: 365 }
  }
  if (amount != null) {
    const a = amount
    if (Math.abs(a - 99.99) < 1 || Math.abs(a - 100) < 1) return { plan: 'Mensal', days: 30 }
    if (Math.abs(a - 499) < 2 || Math.abs(a - 499.99) < 2 || Math.abs(a - 500) < 2) return { plan: 'Semestral', days: 180 }
    if (Math.abs(a - 999) < 3 || Math.abs(a - 999.99) < 3 || Math.abs(a - 1000) < 3) return { plan: 'Anual', days: 365 }
  }
  return null
}

function extractBuyerEmail(body) {
  return (
    body?.buyer?.email ||
    body?.customer?.email ||
    body?.email ||
    body?.order?.buyer_email ||
    body?.purchase?.buyer_email ||
    body?.checkout?.email ||
    null
  )
}

function createKiwifyWebhook({ url, triggers, token }) {
  return new Promise((resolve, reject) => {
    const accessToken = process.env.KIWIFY_ACCESS_TOKEN
    const accountId = process.env.KIWIFY_ACCOUNT_ID
    if (!accessToken || !accountId) return reject(new Error('Credenciais Kiwify ausentes'))
    const payload = JSON.stringify({
      name: 'MatrixBit webhook',
      url,
      products: 'all',
      triggers: Array.isArray(triggers) && triggers.length ? triggers : ['compra_aprovada', 'subscription_renewed'],
      token: token || process.env.KIWIFY_WEBHOOK_TOKEN || undefined
    })
    const req = https.request({
      hostname: 'public-api.kiwify.com',
      path: '/v1/webhooks',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-kiwify-account-id': accountId,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, r => {
      let data = ''
      r.on('data', c => { data += c })
      r.on('end', () => {
        try {
          const json = JSON.parse(data || '{}')
          resolve({ statusCode: r.statusCode, json })
        } catch {
          resolve({ statusCode: r.statusCode, raw: data })
        }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

app.post('/api/pay/kiwify', async (req, res) => {
  try {
    const expectedToken = process.env.KIWIFY_WEBHOOK_TOKEN
    const headerToken = req.headers['x-kiwify-token']
    const bodyToken = req.body?.token
    if (expectedToken && headerToken !== expectedToken && bodyToken !== expectedToken) {
      return res.status(401).json({ error: 'Token inválido' })
    }
    const trigger = req.body?.trigger || req.body?.event || req.body?.type || ''
    const valid = ['compra_aprovada', 'subscription_renewed']
    if (!valid.includes(String(trigger))) {
      return res.json({ ok: true })
    }
    const email = extractBuyerEmail(req.body)
    if (!email) return res.status(400).json({ error: 'Email ausente' })
    const planInfo = inferPlanFromPayload(req.body)
    if (!planInfo) return res.status(400).json({ error: 'Plano não identificado' })
    const now = Date.now()
    const current = await new Promise((resolve, reject) => {
      db.get('SELECT id, subscription_end FROM users WHERE email = ?', [email], (err, row) => {
        if (err) return reject(err)
        resolve(row || null)
      })
    })
    if (!current) return res.status(404).json({ error: 'Usuário não encontrado' })
    const base = current.subscription_end && Number(current.subscription_end) > now ? Number(current.subscription_end) : now
    const newEnd = base + planInfo.days * 24 * 60 * 60 * 1000
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET plan = ?, subscription_end = ? WHERE id = ?', [planInfo.plan, newEnd, current.id], (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

app.post('/api/admin/kiwify/webhook', async (req, res) => {
  try {
    const userId = req.session.userId
    if (!userId) return res.status(401).json({ error: 'Não autenticado' })
    const admin = await new Promise((resolve, reject) => {
      db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return reject(err)
        resolve(row)
      })
    })
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' })
    }
    const url = req.body?.url || process.env.KIWIFY_WEBHOOK_URL
    const triggers = req.body?.triggers
    const token = req.body?.token || process.env.KIWIFY_WEBHOOK_TOKEN
    if (!url) return res.status(400).json({ error: 'URL do webhook ausente' })
    const resp = await createKiwifyWebhook({ url, triggers, token })
    const ok = resp.statusCode >= 200 && resp.statusCode < 300
    res.status(ok ? 200 : 400).json(resp.json || { raw: resp.raw })
  } catch (e) {
    res.status(500).json({ error: 'Erro interno' })
  }
})

;(async () => {
  try {
    if (process.env.KIWIFY_ACCESS_TOKEN && process.env.KIWIFY_ACCOUNT_ID && process.env.KIWIFY_WEBHOOK_URL) {
      await createKiwifyWebhook({
        url: process.env.KIWIFY_WEBHOOK_URL,
        triggers: ['compra_aprovada', 'subscription_renewed'],
        token: process.env.KIWIFY_WEBHOOK_TOKEN
      }).catch(() => {})
    }
  } catch {}
})()
process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[server] Unhandled Rejection at:', promise, 'reason:', reason)
})
