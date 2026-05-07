"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Info, Terminal, X, Copy, Check, Search, LogOut, Box, ExternalLink } from "lucide-react";

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
          onClick={async () => {
            await signOut({ redirect: false });
            signIn("google", {
              prompt: "select_account",
              callbackUrl: "/"
            });
          }}
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
    alert("Comando copiado!");
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

            {/* BOTÃO GUIA */}
            <div className="relative" ref={guideRef}>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="bg-blue-600 px-4 py-2 rounded text-xs font-bold hover:bg-blue-500"
              >
                COMO USAR
              </button>

              {showGuide && (
                <div className="absolute right-0 mt-3 w-[320px] bg-[#0D1117] border border-white/10 p-4 rounded-xl z-[200] shadow-2xl">
                  <p className="text-sm font-bold mb-2">Guia rápido</p>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p>Instalar CLI:</p>
                      <button onClick={() => copy("npm install -g gbitcode-cli", "1")}>
                        Copiar
                      </button>
                    </div>

                    <div>
                      <p>Login:</p>
                      <button onClick={() => copy("gbitcode login", "2")}>
                        Copiar
                      </button>
                    </div>

                    <div>
                      <p>Commit:</p>
                      <button onClick={() => copy('gbitcode commit "meu projeto"', "3")}>
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* USER */}
            <div className="text-right">
              <p className="text-xs text-gray-500">Usuário</p>
              <p className="text-sm text-blue-400 font-bold">
                {session.user.email}
              </p>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs text-red-500 mt-1 hover:underline"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* BUSCA */}
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar..."
          className="p-3 text-black rounded mb-6 w-full md:w-96"
        />

        {/* GRID */}
        <div className="grid gap-4">
          {loading ? (
            <p>Carregando...</p>
          ) : myFilteredRepos.map((repo) => (
            <div key={repo.id} className="border p-4 rounded">
              <Link href={`/repository/${repo.name}`}>
                {repo.name}
              </Link>

              <button onClick={() => copyToClipboard(repo.name)}>
                Clone
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}