"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalResults, setGlobalResults] = useState([]);

  const userEmail = session?.user?.email; // Remova o "|| dev-teste" para testar sua conta real

  // 1. Filtro local para os SEUS repositórios
  const myFilteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Busca os repositórios do usuário logado
  useEffect(() => {
    setLoading(true);
    fetch(`https://gbitcode-production.up.railway.app/api/repos/${userEmail}`)
      .then(res => res.json())
      .then(data => {
        setRepos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar repositórios:", err);
        setLoading(false);
      });
  }, [userEmail]);

  // 3. Lógica de Busca Global (Debounce de 300ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 1) {
        try {
          const res = await fetch(`https://gbitcode-production.up.railway.app/api/search?q=${searchTerm}`);
          const data = await res.json();
          setGlobalResults(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Erro na busca global:", err);
        }
      } else {
        setGlobalResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-black text-xs shadow-[0_0_20px_rgba(37,99,235,0.5)]">GB</div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em]">Mainframe v1.0</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Gbitcode<span className="text-blue-600">.</span>Storage</h1>
          </div>
          
          <div className="text-right">
            {!session ? (
              <button 
                onClick={() => signIn('google')}
                className="bg-white text-black px-4 py-2 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                Conectar Google
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-mono uppercase">Authorized User</p>
                  <p className="text-sm font-bold text-blue-400">{session.user.email}</p>
                </div>
                <button 
                  onClick={() => signOut()}
                  className="text-[9px] text-red-500 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/10 transition-all"
                >
                  SAIR
                </button>
              </div>
            )}
          </div>
        </header>

        {/* BARRA DE BUSCA GLOBAL */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between relative">
          <div className="relative w-full md:w-96 group">
            <input 
              type="text" 
              placeholder="PESQUISAR PROJETOS GLOBAIS..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-5 py-3 text-xs font-mono focus:border-blue-500 outline-none transition-all"
            />
            
            {/* Resultado da Busca Global (Flutuante) */}
            {globalResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden">
                <div className="p-2 text-[8px] text-gray-600 uppercase font-black bg-white/5 tracking-widest text-center">Resultados do Mainframe</div>
                {globalResults.map((repo) => (
                  <Link key={repo.id} href={`/repository/${repo.name}`}>
                    <div className="flex justify-between items-center p-4 hover:bg-blue-600/10 border-b border-white/5 last:border-0 transition-all">
                      <span className="text-[11px] font-bold text-white uppercase">{repo.name}</span>
                      <span className="text-[8px] text-blue-500 font-mono italic">{repo.owner_email}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-8">
             <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Total Storage</p>
                <p className="text-xl font-black text-white">{repos.length}</p>
             </div>
             <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Status</p>
                <p className="text-xl font-black text-emerald-500 uppercase text-xs mt-2 italic">● Online</p>
             </div>
          </div>
        </div>

        {/* AVISO SE DESLOGADO */}
        {!session && (
          <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl mb-12">
            <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Aguardando Autenticação...</p>
            <h2 className="text-xl font-black mt-4 italic text-white/40">CONECTE SUA CONTA PARA SINCRONIZAR PROJETOS</h2>
          </div>
        )}

        {/* GRID DE REPOSITÓRIOS DO USUÁRIO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-gray-500 font-mono text-xs animate-pulse uppercase tracking-widest">Sincronizando Projetos...</p>
          ) : myFilteredRepos.map(repo => (
            <Link key={repo.id} href={`/repository/${repo.name}`}>
              <div className="group bg-[#0D1117] border border-white/5 p-6 rounded-2xl hover:border-blue-500/50 transition-all hover:translate-y-[-4px] cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                   <span className="text-2xl text-blue-500">🛰️</span>
                </div>
                <h3 className="text-lg font-black uppercase italic mb-2 group-hover:text-blue-400 transition-colors">{repo.name}</h3>
                <p className="text-[10px] text-gray-500 font-mono mb-4 italic">"Envio realizado via Gbitcode CLI"</p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                   <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Acessar Código</span>
                   <span className="text-[9px] text-gray-600 font-mono">{new Date(repo.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* RODAPÉ */}
        <footer className="mt-32 pb-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600 font-mono uppercase tracking-[0.5em] mt-8">
            Powered by Gbitcode Engine & Next.js 16
          </p>
        </footer>

      </div>
    </div>
  );
}