import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/estoque");
      } else {
        setError("E-mail ou senha inválidos.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-brand">
          <div className="login-brand-text">
            <p className="login-eyebrow">Euro Grill</p>
            <h1>Gestão de Estoque</h1>
            <p className="login-subtitle">
              Controle corporativo para decisões mais rápidas.
            </p>
          </div>
          <div className="login-badges">
            <span>Inventário</span>
            <span>Compras</span>
            <span>Vendas</span>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-panel-header">
            <h2>Entrar</h2>
            <p>Acesse o painel de gestão</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>

            <div className="login-hint">
              <p>
                <strong>Demo:</strong> admin@eurogrill.com / euro123
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
