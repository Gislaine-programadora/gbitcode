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

  const userEmail = session?.user?.email;

  // ✅ TODOS OS HOOKS PRIMEIRO (REGRA DO REACT)

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

  // 🔒 AGORA SIM pode usar return condicional

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <button onClick={() => signIn("google")}>
          Login com Google
        </button>
      </div>
    );
  }

  const myFilteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (repoName) => {
    navigator.clipboard.writeText(`gbitcode clone ${repoName}`);
    alert("Copiado!");
  };

  return (
    <div className="p-8 text-white bg-black min-h-screen">

      <h1 className="text-2xl mb-6">Dashboard</h1>

      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar..."
        className="p-2 text-black mb-4"
      />

      {globalResults.map(repo => (
        <div key={repo.id}>{repo.name}</div>
      ))}

      <h2 className="mt-6 mb-2">Meus Repos</h2>

      {loading ? (
        <p>Carregando...</p>
      ) : myFilteredRepos.map(repo => (
        <div key={repo.id} className="mb-2">
          <Link href={`/repository/${repo.name}`}>
            {repo.name}
          </Link>

          <button onClick={() => copyToClipboard(repo.name)}>
            Clone
          </button>
        </div>
      ))}

      <button onClick={() => signOut()} className="mt-6">
        Sair
      </button>

    </div>
  );
}