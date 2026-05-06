"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion"; 
import { Info, Terminal, X, Copy, Check, Search, LogOut, User, Box, ExternalLink } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalResults, setGlobalResults] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const guideRef = useRef(null);
  const userEmail = session?.user?.email;

  // ---------------- HOOKS ----------------

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Fecha o guia ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (guideRef.current && !guideRef.current.contains(event.target)) {
        setShowGuide(false);
      }
    };
    if (showGuide) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGuide]);

  // ---------------- PROTEÇÕES ----------------

  if (!mounted) return null;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        Carregando sessão...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
        <h1 className="text-4xl font-black mb-6">
          GBITCODE<span className="text-blue-500">.</span>
        </h1>
        <button
          onClick={() => signIn("google")}
          className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-blue-600 hover:text-white transition"
        >
          Login com Google
        </button>
      </div>
    );
  }

  // ---------------- FUNÇÕES ----------------

  const myFilteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyToClipboard = (repoName) => {
    navigator.clipboard.writeText(`gbitcode clone ${repoName}`);
    alert("Comando de clone copiado!");
  };

  // ---------------- UI ----------------

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black italic">
              GBITCODE<span className="text-blue-500">.</span>PLATFORM
            </h1>
            <p className="text-xs text-gray-500 font-mono">
              Sistema de versionamento distribuído
            </p>
          </div>

          <div className="flex items-center gap-4">
            
            {/* BOTÃO E CARD MODO DE USO */}
            <div className="relative" ref={guideRef}>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all ${
                  showGuide ? "bg-blue-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                <Info size={14} />
                COMO USAR
              </button>

              <AnimatePresence>
                {showGuide && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-[320px] md:w-[400px] bg-[#0D1117] border border-white/10 p-6 rounded-2xl shadow-2xl z-[100]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-black text-blue-400 flex items-center gap-2">
                        <Terminal size={18} /> Gbitcode CLI
                      </h2>
                      <button onClick={() => setShowGuide(false)} className="text-gray-500 hover:text-white">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-bold mb-1">1. Vá até seu projeto</p>
                        <p className="text-gray-500 text-xs italic">Abra o terminal na pasta do projeto</p>
                      </div>

                      {[
                        { id: 'cli', title: "2. Instale a CLI", cmd: "npm install -g gbitcode-cli" },
                        { id: 'login', title: "3. Faça login", cmd: "gbitcode login" },
                        { id: 'commit', title: "4. Envie seu projeto", cmd: 'gbitcode commit "primeiro commit"' },
                      ].map((item) => (
                        <div key={item.id}>
                          <p className="font-bold mb-1">{item.title}</p>
                          <div className="flex justify-between bg-black p-2 rounded border border-white/5 items-center">
                            <code className="text-[11px] text-blue-300 truncate mr-2">{item.cmd}</code>
                            <button 
                              onClick={() => copy(item.cmd, item.id)} 
                              className="text-gray-500 hover:text-white"
                            >
                              {copiedId === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      ))}

                      <p className="font-bold">5. Pronto 🎉 <span className="block text-gray-500 font-normal text-xs italic">Veja seus códigos no site</span></p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">Usuário</p>
              <p className="text-sm text-blue-400 font-bold max-w-[150px] truncate">
                {session.user.email}
              </p>
              <button
                onClick={() => signOut()}
                className="text-xs text-red-500 mt-1 hover:underline flex items-center gap-1 ml-auto"
              >
                <LogOut size={12} /> Sair
              </button>
            </div>
          </div>
        </header>

        {/* BUSCA */}
        <div className="relative mb-10">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar projetos globais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 bg-[#0D1117] border border-white/10 px-12 py-3 rounded-xl text-sm focus:border-blue-500 outline-none transition-all"
          />

          {globalResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full md:w-96 bg-[#0D1117] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
              {globalResults.map((repo) => (
                <Link key={repo.id} href={`/repository/${repo.name}`}>
                  <div className="p-3 hover:bg-blue-600/10 border-b border-white/5 cursor-pointer">
                    <p className="text-sm font-bold">{repo.name}</p>
                    <p className="text-xs text-gray-500">{repo.owner_email}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* GRID DE REPOSITÓRIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-gray-500 font-mono animate-pulse col-span-full text-center py-10">
              Carregando projetos de {session.user.email}...
            </p>
          ) : (
            myFilteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="bg-[#0D1117] border border-white/5 p-6 rounded-xl hover:border-blue-500 transition hover:-translate-y-1 group"
              >
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                      <Box size={20} />
                   </div>
                   <h3 className="text-lg font-bold truncate">{repo.name}</h3>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                  <Link
                    href={`/repository/${repo.name}`}
                    className="text-blue-400 text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    ACESSAR <ExternalLink size={12} />
                  </Link>

                  <button
                    onClick={() => copyToClipboard(repo.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-bold text-gray-400 hover:text-white transition-all active:scale-95"
                  >
                    <Copy size={12} /> CLONE
                  </button>
                </div>
              </div>
            ))
          )}
          
          {/* Fallback caso não tenha projetos */}
          {!loading && myFilteredRepos.length === 0 && (
            <div className="col-span-full text-center py-20 bg-[#0D1117] rounded-2xl border border-dashed border-white/10">
               <p className="text-gray-500">Nenhum repositório encontrado.</p>
            </div>
          )}
        </div>

        <footer className="mt-20 py-10 text-center text-xs text-gray-600 font-mono border-t border-white/5">
          &copy; 2026 Powered by Gbitcode Engine
        </footer>

      </div>
    </div>
  );
}