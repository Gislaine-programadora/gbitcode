const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const chalk = require('chalk');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());

// Aumentando o limite para suportar projetos maiores (50mb é uma margem segura)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração do Armazenamento (Storage)
const STORAGE_PATH = path.join(__dirname, 'storage');
fs.ensureDirSync(STORAGE_PATH);



// 2. Inicialização do Banco de Dados SQLite
let db;
(async () => {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS repos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            owner_id TEXT,
            last_hash TEXT,
            last_message TEXT,
            updated_at DATETIME
        );
    `);
    console.log(chalk.green('✅ Banco de dados SQLite pronto.'));
})();
    
      // ROTA COMMIT TURBO - Blindada contra erros 413 e de Banco
     // 3. ROTA PRINCIPAL: COMMIT
// Verifique se a linha abaixo tem o "async" antes de (req, res)
app.post('/api/commit', async (req, res) => { 
    try {
        const { repoName, email, message, files } = req.body;
        const ownerEmail = email || "dev-teste@gbitcode.com";
        const hash = `gb_${Math.random().toString(36).substring(2, 9)}`;

        console.log(`🧬 Recebendo commit: ${repoName} (${files.length} arquivos)`);

        // 1. Definição do Caminho e Gravação dos Arquivos
        const repoPath = path.join(STORAGE_PATH, ownerEmail, repoName);
        await fs.ensureDir(repoPath);

        for (const file of files) {
            const filePath = path.join(repoPath, file.name);
            await fs.ensureDir(path.dirname(filePath)); // Cria subpastas
            await fs.writeFile(filePath, file.content);
        }

        // 2. BANCO DE DADOS (Aqui estava o erro!)
        // O "await" só funciona porque esta função começa com "async" lá no topo
        const repo = await db.get('SELECT id FROM repos WHERE name = ? AND owner_id = ?', [repoName, ownerEmail]);
        
        const now = new Date().toISOString();

        if (repo) {
            await db.run(
                'UPDATE repos SET last_hash = ?, last_message = ?, updated_at = ? WHERE id = ?',
                [hash, message, now, repo.id]
            );
        } else {
            await db.run(
                'INSERT INTO repos (name, owner_id, last_hash, last_message, updated_at) VALUES (?, ?, ?, ?, ?)',
                [repoName, ownerEmail, hash, message, now]
            );
        }

        res.json({
            success: true,
            message: "DNA Sincronizado!",
            hash: hash,
            url: `http://localhost:3000/repository/${repoName}`
        });

    } catch (error) {
        console.error('❌ Erro no commit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ROTA: REMOVER PROJETO (Para limpeza ou exclusão)
app.delete('/api/repos/:email/:repoName', async (req, res) => {
    try {
        const { email, repoName } = req.params;
        const ownerEmail = email || "dev-teste@gbitcode.com";
        const repoPath = path.join(STORAGE_PATH, ownerEmail, repoName);

        console.log(chalk.yellow(`🗑️ Solicitada exclusão do projeto: ${repoName}`));

        // 1. Remove do Banco de Dados
        await db.run('DELETE FROM repos WHERE name = ? AND owner_id = ?', [repoName, ownerEmail]);

        // 2. Remove a Pasta Física (se ela existir)
        if (await fs.pathExists(repoPath)) {
            await fs.remove(repoPath); // O fs-extra remove a pasta e tudo dentro dela
            console.log(chalk.gray(`📂 Pasta física removida: ${repoPath}`));
        }

        res.json({ success: true, message: `Projeto ${repoName} removido com sucesso!` });

    } catch (error) {
        console.error(chalk.red('❌ Erro ao remover projeto:'), error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- FUNÇÃO AUXILIAR RECURSIVA (Coloque antes das rotas) ---
async function getRecursiveFiles(dirPath, baseDir = dirPath) {
  let results = [];
  const list = await fs.readdir(dirPath);
  
  for (const file of list) {
    const fullPath = path.join(dirPath, file);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      // Ignora pastas que não queremos listar
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        results = results.concat(await getRecursiveFiles(fullPath, baseDir));
      }
    } else {
      // Pega o caminho relativo (ex: telegram-bot/main.js) e normaliza a barra
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return results;
}

// 1. ROTA: LISTAR NOMES DOS ARQUIVOS (A que faz o Dashboard mostrar os 61 itens)
app.get('/api/repos/:email/:repoName/files', async (req, res) => {
  try {
    const { email, repoName } = req.params;
    const repoPath = path.join(STORAGE_PATH, email, repoName);

    if (!(await fs.pathExists(repoPath))) {
      return res.status(404).json({ error: 'Repositório não encontrado no disco' });
    }

    // Chama a função recursiva para pegar TUDO
    const fileList = await getRecursiveFiles(repoPath);
    console.log(`🔍 Enviando lista de ${fileList.length} arquivos para o Dashboard.`);
    
    res.json(fileList);
  } catch (error) {
    console.error("Erro ao listar:", error);
    res.status(500).json({ error: 'Erro interno ao listar arquivos' });
  }
});

// ROTA DE BUSCA GLOBAL
app.get('/api/search', (req, res) => {
  const searchTerm = req.query.q;
  
  if (!searchTerm) {
    return res.json([]);
  }

  // Procura projetos onde o nome contenha o que foi digitado
  const query = `SELECT * FROM repos WHERE name LIKE ? AND public = 1 LIMIT 10`;
  db.all(query, [`%${searchTerm}%`], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Erro na busca" });
    }
    res.json(rows);
  });
});

// 2. ROTA: LISTAR REPOS (Para os cards da Home)
app.get('/api/repos/:ownerEmail', async (req, res) => {
    const repos = await db.all('SELECT * FROM repos WHERE owner_id = ?', [req.params.ownerEmail]);
    res.json(repos);
});

// 3. ROTA: LER CONTEÚDO (Para mostrar o código no Syntax Highlighter)
// Note o uso do [0...]* para aceitar caminhos com pastas (ex: pasta/arquivo.js)
app.get('/api/repos/:email/:repoName/file/:fileName(*)', async (req, res) => {
  try {
    const { email, repoName, fileName } = req.params;
    const filePath = path.join(STORAGE_PATH, email, repoName, fileName);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).send("Arquivo não encontrado.");
    }

    const content = await fs.readFile(filePath, 'utf-8');
    res.send(content);
  } catch (error) {
    res.status(500).send("Erro ao ler conteúdo do arquivo.");
  }
});

// 4. ROTA: CLONE (Para o comando gbitcode clone baixar tudo)
app.get('/api/repos/:email/:repoName/clone', async (req, res) => {
  try {
    const { email, repoName } = req.params;
    const repoPath = path.join(STORAGE_PATH, email, repoName);

    if (!(await fs.pathExists(repoPath))) {
      return res.status(404).json({ error: 'Repositório não encontrado.' });
    }

    const allFiles = await getRecursiveFiles(repoPath);
    const repoData = [];

    for (const fileName of allFiles) {
      const filePath = path.join(repoPath, fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      repoData.push({ name: fileName, content });
    }

    res.json(repoData);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao clonar repositório.' });
  }
});

app.listen(PORT, () => {
    console.log(chalk.cyan(`
   🚀 GBITCODE SERVER RODANDO
   📡 Endpoint: http://localhost:${PORT}/api
   📂 Storage: ${STORAGE_PATH}
    `));
});