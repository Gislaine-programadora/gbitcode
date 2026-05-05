"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalResults, setGlobalResults] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

  const copy = (text) => {
    navigator.clipboard.writeText(text);
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
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black italic">
              GBITCODE<span className="text-blue-500">.</span>PLATFORM
            </h1>
            <p className="text-xs text-gray-500 font-mono">
              Sistema de versionamento distribuído
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowGuide(true)}
              className="bg-blue-600 px-4 py-2 rounded text-xs font-bold hover:bg-blue-500"
            >
              COMO USAR
            </button>

            <div className="text-right">
              <p className="text-xs text-gray-500">Usuário</p>
              <p className="text-sm text-blue-400 font-bold">
                {session.user.email}
              </p>
              <button
                onClick={() => signOut()}
                className="text-xs text-red-500 mt-2 hover:underline"
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

      {/* MODAL */}
      {showGuide && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-[#0D1117] border border-white/10 p-6 rounded-2xl w-full max-w-xl text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-3 right-3 text-red-500"
            >
              ✖
            </button>

            <h2 className="text-xl font-black mb-4 text-blue-400">
              🚀 Como usar o Gbitcode
            </h2>

            <ol className="text-sm space-y-4">
              <li>
                <strong>1. Vá até seu projeto</strong>
                <p className="text-gray-400 text-xs">
                  Abra o terminal na pasta do seu projeto
                </p>
              </li>

              <li>
                <strong>2. Instale a CLI</strong>
                <div className="flex justify-between bg-black p-2 rounded mt-1">
                  <code>npm install -g gbitcode-cli</code>
                  <button onClick={() => copy("npm install -g gbitcode-cli")}>📋</button>
                </div>
              </li>

              <li>
                <strong>3. Faça login</strong>
                <div className="flex justify-between bg-black p-2 rounded mt-1">
                  <code>gbitcode login</code>
                  <button onClick={() => copy("gbitcode login")}>📋</button>
                </div>
              </li>

              <li>
                <strong>4. Envie seu projeto</strong>
                <div className="flex justify-between bg-black p-2 rounded mt-1">
                  <code>gbitcode commit "meu projeto"</code>
                  <button onClick={() => copy('gbitcode commit "meu projeto"')}>📋</button>
                </div>
              </li>

              <li>
                <strong>5. Pronto 🎉</strong>
                <p className="text-gray-400 text-xs">
                  Veja seus códigos no site
                </p>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}