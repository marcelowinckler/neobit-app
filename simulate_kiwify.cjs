const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('server/db.sqlite');

const payload = {
  event: 'compra_aprovada',
  email: 'test500@example.com',
  product: {
    name: 'NeoBit Semestral' 
  },
  amount: 499.00,
  token: 'thwibpsn4lk'
};

async function run() {
  try {
    console.log('Enviando webhook simulado para localhost:3001...');
    const res = await fetch('http://localhost:3001/api/pay/kiwify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Resposta do servidor:', data);
    
    // Check DB
    db.get('SELECT email, plan, subscription_end FROM users WHERE email = ?', ['test500@example.com'], (err, row) => {
      if (err) console.error(err);
      console.log('Usuário no DB:', row);
      
      if (row && row.plan === 'Semestral') {
        console.log('SUCESSO: Plano atualizado para Semestral!');
      } else {
        console.log('FALHA: Plano não atualizado.');
      }
    });
  } catch (e) {
    console.error('Erro:', e.message);
  }
}

run();
