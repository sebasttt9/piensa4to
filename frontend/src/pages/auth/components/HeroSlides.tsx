import clsx from 'clsx';
import { Shield, BarChart3, Sparkles, Rocket, Cpu, type LucideIcon } from 'lucide-react';

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: Shield,
    title: 'Seguridad reforzada',
    description: 'Autenticación con JWT, auditoría y cifrado extremo a extremo para tus datos.',
  },
  {
    icon: BarChart3,
    title: 'Dashboards listos',
    description: 'Visualiza métricas críticas del negocio con plantillas interactivas y compartibles.',
  },
  {
    icon: Rocket,
    title: 'Onboarding rápido',
    description: 'Conecta datasets en minutos y automatiza reportes recurrentes para tu equipo.',
  },
  {
    icon: Cpu,
    title: 'Decisiones con impacto',
    description: 'Pronósticos de demanda y alertas de inventario en tiempo real impulsados por IA.',
  },
];

type HeroSlidesProps = {
  className?: string;
};

export function HeroSlides({ className }: HeroSlidesProps) {
  return (
    <section className={clsx('login-hero', className)}>
      <div className="login-brand">
        <div className="login-brand__mark">
          <Sparkles />
        </div>
        <div className="login-brand__text">
          <h2 className="login-brand__title">DataPulse</h2>
          <p className="login-brand__subtitle">Analytics Pro</p>
        </div>
      </div>

      <div className="login-hero__heading">
        <h1 className="login-hero__title">Controla todo desde un panel inteligente</h1>
        <p className="login-hero__copy">
          Conecta tus datos, automatiza análisis y comparte dashboards listos para tu equipo en tiempo real.
        </p>
      </div>

      <div className="login-features">
        {features.map(({ icon: Icon, title, description }) => (
          <article key={title} className="login-feature">
            <span className="login-feature__icon">
              <Icon size={22} />
            </span>
            <h3 className="login-feature__title">{title}</h3>
            <p className="login-feature__copy">{description}</p>
          </article>
        ))}
      </div>

      <footer className="login-legal">
        © 2024 DataPulse. Todos los derechos reservados.
      </footer>
    </section>
  );
}
