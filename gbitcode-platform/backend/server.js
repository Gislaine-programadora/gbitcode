const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// ✅ Conexão PostgreSQL
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ Criar tabelas automaticamente
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS repos (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_email VARCHAR(255) NOT NULL,
        public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS repo_files (
        id SERIAL PRIMARY KEY,
        repo_id INT REFERENCES repos(id) ON DELETE CASCADE,
        name VARCHAR(255),
        content TEXT
      )
    `);

    console.log("✅ Tabelas prontas!");
  } catch (err) {
    console.error("❌ Erro ao criar tabelas:", err);
  }
})();

// 📂 Listar arquivos
app.get('/api/repos/:email/:repoName/files', async (req, res) => {
  const { repoName } = req.params;

  try {
    const result = await db.query(`
      SELECT rf.name
      FROM repo_files rf
      JOIN repos r ON rf.repo_id = r.id
      WHERE r.name = $1
    `, [repoName]);

    res.json(result.rows.map(f => f.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📄 Ler arquivo
app.get('/api/repos/:email/:repoName/file/:fileName(*)', async (req, res) => {
  const { repoName, fileName } = req.params;

  try {
    const result = await db.query(`
      SELECT rf.content
      FROM repo_files rf
      JOIN repos r ON rf.repo_id = r.id
      WHERE r.name = $1 AND rf.name = $2
    `, [repoName, fileName]);

    if (result.rows.length === 0) {
      return res.status(404).send("Arquivo não encontrado");
    }

    res.send(result.rows[0].content);
  } catch (err) {
    res.status(500).send("Erro ao buscar conteúdo");
  }
});

// 📦 Listar repositórios
app.get('/api/repos/:email', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM repos WHERE owner_email = $1",
      [req.params.email]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Commit
app.post('/api/commit', async (req, res) => {
  const { email, repoName, files } = req.body;

  if (!email || !repoName || !files) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  try {
    let repo = await db.query(
      "SELECT id FROM repos WHERE name = $1 AND owner_email = $2",
      [repoName, email]
    );

    let repoId;

    if (repo.rows.length === 0) {
      const newRepo = await db.query(
        "INSERT INTO repos (name, owner_email) VALUES ($1, $2) RETURNING id",
        [repoName, email]
      );
      repoId = newRepo.rows[0].id;
    } else {
      repoId = repo.rows[0].id;
    }

    // inserir arquivos
    for (const file of files) {
      await db.query(
        "INSERT INTO repo_files (repo_id, name, content) VALUES ($1, $2, $3)",
        [repoId, file.name, file.content]
      );
    }

    console.log(`📦 ${files.length} arquivos salvos`);
    res.json({ message: "✅ Commit realizado!", repoId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no commit" });
  }
});

// 📥 Clone
app.get('/api/repos/:email/:repoName/clone', async (req, res) => {
  const { repoName } = req.params;

  try {
    const result = await db.query(`
      SELECT rf.name, rf.content
      FROM repo_files rf
      JOIN repos r ON rf.repo_id = r.id
      WHERE r.name = $1
    `, [repoName]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 Buscar repos
app.get('/api/search', async (req, res) => {
  const query = req.query.q;

  try {
    const result = await db.query(
      "SELECT * FROM repos WHERE name ILIKE $1",
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 🌐 Status
app.get('/', (req, res) => {
  res.send('🚀 Gbitcode API está online!');
});

// 🚀 Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});