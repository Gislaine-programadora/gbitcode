"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const guideRef = useRef(null);
  const userEmail = session?.user?.email;

  // ---------------- HOOKS ----------------

  useEffect(() => setMounted(true), []);

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [userEmail]);

  // FECHAR CARD AO CLICAR FORA
  useEffect(() => {
    const handleClick = (e) => {
      if (guideRef.current && !guideRef.current.contains(e.target)) {
        setShowGuide(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ---------------- PROTEÇÃO ----------------

  if (!mounted) return null;

  if (status === "loading") {
    return <p className="text-white">Carregando...</p>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-3xl mb-4">GBITCODE</h1>

        <button
          onClick={async () => {
            await signOut({ redirect: false });

            // 🔥 FORÇA ESCOLHER CONTA
            window.location.href = "/api/auth/signin?prompt=select_account";
          }}
          className="bg-white text-black px-6 py-3 rounded"
        >
          Login com Google
        </button>
      </div>
    );
  }

  // ---------------- FUNÇÕES ----------------

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copy = (text) => navigator.clipboard.writeText(text);

  // ---------------- UI ----------------

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <header className="flex justify-between items-center mb-10">

          <h1 className="text-2xl font-bold">GBITCODE</h1>

          <div className="flex items-center gap-4">

            {/* BOTÃO + CARD */}
            <div className="relative" ref={guideRef}>

              <button
                onClick={() => setShowGuide(!showGuide)}
                className="bg-blue-600 px-4 py-2 rounded text-xs"
              >
                COMO USAR
              </button>

              {showGuide && (
                <div className="absolute top-full right-0 mt-2 w-[300px] bg-[#111] border p-4 rounded z-50">

                  <p className="mb-2 text-sm text-blue-400">Guia</p>

                  <div className="space-y-3 text-xs">

                    <div>
                      <code>npm install -g gbitcode-cli</code>
                      <button onClick={() => copy("npm install -g gbitcode-cli")}>📋</button>
                    </div>

                    <div>
                      <code>gbitcode login</code>
                      <button onClick={() => copy("gbitcode login")}>📋</button>
                    </div>

                    <div>
                      <code>gbitcode commit "meu projeto"</code>
                      <button onClick={() => copy('gbitcode commit "meu projeto"')}>📋</button>
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* USER */}
            <div>
              <p className="text-xs">{session.user.email}</p>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-500 text-xs"
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
          className="p-2 text-black mb-6 w-full"
        />

        {/* LISTA */}
        <div className="space-y-2">
          {loading ? (
            <p>Carregando...</p>
          ) : (
            filtered.map((repo) => (
              <div key={repo.id} className="border p-3 flex justify-between">
                <Link href={`/repository/${repo.name}`}>
                  {repo.name}
                </Link>

                <button onClick={() => copy(`gbitcode clone ${repo.name}`)}>
                  Clone
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}