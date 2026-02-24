#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const open = require('open');
const os = require('os');
const cliProgress = require('cli-progress');

const program = new Command();

// --- ORDEM CORRETA DE INICIALIZAÇÃO ---
const homedir = os.homedir(); // 2º Cria a variável homedir primeiro
const CONFIG_PATH = path.join(homedir, '.gbitcode_config'); // 3º Agora usa ela aqui!
const API_URL = "https://gbitcode-production.up.railway.app/api";

// Banner de Boas-vindas
const welcomeBanner = () => {
  console.log(chalk.cyan(`
  ____  ____ ___ _____ ____ ___  ____  _____ 
 / ___|| __ )_ _|_   _/ ___/ _ \\|  _ \\| ____|
| |  _ |  _ \\| |  | || |  | | | | | | |  _|  
| |_| || |_) | |  | || |__| |_| | |_| | |___ 
 \\____||____/___| |_| \\____\\___/|____/|_____|
    `));
  console.log(chalk.gray('--- Sistema de Versionamento GbitCode ---\n'));
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

 // --- COMANDO: INIT (MODERNO) ---
program
  .command('init')
  .description('Inicializa um novo projeto Gbitcode')
  .action(async () => {
     welcomeBanner(); // Ative se você tiver essa função definida
    const repoName = path.basename(process.cwd());
    
    const config = { 
        id: Date.now().toString(), 
        name: repoName, 
        version: "1.0.0",
        created_at: new Date().toISOString()
    };

    try {
      await fs.writeJson('gbitcode.json', config, { spaces: 2 });
      // Criando o ignore para não enviar lixo para a nuvem
      await fs.writeFile('.gbitignore', 'node_modules\n.env\n.git\n.next\n.gbitcode_config');
      
      console.log(chalk.green(`\n🚀 PROJETO '${repoName.toUpperCase()}' INICIALIZADO!`));
      console.log(chalk.gray('📝 Configurações gbitcode.json e .gbitignore geradas com sucesso.'));
      console.log(chalk.cyan(`💡 Próximo passo: gbitcode commit "primeiro envio"\n`));
    } catch (err) {
      console.error(chalk.red("❌ Erro ao inicializar:"), err.message);
    }
  });

  // COMANDO: HELP PERSONALIZADO
program
  .command('help')
  .description('Exibe o manual de comandos da Gbitcode Platform')
  .action(() => {
    console.log(`
${chalk.bold.italic.cyan('GBITCODE.PLATFORM')} ${chalk.gray('v1.0.0')}
${chalk.gray('------------------------------------------------')}

${chalk.yellow('USO:')}
  ${chalk.green('gbitcode <comando> [opções]')}

${chalk.yellow('COMANDOS DISPONÍVEIS:')}
  ${chalk.cyan('login')} <email>      Vincular sua identidade global ao Mainframe.
  ${chalk.cyan('init')}               Inicializar um novo projeto Gbitcode nesta pasta.
  ${chalk.cyan('commit')} <msg>       Sincronizar arquivos com gbitcode-platform.
  ${chalk.cyan('clone')} <id>        Clonar um repositório existente para sua máquina.
  ${chalk.cyan('help')}               Mostrar este manual de instruções.

${chalk.yellow('DICA:')}
  Sempre verifique o status do seu projeto no Dashboard:
  ${chalk.blue('https://gbitcode.vercel.app')}

${chalk.gray('------------------------------------------------')}
${chalk.italic.gray('Powered by Gbitcode Engine & Next.js 16')}
    `);
  });

// Sobrescrever a ajuda padrão do --help para usar o nosso estilo
program.on('--help', () => {
  console.log(chalk.cyan('\nPara um guia detalhado, use: gbitcode help\n'));
});

// --- COMANDO: LOGIN ---
program
  .command('login <email>')
  .description('Conecta sua conta Gbitcode')
  .action(async (email) => {
    try {
      // Salva o email no arquivo .gbitcode_config na pasta do usuário (C:\Users\Nome\.gbitcode_config)
      await fs.writeJson(CONFIG_PATH, { email });
      
      console.log(chalk.green(`\n✅ CONEXÃO ESTABELECIDA!`));
      console.log(chalk.white(`👤 Usuário: ${chalk.bold(email)}`));
      console.log(chalk.gray(`Agora todos os seus envios serão vinculados a esta conta.\n`));
    } catch (err) {
      console.error(chalk.red("❌ Erro ao salvar configuração:"), err);
    }
  });

 

// --- COMANDO: COMMIT (TURBINADO) ---
program
  .command('commit <message>')
  .description('Envia o projeto para o servidor Gbitcode')
  .action(async (message) => {
    try {
      // 1. Verificação de Login Global
      const homedir = require('os').homedir();
      const globalConfigPath = path.join(homedir, '.gbitcode_config');
      
      if (!(await fs.pathExists(globalConfigPath))) {
        console.log(chalk.yellow("\n⚠️  Identidade não encontrada."));
        console.log(chalk.cyan("Execute: gbitcode login seu-email@gmail.com\n"));
        return;
      }
      
      const { email } = await fs.readJson(globalConfigPath);

      // 2. Verificação do Projeto Local
      const projectConfigPath = path.join(process.cwd(), 'gbitcode.json');
      if (!(await fs.pathExists(projectConfigPath))) {
        return console.log(chalk.red("❌ Erro: Este diretório não é um projeto Gbitcode. Execute 'gbitcode init'."));
      }
      
      const config = await fs.readJson(projectConfigPath);
      
      console.log(chalk.blue(`🛰️  Preparando projeto: ${chalk.bold(config.name)}...`));

      const allFiles = await getAllFiles(process.cwd());

      if (allFiles.length === 0) {
        return console.log(chalk.yellow('⚠️ Nenhum arquivo encontrado para envio.'));
      }

    // --- INICIALIZAÇÃO DA BARRA LIMPA ---
      console.log(chalk.cyan(`📦 Transmitindo projeto para o gbitcode-platform...`));
      
      const progressBar = new cliProgress.SingleBar({
        format: chalk.blue('Sincronizando |') + chalk.cyan('{bar}') + '| {percentage}%',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
        clearOnComplete: true // Isso limpa a barra quando termina, evitando o visual "sujo"
      });

      progressBar.start(100, 0);

      // Envio Real
      const response = await axios.post(`${API_URL}/commit`, {
        email: email, 
        repoName: config.name,
        message: message,
        files: allFiles
      }, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 600000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressBar.update(percentCompleted);
        }
      });

      progressBar.stop();

      console.log(chalk.green(`\n✅ PROJETO GBITCODE SINCRONIZADO!`));
      console.log(chalk.gray(`👤 Autor: ${email}`));
      console.log(chalk.cyan(`🔗 Dashboard: https://gbitcode.vercel.app/repository/${config.name}`));

    } catch (error) {
      if (typeof progressBar !== 'undefined') progressBar.stop();
      console.error(chalk.red('\n❌ Erro durante a transmissão do projeto:'));
      console.log(chalk.gray(error.response?.data?.error || error.message));
    }
  });

// COMANDO: CLONE - MANTIDO COM A LÓGICA DE PASTAS
program
  .command('clone <repoName>')
  .description('Clona um repositório para sua máquina')
  .action(async (repoName) => {
    try {
      const ownerEmail = "dev-teste@gbitcode.com";
      console.log(chalk.blue(`🧬 Baixando sequência de Files: ${repoName}...`));

      const response = await axios.get(`${API_URL}/repos/${ownerEmail}/${repoName}/clone`);
      const files = response.data;

      if (!files || files.length === 0) {
        return console.log(chalk.yellow('⚠️ Repositório não encontrado ou vazio.'));
      }

      const targetDir = path.join(process.cwd(), repoName);
      await fs.ensureDir(targetDir);

      for (const file of files) {
        const filePath = path.join(targetDir, file.name);
        await fs.ensureDir(path.dirname(filePath)); // Esta linha já organiza as pastas!
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