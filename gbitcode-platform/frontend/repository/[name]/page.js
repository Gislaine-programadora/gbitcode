"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function RepositoryFiles() {
  const { name } = useParams(); // Pega o nome do repo da URL
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const userEmail = "dev-teste@gbitcode.com";

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        // Chamada para o novo endpoint que criamos no Backend
        const res = await fetch(`http://localhost:3001/api/repos/${userEmail}/${name}/files`);
        const data = await res.json();
        setFiles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar arquivos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [name]);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* NAVEGAÇÃO ESTILO BREADCRUMB */}
        <nav className="flex items-center gap-2 text-sm mb-8 text-gray-500 font-mono">
          <Link href="/" className="hover:text-blue-400 transition-colors">dashboard</Link>
          <span>/</span>
          <span className="text-white font-bold">{name}</span>
        </nav>

        {/* CABEÇALHO DO REPOSITÓRIO */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
              {name.replace(/-/g, ' ')}
            </h1>
            <p className="text-blue-500 text-xs mt-2 font-mono tracking-widest">
              RAIZ: storage/{userEmail}/{name}
            </p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-gray-600 uppercase">Status do DNA</span>
            <span className="text-emerald-500 text-xs font-bold">● SINCRONIZADO</span>
          </div>
        </header>

        {/* LISTA DE ARQUIVOS ESTILO GITHUB TERMINAL */}
        <div className="bg-[#0D1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
            <span className="text-xs font-mono text-gray-400">Nome do Arquivo</span>
            <span className="text-xs font-mono text-gray-400">Tipo</span>
          </div>

          {loading ? (
            <div className="p-20 text-center text-gray-600 animate-pulse font-mono">Escaneando diretórios...</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {files.length > 0 ? (
                files.map((file) => (
                  <li key={file} className="flex items-center justify-between p-4 hover:bg-blue-500/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <span className="text-xl group-hover:scale-110 transition-transform">
                        {file.includes('.') ? '📄' : '📁'}
                      </span>
                      <span className="text-sm font-mono text-gray-300 group-hover:text-blue-400 transition-colors">
                        {file}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-600 uppercase">
                      {file.split('.').pop() || 'folder'}
                    </span>
                  </li>
                ))
              ) : (
                <div className="p-20 text-center">
                  <p className="text-gray-600 font-mono">Nenhum arquivo detectado nesta sequência de DNA.</p>
                </div>
              )}
            </ul>
          )}
        </div>

        {/* BOTÃO VOLTAR */}
        <Link href="/" className="inline-flex items-center gap-2 mt-12 text-gray-500 hover:text-white transition-all text-xs font-mono uppercase tracking-widest group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Terminal Central
        </Link>

      </div>
    </div>
  );
}