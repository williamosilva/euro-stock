import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Flame, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/estoque');
      } else {
        setError('E-mail ou senha inválidos.');
      }
    } catch {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Flame size={36} />
          </div>
          <h1>Euro Grill</h1>
          <p className="login-subtitle">Sistema de Gestão de Estoque</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>

          <div className="login-hint">
            <p><strong>Demo:</strong> admin@eurogrill.com / euro123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
