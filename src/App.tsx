import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StockProvider } from './context/StockContext';
import Login from './pages/Login';
import Estoque from './pages/Estoque';
import ControleEstoque from './pages/ControleEstoque';
import Vendas from './pages/Vendas';
import Orcamentos from './pages/Orcamentos';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <StockProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/controle" element={<ControleEstoque />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/orcamentos" element={<Orcamentos />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StockProvider>
    </AuthProvider>
  );
}

export default App;
