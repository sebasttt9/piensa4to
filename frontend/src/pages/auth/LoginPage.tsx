import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HeroSlides } from './components/HeroSlides';
import { LoginForm } from './components/LoginForm';
import './login.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await signIn(email, password);
      navigate('/app/overview');
    } catch (err) {
      if (err instanceof Error) {
        // Check if it's a pending approval error
        if (err.message.includes('pendiente de aprobación') || err.message.includes('pending')) {
          navigate('/pending-approval');
          return;
        }
        setError(err.message);
        return;
      }
      setError('No pudimos iniciar sesión. Inténtalo nuevamente.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-hero">
          <HeroSlides />
        </div>

        <div className="login-panel">
          <LoginForm
            email={email}
            password={password}
            error={error}
            loading={loading}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;