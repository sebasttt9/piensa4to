import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export type LoginFormProps = {
  email: string;
  password: string;
  error: string | null;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
};

export function LoginForm({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  className,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((previous) => !previous);
  };

  return (
    <section className={clsx('login-card', className)}>
      <div className="login-card__header">
        <p className="login-card__welcome">BIENVENIDO</p>
        <h2 className="login-card__title">Inicia sesión con tus credenciales corporativas</h2>
        <p className="login-card__subtitle">Ingresa para administrar dashboards, datasets y reportes en tiempo real.</p>
      </div>

      <form onSubmit={onSubmit} className="login-form">
        <div className="login-field">
          <label className="login-label" htmlFor="email">
            Correo electrónico
          </label>
          <div className="login-input-wrapper">
            <Mail className="login-input-icon" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              className="login-input"
              placeholder="admin@datapulse.com"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="password">
            Contraseña
          </label>
          <div className="login-input-wrapper">
            <Lock className="login-input-icon" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="login-input"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="login-toggle"
              onClick={handleTogglePassword}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="login-form__actions">
          <label className="login-checkbox">
            <input type="checkbox" />
            <span>Recordarme</span>
          </label>
          <Link to="/recover" className="login-link">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-submit" disabled={loading}>
          {loading ? 'Verificando credenciales…' : 'Ingresar a DataPulse'}
        </button>
      </form>

      <div className="login-divider">Demo</div>

      <div className="login-demo">
        <strong>Usa las credenciales precargadas</strong>
        <span>admin@datapulse.com / datapulse123</span>
      </div>

      <div className="login-meta">
        ¿No tienes una cuenta?{' '}
        <Link to="/register" className="login-link">
          Regístrate gratis
        </Link>
      </div>

      <div className="login-legal">
        Al iniciar sesión aceptas nuestros términos de servicio y política de privacidad.
      </div>
    </section>
  );
}
