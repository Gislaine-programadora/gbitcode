const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// CONFIGURAÇÃO DO BANCO DE DADOS (Pega automaticamente da Railway)
const db = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'gbitcode',
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10
});

// Criar tabela se não existir (Rodar na primeira vez)
const setupQuery = `
  CREATE TABLE IF NOT EXISTS repos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    public TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

db.query(setupQuery, (err) => {
  if (err) console.error("Erro ao criar tabela:", err);
  else console.log("Tabela 'repos' pronta para uso no MySQL!");
});

// ROTA DE BUSCA GLOBAL (Aquela que pediste antes!)
app.get('/api/search', (req, res) => {
  const searchTerm = req.query.q;
  if (!searchTerm) return res.json([]);

  const query = "SELECT * FROM repos WHERE name LIKE ? AND public = 1 LIMIT 10";
  db.query(query, [`%${searchTerm}%`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ROTA PARA LISTAR REPOSITÓRIOS
app.get('/api/repos/:email', (req, res) => {
  const query = "SELECT * FROM repos WHERE owner_email = ?";
  db.query(query, [req.params.email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// CONFIGURAÇÃO PARA PRODUÇÃO (RAILWAY) E LOCAL
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
  ssl: {
    rejectUnauthorized: false // Necessário para conexões seguras na nuvem
  },
  waitForConnections: true,
  connectionLimit: 10
});

const PORT = process.env.PORT || 3001;

// Adicionamos "0.0.0.0" para o servidor aceitar conexões externas na nuvem
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Gbitcode Backend rodando na porta ${PORT}`);
});