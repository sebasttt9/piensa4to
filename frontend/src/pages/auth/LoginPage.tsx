import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Shield,
  BarChart3,
  Zap,
  TrendingUp,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const featureHighlights = [
  {
    title: 'Seguridad reforzada',
    description: 'Autenticación con JWT, auditoría y cifrado extremo a extremo.',
    icon: Shield,
    iconGradient: 'from-blue-400 via-indigo-500 to-sky-400',
    cardGradient: 'from-[#142c5c] via-[#15254a] to-[#101c36]',
  },
  {
    title: 'Dashboards listos',
    description: 'Visualiza métricas críticas con plantillas preconfiguradas y adaptables.',
    icon: BarChart3,
    iconGradient: 'from-fuchsia-500 via-violet-500 to-purple-400',
    cardGradient: 'from-[#241d5c] via-[#1e2364] to-[#151840]',
  },
  {
    title: 'Onboarding rápido',
    description: 'Conecta datasets en minutos y automatiza reportes semanales.',
    icon: Zap,
    iconGradient: 'from-purple-400 via-pink-500 to-rose-400',
    cardGradient: 'from-[#2b1f52] via-[#1d1f4a] to-[#121534]',
  },
  {
    title: 'Decisiones con impacto',
    description: 'Pronósticos de demanda y alertas operativas en tiempo real.',
    icon: TrendingUp,
    iconGradient: 'from-emerald-400 via-teal-500 to-sky-400',
    cardGradient: 'from-[#153c4d] via-[#112f40] to-[#0b2030]',
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('admin@datapulse.com');
  const [password, setPassword] = useState('datapulse123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await signIn(email, password);
      navigate('/app/overview');
    } catch (err) {
      console.error(err);
      setError('No pudimos iniciar sesión. Inténtalo nuevamente.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#050d2a] via-[#111d4a] to-[#1c1042] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(109,76,255,0.45),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.35),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[-40%] h-[480px] bg-[radial-gradient(circle,_rgba(255,255,255,0.15),_transparent_65%)] blur-3xl" />

      <div className="relative z-10 grid w-full max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1.25fr)_400px]">
        <section className="space-y-10">
          <header className="space-y-6">
            <div className="flex items-center gap-4 rounded-3xl bg-white/5 px-5 py-3 backdrop-blur">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/40">
                <Activity className="h-7 w-7" />
              </div>
              <div>
                <p className="bg-gradient-to-r from-white via-violet-100 to-blue-200 bg-clip-text text-2xl font-semibold text-transparent">
                  DataPulse
                </p>
                <p className="text-sm text-slate-300">Analytics Pro</p>
              </div>
            </div>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-white md:text-5xl">
                Controla todo tu negocio desde un panel inteligente
              </h1>
              <p className="max-w-2xl text-base text-slate-200/90">
                Conecta tus datos, automatiza análisis y comparte dashboards listos para tu equipo.
                Mantén la seguridad, acelera el onboarding y toma decisiones informadas en tiempo real
                con DataPulse Analytics Pro.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {featureHighlights.map(({ title, description, icon: Icon, iconGradient, cardGradient }) => (
              <article
                key={title}
                className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${cardGradient} p-6 shadow-[0_24px_60px_-24px_rgba(14,24,52,0.8)] transition duration-300 hover:border-white/20 hover:shadow-[0_28px_80px_-20px_rgba(87,70,187,0.6)]`}
              >
                <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/5" />
                <div className="relative z-10">
                  <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${iconGradient} text-white shadow-lg shadow-black/40`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200/90">{description}</p>
                </div>
                <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-white/5 blur-3xl transition duration-300 group-hover:translate-x-4 group-hover:-translate-y-2" />
                <div className="pointer-events-none absolute -bottom-16 -left-20 h-40 w-40 rounded-full bg-violet-500/20 blur-[100px] transition duration-300 group-hover:translate-y-4 group-hover:translate-x-4" />
              </article>
            ))}
          </div>
        </section>

        <aside className="relative">
          <div className="absolute inset-0 -translate-x-4 rounded-[36px] bg-[radial-gradient(circle_at_top,_rgba(147,112,255,0.28),_transparent_65%)] blur-3xl lg:-translate-x-6" />
          <div className="relative rounded-[36px] border border-white/10 bg-gradient-to-br from-[#121d46]/95 via-[#151749]/90 to-[#1e114b]/90 p-8 shadow-[0_30px_60px_-18px_rgba(17,17,45,0.85)] backdrop-blur-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-semibold text-white">Bienvenido</h2>
              <p className="mt-2 text-sm text-slate-200">
                Inicia sesión con tus credenciales corporativas para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-100">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@datapulse.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-100">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-12 text-white placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-500 bg-white/10 text-violet-500 focus:ring-2 focus:ring-violet-500/50"
                  />
                  Recordarme
                </label>
                <button type="button" className="font-medium text-violet-300 transition hover:text-violet-200">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
                )}
                {loading ? 'Verificando…' : 'Ingresar a DataPulse'}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-violet-400/20 bg-gradient-to-r from-[rgba(31,27,77,0.7)] via-[rgba(27,38,89,0.7)] to-[rgba(20,37,79,0.7)] p-4 text-sm text-slate-200">
              <p className="font-semibold text-blue-100">💡 Demo: Usa las credenciales precargadas</p>
              <p className="mt-1 font-mono text-xs text-blue-200/80">admin@datapulse.com / datapulse123</p>
            </div>

            <p className="mt-6 text-center text-sm text-slate-300">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="font-semibold text-violet-300 transition hover:text-violet-200">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </aside>
      </div>

      <footer className="absolute bottom-6 w-full text-center text-xs text-slate-400">
        © 2024 DataPulse. Todos los derechos reservados.
      </footer>
    </div>
  );
}
