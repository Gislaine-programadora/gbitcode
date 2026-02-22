const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuração de Segurança e Limites de Dados
app.use(cors());
app.use(express.json({ limit: '100mb' })); 
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// 1. CONEXÃO COM O BANCO DE DADOS (RAILWAY)
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 60000,
  acquireTimeout: 60000
});

// 2. CRIAÇÃO DAS TABELAS (ORDEM CORRETA)
const setupQuery = `
  CREATE TABLE IF NOT EXISTS repos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    public TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const fileTableQuery = `
  CREATE TABLE IF NOT EXISTS repo_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repo_id INT,
    name VARCHAR(255),
    content LONGTEXT,
    FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE
  )
`;

db.query(setupQuery, (err) => {
  if (err) console.error("❌ Erro ao criar tabela repos:", err);
  else {
    console.log("✅ Tabela 'repos' verificada!");
    db.query(fileTableQuery, (err) => {
      if (err) console.error("❌ Erro ao criar tabela repo_files:", err);
      else console.log("✅ Tabela 'repo_files' verificada!");
    });
  }
});

// ROTA: LISTAR APENAS OS NOMES DOS ARQUIVOS (Para o Explorer da lateral esquerda)
app.get('/api/repos/:email/:repoName/files', (req, res) => {
  const { repoName } = req.params;
  
  // Busca apenas os nomes dos arquivos vinculados a esse repositório
  const query = `
    SELECT rf.name 
    FROM repo_files rf
    JOIN repos r ON rf.repo_id = r.id
    WHERE r.name = ?
  `;
  
  db.query(query, [repoName], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Transformamos o resultado em um array simples de strings: ["pasta/file.js", "index.js"]
    const fileList = results.map(file => file.name);
    res.json(fileList);
  });
});

// ROTA: LER O CONTEÚDO DE UM ARQUIVO ESPECÍFICO
app.get('/api/repos/:email/:repoName/file/:fileName(*)', (req, res) => {
  const { repoName, fileName } = req.params;

  const query = `
    SELECT rf.content 
    FROM repo_files rf
    JOIN repos r ON rf.repo_id = r.id
    WHERE r.name = ? AND rf.name = ?
  `;

  db.query(query, [repoName, fileName], (err, results) => {
    if (err) return res.status(500).send("Erro ao buscar conteúdo");
    if (results.length === 0) return res.status(404).send("Arquivo não encontrado");

    // Retorna apenas o texto do código
    res.send(results[0].content);
  });
});

// 3. ROTAS DA API

// Listar Repositórios do Usuário
app.get('/api/repos/:email', (req, res) => {
  const query = "SELECT * FROM repos WHERE owner_email = ?";
  db.query(query, [req.params.email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// RECEBER O COMMIT DO CLI
app.post('/api/commit', (req, res) => {
  const { email, repoName, message, files } = req.body;

  if (!email || !repoName || !files) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  const checkRepo = "SELECT id FROM repos WHERE name = ? AND owner_email = ?";
  db.query(checkRepo, [repoName, email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      const insertRepo = "INSERT INTO repos (name, owner_email) VALUES (?, ?)";
      db.query(insertRepo, [repoName, email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        saveFiles(result.insertId, files, res);
      });
    } else {
      saveFiles(results[0].id, files, res);
    }
  });
});

// Função para gravar os arquivos no banco
function saveFiles(repoId, files, res) {
  const values = files.map(f => [repoId, f.name, f.content]);
  const query = "INSERT INTO repo_files (repo_id, name, content) VALUES ?";
  
  db.query(query, [values], (err) => {
    if (err) {
      console.error("❌ Erro ao salvar arquivos:", err);
      return res.status(500).json({ error: "Falha ao gravar DNA no banco" });
    }
    console.log(`📦 DNA Armazenado: ${files.length} arquivos salvos.`);
    res.json({ message: "✅ Commit realizado com sucesso!", repoId });
  });
}

// ROTA PARA O CLONE (Recuperar arquivos)
app.get('/api/repos/:email/:repoName/clone', (req, res) => {
  const { repoName } = req.params;
  const query = `
    SELECT rf.name, rf.content 
    FROM repo_files rf
    JOIN repos r ON rf.repo_id = r.id
    WHERE r.name = ?
  `;
  
  db.query(query, [repoName], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/search', (req, res) => {
  const query = req.query.q;
  // Busca em todos os repositórios, idependente do dono
  const sql = "SELECT * FROM repos WHERE name LIKE ?";
  db.query(sql, [`%${query}%`], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Status do Servidor
app.get('/', (req, res) => {
  res.send('🚀 Gbitcode API está online!');
});

// Ligar Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});