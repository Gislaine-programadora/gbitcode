const express = require('express');

const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');

const app = express();
app.use(express.json());



// --- COMMIT ---
app.post('/api/commit', (req, res) => {
    try {
        const { repoName, ownerEmail, message, hash, files } = req.body;

        console.log(`📥 Commit recebido: ${repoName} de ${ownerEmail}`);
        console.log(`📦 Arquivos: ${files?.length || 0}`);

        return res.json({
            success: true,
            hash: hash || Date.now().toString(),
            url: `https://gbitcode.vercel.app/repository/${repoName}`
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
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