"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const userEmail = "dev-teste@gbitcode.com";

  useEffect(() => {
  // Trocamos 'localhost:3001' pela sua URL da Railway
  fetch(`https://gbitcode-production.up.railway.app/api/repos/${userEmail}`)
    .then(res => res.json())
    .then(data => {
      // Garantimos que 'data' seja um array antes de salvar
      setRepos(Array.isArray(data) ? data : []);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Erro ao buscar repositórios:", err);
      setLoading(false);
    });
}, [userEmail]); // Adicionei [userEmail] para atualizar caso o email mude

  // Filtro de busca inteligente
  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER DA DASHBOARD */}
        <header className="flex justify-between items-center mb-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-black text-xs shadow-[0_0_20px_rgba(37,99,235,0.5)]">GB</div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em]">Mainframe v1.0</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Gbitcode<span className="text-blue-600">.</span>Storage</h1>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-mono uppercase">Authorized User</p>
            <p className="text-sm font-bold text-blue-400">{userEmail}</p>
          </div>
        </header>

        {/* BARRA DE BUSCA E STATUS */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="PESQUISAR REPOSITÓRIO..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-5 py-3 text-xs font-mono focus:border-blue-500 outline-none transition-all"
            />
            <span className="absolute right-4 top-3.5 opacity-30 text-xs">🔍</span>
          </div>
          
          <div className="flex gap-8">
             <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Total DNA</p>
                <p className="text-xl font-black text-white">{repos.length}</p>
             </div>
             <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Status</p>
                <p className="text-xl font-black text-emerald-500 uppercase text-xs mt-2 italic">● Online</p>
             </div>
          </div>
        </div>

        {/* GRID DE REPOSITÓRIOS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 rounded-3xl border border-white/5"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepos.map((repo) => (
              <Link key={repo.id} href={`/repository/${repo.name}`}>
                <div className="group relative bg-[#0D1117] border border-white/10 p-8 rounded-[2rem] hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                  {/* Efeito de brilho ao passar o mouse */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] group-hover:bg-blue-600/20 transition-all"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">📂</span>
                    <span className="text-[9px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded">ID: {repo.id}</span>
                  </div>
                  
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                    {repo.name}
                  </h3>
                  
                  <p className="text-xs text-gray-500 font-mono mb-6 line-clamp-1 italic">
                    "{repo.last_message || 'No commit message'}"
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Explorar Código</span>
                    <span className="text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* RODAPÉ */}
        <footer className="mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600 font-mono uppercase tracking-[0.5em]">
            Powered by Gbitcode Engine & Next.js 16
          </p>
        </footer>
      </div>
    </div>
  );
}