import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloudUpload, LayoutDashboard, LineChart, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './register.css';

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

  const primaryHighlights = [
    {
      icon: LineChart,
      title: 'Insights automatizados',
      description: 'Modelos sugeridos, KPI clave y alertas inteligentes listas para tus stakeholders.',
    },
    {
      icon: LayoutDashboard,
      title: 'Dashboards colaborativos',
      description: 'Versiona, comparte y comenta tableros con controles de Supabase Auth.',
    },
    {
      icon: Sparkles,
      title: 'Onboarding express',
      description: 'Importa datos y publica reportes en minutos con asistentes guiados.',
    },
  ];

  const secondaryHighlights = [
    {
      icon: CloudUpload,
      title: 'Carga inteligente',
      description: 'Detecta duplicados, limpia columnas y crea jobs de actualización automática.',
      accent: 'from-sky-500/15 to-indigo-500/15',
    },
    {
      icon: ShieldCheck,
      title: 'Seguridad empresarial',
      description: 'JWT firmado, secretos cifrados y bitácoras de acceso centralizadas.',
      accent: 'from-emerald-500/15 to-teal-500/15',
    },
  ];

  const quickStats = [
    { value: '120+', label: 'Equipos en producción' },
    { value: '24/7', label: 'Soporte prioritario' },
    { value: '99.9%', label: 'Disponibilidad promedio' },
  ];

  return (
    <div className="register-page">
      <div className="register-shell">
        <section className="register-hero">
          <div className="space-y-4">
            <h1 className="register-title text-4xl leading-tight tracking-tight sm:text-5xl">
              Crea un espacio profesional para tu equipo de datos
            </h1>
            <p className="register-subtitle text-base">
              Centraliza dashboards, reportes y automatizaciones respaldadas por Supabase Postgres. Diseñado para líderes que requieren decisiones con precisión y velocidad.
            </p>
          </div>

          <div className="register-features">
            {primaryHighlights.map(({ icon: Icon, title, description }) => (
              <article key={title} className="register-feature">
                <span className="register-feature-icon">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="register-feature-title text-sm">{title}</h2>
                <p className="register-feature-text">{description}</p>
              </article>
            ))}
          </div>

          <div className="register-stats">
            {quickStats.map(({ value, label }) => (
              <div key={label} className="register-stat">
                <span className="register-stat-value text-xl sm:text-2xl">{value}</span>
                <span className="register-stat-label">{label}</span>
              </div>
            ))}
          </div>

          <p className="register-footnote">
            Equipos de BI, marketing y operaciones aceleran la toma de decisiones con espacios compartidos, gobernanza y automatizaciones listas para producción.
          </p>
        </section>

        <section className="register-form-panel">
          <header className="register-form-header">
            <div>
              <p className="register-form-badge">Datapulse</p>
              <p className="register-form-subtitle">Suite analítica para equipos modernos</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-field">
              <label className="register-label" htmlFor="register-name">
                Nombre completo
              </label>
              <div className="register-input-wrapper">
                <input
                  id="register-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="register-input"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label className="register-label" htmlFor="register-email">
                Correo corporativo
              </label>
              <div className="register-input-wrapper">
                <input
                  id="register-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="register-input"
                  placeholder="tu@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label className="register-label" htmlFor="register-password">
                Contraseña
              </label>
              <div className="register-input-wrapper">
                <input
                  id="register-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="register-input"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            {error && <p className="register-error">{error}</p>}

            <button type="submit" disabled={loading} className="register-submit flex items-center justify-center gap-2">
              <span>{loading ? 'Creando workspace...' : 'Crear cuenta y continuar'}</span>
              <Sparkles className="h-4 w-4" />
            </button>
          </form>

          <section className="register-secondary-list">
            {secondaryHighlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="register-secondary-item">
                <span className="register-secondary-icon">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="register-secondary-title">{title}</p>
                  <p className="register-secondary-text">{description}</p>
                </div>
              </div>
            ))}

            <p className="register-login-prompt">
              ¿Ya tienes cuenta?
              <Link to="/login" className="register-login-link">
                Inicia sesión
              </Link>
            </p>
          </section>
        </section>
      </div>
    </div>
  );
}
