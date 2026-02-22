"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react"; // Importe o hook de sessão

export default function Dashboard() {
  const { data: session } = useSession(); // Pegue os dados do usuário logado
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [globalResults, setGlobalResults] = useState([]);

  // Se estiver logado, usa o email do Google. Se não, usa o teste para não quebrar a página.
  const userEmail = session?.user?.email || "dev-teste@gbitcode.com";

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
  }, [userEmail]); // Recarrega sempre que o usuário logar/deslogar

  // ... (mantenha o restante da lógica de busca global e filtro local)

  // 2. Lógica de Busca Global (Acionada quando o usuário digita)
  useEffect(() => {
    if (search.length > 1) {
      fetch(`https://gbitcode-production.up.railway.app/api/search?q=${search}`)
        .then(res => res.json())
        .then(data => setGlobalResults(Array.isArray(data) ? data : []))
        .catch(err => console.error("Erro na busca global:", err));
    } else {
      setGlobalResults([]);
    }
  }, [search]);

  // Filtro local para os SEUS repositórios
  const myFilteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-8">
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
            <p className="text-[10px] text-gray-500 font-mono uppercase">Authorized User</p>
            <p className="text-sm font-bold text-blue-400">{userEmail}</p>
          </div>
        </header>

        {/* BARRA DE BUSCA COM DROPDOWN GLOBAL */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between relative">
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="PESQUISAR REPOSITÓRIO GLOBAL..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0D1117] border border-white/10 rounded-xl px-5 py-3 text-xs font-mono focus:border-blue-500 outline-none transition-all"
            />
            <span className="absolute right-4 top-3.5 opacity-30 text-xs">🔍</span>

            {/* Resultado da Busca Global (Flutuante) */}
            {globalResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-[#0D1117] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 text-[9px] text-gray-500 uppercase font-black bg-white/5">Resultados Globais</div>
                {globalResults.map(repo => (
                  <Link key={repo.id} href={`/repository/${repo.name}`}>
                    <div className="p-4 hover:bg-blue-600/20 border-b border-white/5 transition-all flex justify-between items-center">
                      <span className="text-xs font-bold uppercase">{repo.name}</span>
                      <span className="text-[9px] text-blue-400 font-mono italic">{repo.owner_email}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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

        {/* GRID DE REPOSITÓRIOS DO USUÁRIO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-gray-500 font-mono text-xs animate-pulse">Sincronizando DNA...</p>
          ) : myFilteredRepos.map(repo => (
            <Link key={repo.id} href={`/repository/${repo.name}`}>
              <div className="group bg-[#0D1117] border border-white/5 p-6 rounded-2xl hover:border-blue-500/50 transition-all hover:translate-y-[-4px] cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                   <span className="text-2xl text-blue-500">🧬</span>
                </div>
                <h3 className="text-lg font-black uppercase italic mb-2 group-hover:text-blue-400 transition-colors">{repo.name}</h3>
                <p className="text-[10px] text-gray-500 font-mono mb-4">"No commit message"</p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                   <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Explorar Código</span>
                   <span className="text-[9px] text-gray-600 font-mono">{new Date(repo.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

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