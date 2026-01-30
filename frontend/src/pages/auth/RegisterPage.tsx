import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloudUpload, LayoutDashboard, LineChart, ShieldCheck, Sparkles, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './register.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setShowConfirmModal(true);
  };

  const handleConfirmRegistration = async () => {
    setShowConfirmModal(false);
    try {
      await register(form);
      // Mostrar mensaje de éxito y redirigir al login
      alert('✅ Solicitud enviada exitosamente. El administrador revisará tu cuenta y te notificará cuando sea activada.');
      navigate('/login');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        return;
      }
      setError('No pudimos procesar tu solicitud. Inténtalo nuevamente.');
    }
  };

  const handleCancelRegistration = () => {
    setShowConfirmModal(false);
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

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="register-modal-overlay" onClick={handleCancelRegistration}>
          <div className="register-modal" onClick={(e) => e.stopPropagation()}>
            <div className="register-modal-header">
              <div className="register-modal-icon">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <button
                onClick={handleCancelRegistration}
                className="register-modal-close"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="register-modal-content">
              <h3 className="register-modal-title">Confirmar solicitud de cuenta</h3>
              <p className="register-modal-text">
                Tu solicitud de cuenta será enviada para revisión. El administrador
                revisará tu información y te notificará cuando tu cuenta sea activada.
                Una vez aprobada, podrás acceder a todas las funcionalidades de DataPulse.
              </p>

              <div className="register-modal-notice">
                <div className="register-modal-notice-icon">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                </div>
                <p className="register-modal-notice-text">
                  <strong>Nota:</strong> Todas las cuentas nuevas requieren aprobación
                  administrativa antes de ser activadas.
                </p>
              </div>

              <div className="register-modal-details">
                <div className="register-modal-detail">
                  <span className="register-modal-label">Nombre:</span>
                  <span className="register-modal-value">{form.name}</span>
                </div>
                <div className="register-modal-detail">
                  <span className="register-modal-label">Correo:</span>
                  <span className="register-modal-value">{form.email}</span>
                </div>
              </div>
            </div>

            <div className="register-modal-actions">
              <button
                onClick={handleCancelRegistration}
                className="register-modal-cancel"
                disabled={loading}
              >
                Revisar datos
              </button>
              <button
                onClick={handleConfirmRegistration}
                className="register-modal-confirm"
                disabled={loading}
              >
                {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
