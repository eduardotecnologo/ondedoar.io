import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="text-2xl font-black text-blue-600 tracking-tight">
          ondedoar<span className="text-slate-400">.io</span>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-md">
          Cadastrar Ponto
        </button>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
          Sua doação transforma <span className="text-blue-600">vidas.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          Encontre pontos de coleta de alimentos, roupas e remédios perto de você em segundos.
        </p>
        
        {/* Barra de Busca Gigante */}
        <div className="max-w-3xl mx-auto relative group">
          <input 
            type="text" 
            placeholder="Digite sua cidade ou o que deseja doar..." 
            className="w-full p-5 pl-6 pr-32 text-lg border-2 border-slate-200 rounded-2xl shadow-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
          />
          <button className="absolute right-3 top-3 bottom-3 bg-blue-600 text-white px-8 rounded-xl font-bold hover:bg-blue-700 transition-colors">
            Buscar
          </button>
        </div>
      </section>

      {/* Categorias Rápidas */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Alimentos', 'Roupas', 'Remédios', 'Higiene'].map((cat) => (
            <div key={cat} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 text-xl">♥</span>
              </div>
              <span className="font-bold text-slate-700">{cat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Simples */}
      <footer className="border-t border-slate-200 py-10 text-center text-slate-400 text-sm">
        © 2026 ondedoar.io • Feito para ajudar quem precisa.
      </footer>
    </div>
  );
}