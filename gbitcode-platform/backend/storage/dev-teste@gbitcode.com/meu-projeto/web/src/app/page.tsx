import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black -z-10"></div>
      <main className="text-center">
        <h1 className="text-6xl font-black tracking-tighter mb-4 italic">
          WEB3<span className="text-blue-500">GBIT</span>
        </h1>
        <p className="text-slate-400 text-xl mb-8">Sua infraestrutura Web3 está forjada e pronta.</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105">
          Conectar Carteira GBIT
        </button>
      </main>
    </div>
  );
}