import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, ClipboardList, ShoppingCart, FileText, LogOut, User } from 'lucide-react';

export default function TopBar() {
  const { userName, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">
          <span>Euro Grill</span>
        </div>

        <nav className="topbar-nav">
          <NavLink to="/estoque" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Package size={18} />
            <span>Estoque</span>
          </NavLink>
          <NavLink to="/controle" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <ClipboardList size={18} />
            <span>Controle</span>
          </NavLink>
          <NavLink to="/vendas" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <ShoppingCart size={18} />
            <span>Vendas</span>
          </NavLink>
          <NavLink to="/orcamentos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <FileText size={18} />
            <span>Orçamentos</span>
          </NavLink>
        </nav>
      </div>

      <div className="topbar-right">
        <div className="topbar-user">
          <User size={18} />
          <span>{userName}</span>
        </div>
        <button onClick={handleLogout} className="btn-logout" title="Sair">
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
