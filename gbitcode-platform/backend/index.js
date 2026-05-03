const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');

const app = express();
app.use(express.json());

const upload = multer({ dest: 'temp/' });

// --- COMMIT ---
app.post('/api/commit', (req, res) => {
    upload.array('files')(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        const { repoName, ownerEmail, message, hash } = req.body;

        console.log(`📥 Commit recebido: ${repoName} de ${ownerEmail}`);

        res.json({
            success: true,
            hash,
            url: `https://gbitcode.vercel.app/repository/${repoName}`
        });
    });
});

// --- CLONE ---
app.get('/api/clone/:owner/:repoName', async (req, res) => {
    const { repoName } = req.params;

    res.json({
        message: "Clone endpoint ativo",
        repo: repoName
    });
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