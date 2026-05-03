const express = require('express');

const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');

const app = express();
app.use(express.json());



// --- COMMIT ---
app.post('/api/commit', async (req, res) => {
  const { email, repoName, files } = req.body;

  if (!email || !repoName || !files) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    let repo = await client.query(
      "SELECT id FROM repos WHERE name = $1 AND owner_email = $2",
      [repoName, email]
    );

    let repoId;

    if (repo.rows.length === 0) {
      const newRepo = await client.query(
        "INSERT INTO repos (name, owner_email) VALUES ($1, $2) RETURNING id",
        [repoName, email]
      );
      repoId = newRepo.rows[0].id;
    } else {
      repoId = repo.rows[0].id;
    }

    // 🔥 otimização: bulk insert
    const values = files.map(f =>
      `(${repoId}, '${f.name.replace(/'/g, "''")}', '${f.content.replace(/'/g, "''")}')`
    ).join(',');

    await client.query(
      `INSERT INTO repo_files (repo_id, name, content) VALUES ${values}`
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Commit realizado!",
      repoId
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
// --- CLONE ---
app.get('/api/clone/:owner/:repoName', async (req, res) => {
    const { owner, repoName } = req.params;

    const projectPath = path.join(__dirname, 'storage', owner, repoName);

    if (!fs.existsSync(projectPath)) {
        return res.status(404).json({ error: 'Repo não encontrado' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${repoName}.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(res);
    archive.directory(projectPath, false);

    await archive.finalize();
});

// --- VIEW ---
app.get('/api/repos/:owner/:repoName/view', async (req, res) => {
    res.json({
        files: [],
        gbitContent: "backend funcionando"
    });
});

// --- HEALTH ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Server rodando na porta', PORT));