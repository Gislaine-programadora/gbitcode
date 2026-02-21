"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { signIn, signOut, useSession } from "next-auth/react";

// --- 1. COMPONENTE AUXILIAR: ÁRVORE DE ARQUIVOS ---
const FileItem = ({ node, level, onFileClick, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (node.isFile) {
    return (
      <li 
        onClick={() => onFileClick(node.fullPath)}
        className={`flex items-center gap-2 p-2 ml-4 rounded-lg cursor-pointer transition-all ${
          selectedFile === node.fullPath ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'
        }`}
      >
        <span className="text-sm opacity-70">📄</span>
        <span className={`text-xs font-mono ${selectedFile === node.fullPath ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>
          {node.name}
        </span>
      </li>
    );
  }

  return (
    <div className="mb-1">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
      >
        <span className="text-sm">{isOpen ? '📂' : '📁'}</span>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{node.name}</span>
      </div>
      {isOpen && (
        <ul className="border-l border-white/5 ml-3 mt-1 space-y-1">
          {Object.values(node.children).map((child) => (
            <FileItem 
              key={child.fullPath || child.name} 
              node={child} 
              level={level + 1} 
              onFileClick={onFileClick}
              selectedFile={selectedFile}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

// --- 2. FUNÇÃO PRINCIPAL ---
export default function RepositoryFiles() {
  const { name } = useParams();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false); // Posicionado corretamente aqui
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
 const userEmail = session?.user?.email || "dev-teste@gbitcode.com";

  const buildFileTree = (filePaths) => {
    const root = { name: 'root', children: {} };
    filePaths.forEach(path => {
      const parts = path.split('/');
      let current = root;
      parts.forEach((part, index) => {
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            children: {},
            isFile: index === parts.length - 1,
            fullPath: path
          };
        }
        current = current.children[part];
      });
    });

    useEffect(() => {
    setMounted(true); // ADICIONE ISSO
  }, []);
    if (!mounted) return null;
    return root;
  };

  const getLanguage = (filename) => {
    if (!filename) return 'text';
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
      html: 'html', css: 'css', json: 'json', md: 'markdown', sol: 'solidity'
    };
    return map[ext] || 'javascript';
  };

  const handleOpenFile = async (fileName) => {
  try {
    // URL atualizada para produção
    const response = await fetch(`https://gbitcode-production.up.railway.app/api/repos/${userEmail}/${name}/file/${fileName}`);
    const content = await response.text();
    setFileContent(content);
    setSelectedFile(fileName);
  } catch (error) {
    alert("Erro ao abrir arquivo");
  }
};

  useEffect(() => {
  const fetchFiles = async () => {
    try {
      // URL atualizada para produção
      const res = await fetch(`https://gbitcode-production.up.railway.app/api/repos/${userEmail}/${name}/files`);
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
       console.error("Erro ao buscar arquivos", error);
    }
  };
  fetchFiles();
}, [userEmail, name]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      
   {/* HEADER GBITCODE */}
      <header className="border-b border-white/5 bg-[#0a0a0a] p-4 shadow-2xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="bg-blue-600 p-2 rounded-lg rotate-3 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:rotate-0 transition-transform">
              <span className="text-white font-black text-xs">GB</span>
            </Link>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">{name}</h1>
              <div className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">GBITCODE | Project Active</span>
              </div>
            </div>

            {/* --- NOVA BARRA DE PESQUISA INTEGRADA --- */}
            <div className="relative ml-4 group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="text-[10px] opacity-50">🔍</span>
              </div>
              <input 
                type="text"
                placeholder="Pesquisar projetos no GbitSpace..."
                className="bg-white/5 border border-white/10 text-white text-[10px] rounded-full py-2 pl-9 pr-4 w-[250px] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-gray-600 font-medium tracking-tight"
                onChange={(e) => console.log("Buscando:", e.target.value)}
              />
            </div>
          </div>

          {/* LADO DIREITO: LOGIN E AÇÕES */}
          <div className="flex items-center gap-4">
            
            {/* LOGIN GOOGLE */}
            {session ? (
              <div className="flex items-center gap-3 bg-white/5 p-1 pr-4 rounded-full border border-white/10">
                <img 
                 src={session.user.image} 
                  alt="User" 
                  className="w-10 h-10 min-w-[40px] rounded-full border-2 border-blue-500 object-cover shadow-lg" 
                  />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white leading-tight">{session.user.name}</span>
                  <button onClick={() => signOut()} className="text-[9px] text-red-400 hover:text-red-300 text-left uppercase font-black">Sair</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => signIn('google')}
                className="bg-white text-black text-[10px] font-black px-6 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95"
              >
                CONECTAR GOOGLE
              </button>
            )}

            {/* COMANDO CLI */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full pl-4 pr-1 py-1 gap-4">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">CLI</span>
              <code className="text-xs text-blue-400 font-bold font-mono bg-black/30 px-3 py-1 rounded-md">
                gbitcode clone {name}
              </code>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(`gbitcode clone ${name}`);
                  const btn = e.currentTarget;
                  btn.innerText = "COPIADO!";
                  setTimeout(() => btn.innerText = "COPIAR", 2000);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-5 py-2 rounded-full transition-all"
              >
                COPIAR
              </button>
            </div>

            {/* DELETAR */}
            <button 
              onClick={() => {
                if(confirm("⚠️ EXCLUIR PROJETO?")) {
                 fetch(`https://gbitcode-production.up.railway.app/api/repos/${userEmail}/${name}`, { method: 'DELETE' })
                    .then(() => window.location.href = "/");
                }
              }}
              className="border border-red-500/30 hover:bg-red-500/10 text-red-500 text-[10px] font-black px-4 py-2 rounded-full transition-all"
            >
              DELETAR
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden h-[calc(100vh-80px)]">
        <aside className="w-1/4 min-w-[300px] border-r border-white/5 overflow-y-auto p-4 bg-[#050505]">
          <div className="mb-6 px-2 text-[9px] text-gray-600 uppercase font-black tracking-[0.3em]">Explorer</div>
          <div className="flex flex-col">
            {Object.values(buildFileTree(files).children).map((node) => (
              <FileItem 
                key={node.fullPath || node.name} 
                node={node} 
                level={0} 
                onFileClick={handleOpenFile} 
                selectedFile={selectedFile} 
              />
            ))}
          </div>
        </aside>

        <section className="flex-1 bg-[#0D1117] flex flex-col">
          {selectedFile ? (
            <>
              <div className="p-3 bg-[#161b22] border-b border-white/5 flex justify-between items-center px-6">
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 bg-blue-500 rounded-full"></span> {selectedFile}
                </span>
                <span className="text-[9px] text-gray-700 font-mono uppercase">GB-Engine v1.0</span>
              </div>
              <div className="flex-1 overflow-auto bg-[#1e1e1e]">
                <SyntaxHighlighter
                  language={getLanguage(selectedFile)}
                  style={vscDarkPlus}
                  showLineNumbers={true}
                  customStyle={{ margin: 0, padding: '25px', fontSize: '14px', backgroundColor: 'transparent' }}
                >
                  {fileContent}
                </SyntaxHighlighter>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] opacity-20">
               <span className="text-8xl mb-4">🚀</span>
               <p className="font-mono text-xs uppercase tracking-[0.5em]">Gbitcode Cloud Ready</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}