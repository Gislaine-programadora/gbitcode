const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const archiver = require('archiver');

const app = express();
app.use(express.json());
const upload = multer({ dest: 'temp/' });

let db;

// --- INICIALIZAÇÃO DO CÉREBRO (SQLite) ---
(async () => {
    db = await open({
        filename: './gbitcode.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, email TEXT, picture TEXT);
        CREATE TABLE IF NOT EXISTS repos (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, owner_id TEXT, last_commit_msg TEXT, last_hash TEXT, path TEXT);
        CREATE TABLE IF NOT EXISTS commits (id INTEGER PRIMARY KEY AUTOINCREMENT, repo_id INTEGER, hash TEXT, message TEXT, date DATETIME);
    `);
    console.log('📦 Gbitcode Database: ONLINE');
})();

// ROTA: COMMIT (Versão com Debug)
app.post('/api/commit', (req, res) => {
    upload.array('files')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.log(chalk.red('❌ Erro do Multer:'), err.message);
            return res.status(400).json({ success: false, error: err.message });
        } else if (err) {
            console.log(chalk.red('❌ Erro desconhecido no upload:'), err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        try {
            const { repoName, ownerEmail, message, hash } = req.body;

            // Verificação de segurança
            if (!req.files || req.files.length === 0) {
                console.log(chalk.yellow('⚠️ Tentativa de commit sem arquivos.'));
                return res.status(400).json({ success: false, error: "Nenhum arquivo enviado." });
            }

            console.log(chalk.green(`📥 Recebidos ${req.files.length} arquivos para [${repoName}]`));

            // Lógica do Banco de Dados
            const repo = await db.get('SELECT id FROM repos WHERE name = ? AND owner_id = ?', [repoName, ownerEmail]);
            const now = new Date().toISOString();

            if (repo) {
                await db.run('UPDATE repos SET last_hash=?, last_message=?, updated_at=? WHERE id=?', 
                    [hash, message, now, repo.id]);
            } else {
                await db.run('INSERT INTO repos (name, owner_id, last_hash, last_message, updated_at) VALUES (?,?,?,?,?)',
                    [repoName, ownerEmail, hash, message, now]);
            }

            res.json({ success: true, hash, url: `http://localhost:3000/dashboard/${ownerEmail}/${repoName}` });

        } catch (dbError) {
            console.error(chalk.red('💥 Erro no Banco:'), dbError.message);
            res.status(500).json({ success: false, error: "Erro ao salvar no banco." });
        }
    });
});

// --- ROTA 2: CLONE (Enviar ZIP para a CLI) ---
app.get('/api/clone/:owner/:repoName', async (req, res) => {
    const { owner, repoName } = req.params;
    const repo = await db.get('SELECT path FROM repos WHERE name = ? AND owner_id = ?', [repoName, owner]);

    if (!repo) return res.status(404).json({ error: 'Repo não encontrado' });

    res.attachment(`${repoName}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    archive.directory(repo.path, false);
    await archive.finalize();
});

// --- ROTA 3: DASHBOARD (Listar Arquivos e renderizar .gbit) ---
app.get('/api/repos/:owner/:repoName/view', async (req, res) => {
    const { owner, repoName } = req.params;
    const projectPath = path.join(__dirname, 'storage', owner, repoName);

    if (!fs.existsSync(projectPath)) return res.status(404).send('Pasta não encontrada');

    const files = await fs.readdir(projectPath);
    let gbitContent = "";

    if (files.includes('README.gbit')) {
        gbitContent = await fs.readFile(path.join(projectPath, 'README.gbit'), 'utf-8');
    }

    res.json({ files, gbitContent });
});

app.listen(3000, () => console.log('🚀 Gbitcode Server rodando em http://localhost:3000'));