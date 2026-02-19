#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const open = require('open');

const program = new Command();
const API_URL = "http://localhost:3001/api";

// Banner de Boas-vindas
const welcomeBanner = () => {
  console.log(chalk.cyan(`
  ____  ____ ___ _____ ____ ___  ____  _____ 
 / ___|| __ )_ _|_   _/ ___/ _ \\|  _ \\| ____|
| |  _ |  _ \\| |  | || |  | | | | | | |  _|  
| |_| || |_) | |  | || |__| |_| | |_| | |___ 
 \\____||____/___| |_| \\____\\___/|____/|_____|
    `));
  console.log(chalk.gray('--- Sistema de Versionamento DNA Code ---\n'));
};

// --- FUNÇÃO AUXILIAR RECURSIVA ---
async function getAllFiles(dirPath, arrayOfFiles = [], baseDir = dirPath) {
  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative(baseDir, fullPath);

    // Ignora pastas pesadas e arquivos de configuração sensíveis
    if (file === 'node_modules' || file === '.git' || file === '.next' || file.startsWith('.')) continue;

    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles, baseDir);
    } else {
      const content = await fs.readFile(fullPath, 'utf-8');
      arrayOfFiles.push({ 
        name: relativePath.replace(/\\/g, '/'), 
        content 
      });
    }
  }
  return arrayOfFiles;
}

program
  .name('gbitcode')
  .description('CLI para gerenciar seus repositórios no Gbitcode')
  .version('1.0.0');

// COMANDO: INIT
program
  .command('init')
  .description('Inicializa um novo repositório Gbitcode')
  .action(async () => {
    welcomeBanner();
    const repoName = path.basename(process.cwd());
    
    const config = { 
        id: Date.now().toString(), 
        name: repoName, 
        version: "1.0.0",
        author: "Dev Gbit"
    };

    await fs.writeJson('gbitcode.json', config, { spaces: 2 });
    await fs.writeFile('.gbitignore', 'node_modules\n.env\n.git\n.next');
    
    console.log(chalk.green(`✅ Repositório '${repoName}' inicializado!`));
    console.log(chalk.gray('📝 Arquivos gbitcode.json e .gbitignore criados.'));
  });

// COMANDO: COMMIT (RECURSIVO)
program
  .command('commit <message>')
  .description('Envia o projeto INTEIRO para o servidor')
  .action(async (message) => {
    try {
      const configPath = path.join(process.cwd(), 'gbitcode.json');
      
      if (!(await fs.pathExists(configPath))) {
        return console.log(chalk.red("❌ Erro: Execute 'gbitcode init' primeiro."));
      }
      
      const config = await fs.readJson(configPath);
      console.log(chalk.blue(`🧬 Mapeando DNA de: ${config.name}...`));

      const allFiles = await getAllFiles(process.cwd());

      if (allFiles.length === 0) {
        return console.log(chalk.yellow('⚠️ Nenhum arquivo encontrado para commit.'));
      }

      console.log(chalk.yellow(`🚀 Enviando ${allFiles.length} arquivos para a nuvem...`));

      const response = await axios.post(`${API_URL}/commit`, {
        email: "dev-teste@gbitcode.com",
        repoName: config.name,
        message: message,
        files: allFiles
      });

      console.log(chalk.green(`\n✅ SUCESSO! Código guardado com segurança.`));
      console.log(chalk.cyan(`🔗 Dashboard: http://localhost:3000/repository/${config.name}`));

    } catch (error) {
      console.error(chalk.red('\n❌ Erro ao realizar commit:'));
      console.log(chalk.gray(error.message));
    }
  });

// COMANDO: CLONE
program
  .command('clone <repoName>')
  .description('Clona um repositório para sua máquina')
  .action(async (repoName) => {
    try {
      const ownerEmail = "dev-teste@gbitcode.com";
      console.log(chalk.blue(`🧬 Baixando sequência de DNA: ${repoName}...`));

      const response = await axios.get(`${API_URL}/repos/${ownerEmail}/${repoName}/clone`);
      const files = response.data;

      if (!files || files.length === 0) {
        return console.log(chalk.yellow('⚠️ Repositório não encontrado ou vazio.'));
      }

      const targetDir = path.join(process.cwd(), repoName);
      await fs.ensureDir(targetDir);

      for (const file of files) {
        const filePath = path.join(targetDir, file.name);
        await fs.ensureDir(path.dirname(filePath)); // Cria subpastas se necessário
        await fs.writeFile(filePath, file.content);
        console.log(chalk.gray(`  └─ Criando: ${file.name}`));
      }

      console.log(chalk.green(`\n✅ Sucesso! Repositório '${repoName}' clonado.`));
    } catch (error) {
      console.error(chalk.red('❌ Erro ao clonar:'), error.message);
    }
  });

// COMANDO: STATUS
program
  .command('status')
  .description('Verifica itens na pasta')
  .action(async () => {
    const files = await fs.readdir(process.cwd());
    console.log(chalk.green(`🔍 Pasta analisada. ${files.length} itens detectados.`));
  });

program.parse(process.argv);