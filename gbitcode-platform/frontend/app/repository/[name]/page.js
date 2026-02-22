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
  const [mounted, setMounted] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const userEmail = session?.user?.email || "dev-teste@gbitcode.com";

  // Ajuste: Mounted deve ficar no corpo do componente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ajuste: buildFileTree simplificada e sem hooks internos
  const buildFileTree = (filePaths) => {
    const root = { name: 'root', children: {} };
    if (!Array.isArray(filePaths)) return root;

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
    return root;
  };

  const getLanguage = (filename) => {
    if (!filename) return 'text';
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
      html: 'html', css: 'css', json: 'json', md: 'markdown'
    };
    return map[ext] || 'javascript';
  };

  const handleOpenFile = async (fileName) => {
    try {
      // Ajuste: Rota do backend para ler um único arquivo
      const response = await fetch(`https://gbitcode-production.up.railway.app/api/repos/${userEmail}/${name}/file/${fileName}`);
      const content = await response.text();
      setFileContent(content);
      setSelectedFile(fileName);
    } catch (error) {
      console.error("Erro ao abrir arquivo", error);
    }
  };

  useEffect(() => {
    if (!name) return;
    const fetchFiles = async () => {
      try {
        const res = await fetch(`https://gbitcode-production.up.railway.app/api/repos/${userEmail}/${name}/files`);
        const data = await res.json();
        setFiles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar lista de arquivos", error);
      }
    };
    fetchFiles();
  }, [userEmail, name]);

  if (!mounted) return null;

  const tree = buildFileTree(files);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      {/* HEADER */}
      <header className="border-b border-white/5 bg-[#0a0a0a] p-4 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="bg-blue-600 p-2 rounded-lg font-black text-xs">GB</Link>
            <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase italic">{name}</h1>
              <span className="text-[10px] text-gray-500 font-mono tracking-widest">GBITCODE | Project Active</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* BOTÃO CLONE */}
             <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1 flex items-center gap-3">
                <span className="text-[10px] font-mono text-blue-400">gbitcode clone {name}</span>
             </div>
             <button onClick={() => signOut()} className="text-[10px] font-black text-red-500">SAIR</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden h-[calc(100vh-80px)]">
        {/* EXPLORER */}
        <aside className="w-1/4 min-w-[300px] border-r border-white/5 overflow-y-auto p-4 bg-[#050505]">
          <div className="mb-6 text-[9px] text-gray-600 uppercase font-black tracking-widest">Explorer</div>
          {Object.values(tree.children).map((node) => (
            <FileItem 
              key={node.fullPath || node.name} 
              node={node} 
              level={0} 
              onFileClick={handleOpenFile} 
              selectedFile={selectedFile} 
            />
          ))}
        </aside>

        {/* CODE EDITOR */}
        <section className="flex-1 bg-[#0D1117] flex flex-col overflow-hidden">
          {selectedFile ? (
            <div className="flex flex-col h-full">
              <div className="p-3 bg-[#161b22] border-b border-white/5 text-[10px] font-mono text-blue-400 uppercase">
                {selectedFile}
              </div>
              <div className="flex-1 overflow-auto">
                <SyntaxHighlighter
                  language={getLanguage(selectedFile)}
                  style={vscDarkPlus}
                  showLineNumbers={true}
                  customStyle={{ margin: 0, padding: '20px', fontSize: '13px', background: 'transparent' }}
                >
                  {fileContent}
                </SyntaxHighlighter>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20">
              <span className="text-8xl">🚀</span>
              <p className="font-mono text-xs mt-4 tracking-widest">Selecione um arquivo para ver o DNA</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}