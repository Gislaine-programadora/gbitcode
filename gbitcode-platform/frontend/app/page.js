"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion"; // Certifique-se de ter framer-motion instalado
import { Info, Terminal, X, Copy, Check } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalResults, setGlobalResults] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(null);

  const guideRef = useRef(null);
  const userEmail = session?.user?.email;

  // ---------------- HOOKS ----------------

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fecha o card ao clicar fora dele
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

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const copyToClipboard = (repoName) => {
    navigator.clipboard.writeText(`gbitcode clone ${repoName}`);
    alert("Comando copiado!");
  };

  // ---------------- UI ----------------

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black italic">
              GBITCODE<span className="text-blue-500">.</span>PLATFORM
            </h1>
            <p className="text-xs text-gray-500 font-mono">
              Sistema de versionamento distribuído
            </p>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* CONTAINER DO BOTÃO E CARD */}
            <div className="relative" ref={guideRef}>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all ${
                  showGuide ? "bg-blue-600" : "bg-blue-700 hover:bg-blue-600"
                }`}
              >
                <Info size={14} />
                COMO USAR
              </button>

              {/* CARD DE INFORMAÇÕES (POPOVER ABSOLUTO) */}
              <AnimatePresence>
                {showGuide && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-[320px] md:w-[400px] bg-[#0D1117] border border-white/10 p-6 rounded-2xl shadow-2xl z-[100]"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-black text-blue-400 flex items-center gap-2">
                        <Terminal size={18} /> 🚀 Guia CLI
                      </h2>
                      <button onClick={() => setShowGuide(false)} className="text-gray-500 hover:text-white">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-300">1. Instale a CLI</p>
                        <div className="flex justify-between bg-black p-2 rounded mt-1 border border-white/5">
                          <code className="text-[11px] text-blue-300">npm install -g gbitcode-cli</code>
                          <button onClick={() => copy("npm install -g gbitcode-cli")} className="text-gray-500 hover:text-blue-400">
                            {copiedCmd === "npm install -g gbitcode-cli" ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-300">2. Faça login</p>
                        <div className="flex justify-between bg-black p-2 rounded mt-1 border border-white/5">
                          <code className="text-[11px] text-blue-300">gbitcode login</code>
                          <button onClick={() => copy("gbitcode login")} className="text-gray-500 hover:text-blue-400">
                             {copiedCmd === "gbitcode login" ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-300">3. Envie seu projeto</p>
                        <div className="flex justify-between bg-black p-2 rounded mt-1 border border-white/5">
                          <code className="text-[11px] text-blue-300">gbitcode commit "projeto"</code>
                          <button onClick={() => copy('gbitcode commit "projeto"')} className="text-gray-500 hover:text-blue-400">
                             {copiedCmd === 'gbitcode commit "projeto"' ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500 leading-none">Usuário</p>
              <p className="text-sm text-blue-400 font-bold truncate max-w-[150px]">
                {session.user.email}
              </p>
              <button
                onClick={() => signOut()}
                className="text-[10px] text-red-500 hover:underline"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* BUSCA */}
        <div className="relative mb-10">
          <input
            type="text"
            placeholder="Buscar projetos globais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 bg-[#0D1117] border border-white/10 px-4 py-3 rounded-xl text-sm focus:border-blue-500 outline-none"
          />

          {globalResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full md:w-96 bg-[#0D1117] border border-white/10 rounded-xl overflow-hidden z-50">
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

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-gray-500 font-mono animate-pulse">
              Carregando projetos...
            </p>
          ) : (
            myFilteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="bg-[#0D1117] border border-white/5 p-5 rounded-xl hover:border-blue-500 transition hover:-translate-y-1"
              >
                <h3 className="text-lg font-bold mb-2">{repo.name}</h3>

                <div className="flex justify-between items-center">
                  <Link
                    href={`/repository/${repo.name}`}
                    className="text-blue-400 text-xs hover:underline"
                  >
                    Acessar
                  </Link>

                  <button
                    onClick={() => copyToClipboard(repo.name)}
                    className="text-xs text-gray-400 hover:text-blue-400"
                  >
                    Clone
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="mt-20 text-center text-xs text-gray-600 font-mono">
          Powered by Gbitcode Engine
        </footer>
      </div>
    </div>
  );
}