import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <div className="layout">
      <TopBar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
