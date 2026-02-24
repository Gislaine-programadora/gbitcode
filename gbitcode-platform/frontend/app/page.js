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
  const [mounted, setMounted] = useState(false); // Segurança contra erros de Client-side

  const userEmail = session?.user?.email;

  // Garante que o componente só renderize interatividade após carregar
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- PAREDE DE PROTEÇÃO (Garante que a tela não fique preta) ---
  
  // Se ainda estiver carregando a sessão ou o componente não montou, mostra o loading
  if (status === "loading" || !mounted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-blue-500 font-mono animate-pulse uppercase tracking-[0.5em]">Iniciando Mainframe...</p>
      </div>
    );
  }

  // Se você clicou em "Sair" e não tem sessão, mostra a tela de login estilizada
  if (!session) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-5xl font-black italic mb-2 text-white uppercase">GBITCODE<span className="text-blue-600">.</span>PLATFORM</h1>
          <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em] mb-12 uppercase">Acesso Restrito / Autenticação Necessária</p>
          <button 
            onClick={() => signIn('google')}
            className="bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            Conectar via Google
          </button>
        </div>
      </div>
    );
  }

  // Se passou pelas paredes acima, agora sim definimos o userEmail com segurança
  const userEmail = session.user?.email;

  // Busca os repositórios do usuário logado com atualização inteligente
useEffect(() => {
  if (!userEmail) return;

  const fetchRepos = async () => {
    try {
      setLoading(true);
      // O "?t=" + Date.now() impede que o navegador mostre dados antigos (cache)
      const res = await fetch(`https://gbitcode-production.up.railway.app/api/repos/${userEmail}?t=${Date.now()}`);
      const data = await res.json();
      
      setRepos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar repositórios:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchRepos();

  // Opcional: Atualiza a lista automaticamente a cada 30 segundos
  const interval = setInterval(fetchRepos, 30000);
  return () => clearInterval(interval);

}, [userEmail]);

  // Lógica de Busca Global
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

  const myFilteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (repoName) => {
    navigator.clipboard.writeText(`gbitcode clone ${repoName}`);
    alert(`Comando de clone copiado!`);
  };

  if (!mounted) return null; // Evita Hydration Error

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-black text-xs shadow-[0_0_20px_rgba(37,99,235,0.5)]">GB</div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em]">Gbitcode v1.0</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Gbitcode<span className="text-blue-600">.</span>Platform</h1>
          </div>
          
          <div className="text-right">
            {!session ? (
              <button onClick={() => signIn('google')} className="bg-white text-black px-4 py-2 rounded-full text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">
                Conectar Google
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-mono uppercase">Authorized User</p>
                  <p className="text-sm font-bold text-blue-400">{session.user.email}</p>
                </div>
                <button onClick={() => signOut()} className="text-[9px] text-red-500 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/10 transition-all">
                  SAIR
                </button>
              </div>
            )}
          </div>
        </header>

        {/* BUSCA GLOBAL */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between relative">
          <div className="relative w-full md:w-96 group">
            <input 
              type="text" 
              placeholder="PESQUISAR PROJETOS GLOBAIS..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-5 py-3 text-xs font-mono focus:border-blue-500 outline-none transition-all"
            />
            {globalResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden">
                <div className="p-2 text-[8px] text-gray-600 uppercase font-black bg-white/5 tracking-widest text-center">Resultados do Mainframe</div>
                {globalResults.map((repo) => (
                  <Link key={repo.id} href={`/repository/${repo.name}`}>
                    <div className="flex justify-between items-center p-4 hover:bg-blue-600/10 border-b border-white/5 last:border-0 transition-all cursor-pointer">
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

        {/* GRID DE REPOSITÓRIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-gray-500 font-mono text-xs animate-pulse uppercase tracking-widest">Sincronizando Projetos...</p>
          ) : myFilteredRepos.map(repo => (
            <div key={repo.id} className="group bg-[#0D1117] border border-white/5 p-6 rounded-2xl hover:border-blue-500/50 transition-all hover:translate-y-[-4px] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                 <span className="text-2xl text-blue-500">🛰️</span>
              </div>
              <h3 className="text-lg font-black uppercase italic mb-2 group-hover:text-blue-400">{repo.name}</h3>
              <p className="text-[10px] text-gray-500 font-mono mb-4 italic">"Envio realizado via Gbitcode CLI"</p>
              
              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <Link href={`/repository/${repo.name}`} className="text-[9px] font-black text-blue-600 uppercase hover:underline">
                    Acessar Código
                  </Link>
                  <span className="text-[9px] text-gray-600 font-mono">{new Date(repo.created_at).toLocaleDateString()}</span>
                </div>
                
                {/* BOTÃO CLONE DENTRO DO CARD */}
                <button 
                  onClick={(e) => { e.preventDefault(); copyToClipboard(repo.name); }}
                  className="w-full bg-white/5 border border-white/10 py-2 rounded-lg text-[9px] font-mono text-blue-400 hover:bg-blue-600/10 transition-all uppercase"
                >
                  CLONE COMMAND 📋
                </button>
              </div>
            </div>
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