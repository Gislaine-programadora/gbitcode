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
  ssl: { rejectUnauthorized: false },
  // --- ADICIONE ESTAS LINHAS ABAIXO ---
  waitForConnections: true,
  connectionLimit: 20, // Aumentamos de 10 para 20
  queueLimit: 0,
  connectTimeout: 60000, // Dá 1 minuto para o banco responder
  acquireTimeout: 60000
});

// 2. CRIAÇÃO DAS TABELAS EM ORDEM CORRETA
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

// Executa a primeira, e dentro do sucesso dela, executa a segunda
db.query(setupQuery, (err) => {
  if (err) {
    console.error("❌ Erro ao criar tabela repos:", err);
  } else {
    console.log("✅ Tabela 'repos' verificada!");
    
    // Agora sim, cria a de arquivos
    db.query(fileTableQuery, (err) => {
      if (err) console.error("❌ Erro ao criar tabela repo_files:", err);
      else console.log("✅ Tabela 'repo_files' verificada!");
    });
  }
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
  // Prepara os dados para inserir todos os arquivos de uma vez
  const values = files.map(f => [repoId, f.name, f.content]);
  
  const query = "INSERT INTO repo_files (repo_id, name, content) VALUES ?";
  
  db.query(query, [values], (err) => {
    if (err) {
      console.error("Erro ao salvar arquivos no banco:", err);
      return res.status(500).json({ error: "Falha ao guardar arquivos" });
    }
    console.log(`📦 DNA Armazenado: ${files.length} arquivos salvos para o repo ${repoId}`);
    res.json({ message: "✅ Commit realizado com sucesso!", repoId });
  });
}

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