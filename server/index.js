import express from 'express'
const app = express()
const PORT = process.env.PORT || 3001

// Middleware de log
app.use((req, res, next) => {
  console.log([${new Date().toISOString()}] ${req.method} ${req.url})
  next()
})

// Rotas de teste
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    port: PORT,
    env: process.env.NODE_ENV,
    timestamp: new Date()
  })
})

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    port: PORT,
    timestamp: new Date()
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log([server] Test server running on port ${PORT})
})
