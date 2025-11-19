import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await register(form);
      navigate('/app/overview');
    } catch (err) {
      console.error(err);
      setError('No pudimos crear tu cuenta. Inténtalo nuevamente.');
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 lg:grid-cols-[0.9fr_1.1fr]">
      <main className="flex items-center justify-center px-6 py-16 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-900/40 text-white font-bold">
                DP
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">DataPulse</p>
                <p className="text-xs text-white/50">Dashboard inteligente para análisis empresarial</p>
              </div>
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-white">Crea tu cuenta</h2>
            <p className="mt-2 text-sm text-white/50">Configura tu espacio de trabajo y comienza a conectar datasets.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-white/80">Nombre completo</label>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-purple-500/50 focus:bg-white/10 focus:outline-none backdrop-blur-sm"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/80">Correo corporativo</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-purple-500/50 focus:bg-white/10 focus:outline-none backdrop-blur-sm"
                placeholder="tu@empresa.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/80">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-purple-500/50 focus:bg-white/10 focus:outline-none backdrop-blur-sm"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            {error && (
              <p className="rounded-xl bg-gradient-to-r from-red-500/20 to-rose-500/20 px-4 py-3 text-sm font-semibold text-red-300 border border-red-500/30">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px]"
            >
              {loading ? 'Creando workspace...' : 'Crear cuenta y continuar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent hover:from-purple-200 hover:to-blue-200 transition-all">
              Inicia sesión
            </Link>
          </p>
        </div>
      </main>

      <section className="hidden flex-col justify-between bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 px-16 py-14 text-white lg:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Onboarding DataPulse</p>
          <h2 className="mt-6 text-4xl font-semibold leading-tight">
            Carga un archivo, detecta patrones y comparte dashboards automáticos en minutos.
          </h2>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl bg-white/15 p-4 backdrop-blur">
            <p className="text-xs text-white/80">Conecta MongoDB Atlas o usa archivos locales. Exporta reportes a PDF o Excel en un clic.</p>
          </div>
          <p className="text-xs text-white/50">Infraestructura preparada para Railway & Vercel • Roles admin y analista con JWT</p>
        </div>
      </section>
    </div>
  );
}
