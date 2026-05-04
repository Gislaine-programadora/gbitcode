"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from "next-auth/react";

export default function Dashboard() {
 
  const { data: session, status } = useSession();

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalResults, setGlobalResults] = useState([]);
  const [mounted, setMounted] = useState(false);

  // ✅ DEFINIDO UMA ÚNICA VEZ (CORRIGIDO)
  const userEmail = session?.user?.email;

  // Montagem segura (evita erro de hidratação)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Tela de loading inicial
  if (status === "loading" || !mounted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-blue-500 font-mono animate-pulse uppercase tracking-[0.5em]">
          Iniciando Mainframe...
        </p>
      </div>
    );
  }

  // Tela de login
  if (!session) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-5xl font-black italic mb-2 text-white uppercase">
            GBITCODE<span className="text-blue-600">.</span>PLATFORM
          </h1>
          <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em] mb-12 uppercase">
            Acesso Restrito / Autenticação Necessária
          </p>

          <button 
            onClick={() => signIn('google')}
            className="bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase hover:bg-blue-600 hover:text-white transition-all"
          >
            Conectar via Google
          </button>
        </div>
      </div>
    );
  }

  // 🔄 Buscar repositórios
  useEffect(() => {
    if (!userEmail) return;

    const fetchRepos = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `https://gbitcode-api.onrender.com/api/repos/${userEmail}?t=${Date.now()}`
        );

        const data = await res.json();
        setRepos(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error("Erro ao buscar repositórios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();

    const interval = setInterval(fetchRepos, 30000);
    return () => clearInterval(interval);

  }, [userEmail]);

  // 🔍 Busca global
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchTerm.length > 1) {
        try {
          const res = await fetch(
            `https://gbitcode-api.onrender.com/api/search?q=${searchTerm}`
          );

          const data = await res.json();
          setGlobalResults(Array.isArray(data) ? data : []);

        } catch (err) {
          console.error("Erro na busca global:", err);
        }
      } else {
        setGlobalResults([]);
      }
    }, 300);

    return () => clearTimeout(delay);

  }, [searchTerm]);

  // 🔎 Filtro local
  const myFilteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 📋 copiar comando clone
  const copyToClipboard = (repoName) => {
    navigator.clipboard.writeText(`gbitcode clone ${repoName}`);
    alert(`Comando de clone copiado!`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-black text-xs">
                GB
              </div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em]">
                Gbitcode v1.0
              </span>
            </div>

            <h1 className="text-4xl font-black uppercase italic">
              Gbitcode<span className="text-blue-600">.</span>Platform
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-mono uppercase">
                Authorized User
              </p>
              <p className="text-sm font-bold text-blue-400">
                {session.user.email}
              </p>
            </div>

            <button 
              onClick={() => signOut()} 
              className="text-[9px] text-red-500 border border-red-500/30 px-2 py-1 rounded"
            >
              SAIR
            </button>
          </div>
        </header>

        {/* BUSCA */}
        <div className="mb-12">
          <input 
            type="text"
            placeholder="PESQUISAR PROJETOS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 bg-[#0D1117] border border-white/10 rounded-xl px-5 py-3 text-xs"
          />

          {/* RESULTADOS GLOBAIS */}
          {globalResults.length > 0 && (
            <div className="mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl">
              {globalResults.map(repo => (
                <Link key={repo.id} href={`/repository/${repo.name}`}>
                  <div className="p-3 hover:bg-blue-600/10 cursor-pointer">
                    {repo.name}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* REPOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {loading ? (
            <p className="text-gray-500 text-xs">
              Sincronizando Projetos...
            </p>
          ) : myFilteredRepos.map(repo => (

            <div key={repo.id} className="bg-[#0D1117] p-6 rounded-2xl">
              
              <h3 className="text-lg font-black mb-2">
                {repo.name}
              </h3>

              <div className="flex justify-between items-center">
                
                <Link 
                  href={`/repository/${repo.name}`}
                  className="text-xs text-blue-500"
                >
                  Acessar
                </Link>

                <button 
                  onClick={() => copyToClipboard(repo.name)}
                  className="text-xs text-blue-400"
                >
                  Clone 📋
                </button>

              </div>
            </div>

          ))}

        </div>

      </div>
    </div>
  );
}