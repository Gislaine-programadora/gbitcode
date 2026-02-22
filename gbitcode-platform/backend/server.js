const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

require('dotenv').config(); // Adicione isso na primeira linha!

// ... resto do código

// 1. PRIMEIRO: DEFINIMOS A CONEXÃO (CONFIGURAÇÃO PARA RAILWAY E LOCAL)
// Isso precisa vir antes de qualquer db.query
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

// 2. DEPOIS: CRIAMOS A TABELA (OPCIONAL, MAS BOM PARA O PRIMEIRO ACESSO)
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
  else console.log("✅ Tabela 'repos' verificada/criada com sucesso!");
});

// 3. ROTAS DO SISTEMA
// ROTA DE BUSCA GLOBAL
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

// --- NOVA ROTA: RECEBER O COMMIT DO CLI ---
app.post('/api/commit', (req, res) => {
  const { email, repoName, message, files } = req.body;

  if (!email || !repoName || !files) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  // Primeiro, verifica se o repo já existe ou cria um novo na tabela 'repos'
  const checkRepo = "SELECT id FROM repos WHERE name = ? AND owner_email = ?";
  db.query(checkRepo, [repoName, email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      const insertRepo = "INSERT INTO repos (name, owner_email) VALUES (?, ?)";
      db.query(insertRepo, [repoName, email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        saveFiles(result.insertId);
      });
    } else {
      saveFiles(results[0].id);
    }
  });

  // Função interna para salvar os arquivos (Simulação por enquanto, ou salvar no BD)
  function saveFiles(repoId) {
    // Aqui você salvaria o conteúdo dos arquivos no seu banco de dados
    console.log(`📦 Recebidos ${files.length} arquivos para o repo ID: ${repoId}`);
    res.json({ message: "✅ Commit realizado com sucesso!", repoId });
  }
});

// --- NOVA ROTA: ENVIAR ARQUIVOS PARA O CLONE ---
app.get('/api/repos/:email/:repoName/clone', (req, res) => {
  const { email, repoName } = req.params;
  
  // Por enquanto, como estamos testando a estrutura:
  // Aqui você buscaria os arquivos no banco de dados.
  // Vou retornar um exemplo vazio para não dar erro no CLI
  res.json([]); 
});

// 4. FINALMENTE: LIGAMOS O SERVIDOR
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('🚀 Gbitcode API está online e conectada ao MySQL!');
});

// Usamos "0.0.0.0" para que a Railway consiga acessar o serviço externamente
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Gbitcode Backend rodando na porta ${PORT}`);
});