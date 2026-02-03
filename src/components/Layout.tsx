import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopBar from './TopBar';

export default function Layout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="layout">
      <TopBar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
