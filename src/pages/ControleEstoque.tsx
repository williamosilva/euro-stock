import { useState, type FormEvent } from 'react';
import { useStock } from '../context/StockContext';
import { Plus, X, Search, ArrowDownCircle, ArrowUpCircle, Filter, FileSpreadsheet } from 'lucide-react';

export default function ControleEstoque() {
  const { products, movements, addMovement } = useStock();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'entrada' | 'saida'>('');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ productId: 0, type: 'entrada' as 'entrada' | 'saida', quantity: 1, date: today, notes: '' });

  const filtered = movements.filter(m => {
    const matchesSearch = m.productName.toLowerCase().includes(search.toLowerCase()) || m.notes.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalEntradas = movements.filter(m => m.type === 'entrada').reduce((s, m) => s + m.quantity, 0);
  const totalSaidas = movements.filter(m => m.type === 'saida').reduce((s, m) => s + m.quantity, 0);

  function openModal() {
    setForm({ productId: products[0]?.id || 0, type: 'entrada', quantity: 1, date: today, notes: '' });
    setShowModal(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const product = products.find(p => p.id === form.productId);
    if (!product) return;

    if (form.type === 'saida' && form.quantity > product.quantity) {
      alert(`Estoque insuficiente. Disponível: ${product.quantity} ${product.unit}`);
      return;
    }

    addMovement({
      productId: form.productId,
      productName: product.name,
      type: form.type,
      quantity: form.quantity,
      date: form.date,
      notes: form.notes,
    });
    setShowModal(false);
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function handleCardClick(type: '' | 'entrada' | 'saida') {
    setTypeFilter(prev => prev === type ? '' : type);
  }

  function exportToExcel() {
    const headers = ['Data', 'Tipo', 'Produto', 'Quantidade', 'Observação'];
    const rows = filtered.map(m => [
      formatDate(m.date),
      m.type === 'entrada' ? 'Entrada' : 'Saída',
      m.productName,
      m.quantity,
      m.notes
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Controle de Estoque</h2>
          <p className="page-description">Registre entradas e saídas de produtos</p>
        </div>
        <button className="btn-primary" onClick={openModal}>
          <Plus size={18} />
          Nova Movimentação
        </button>
      </div>

      <div className="stats-grid stats-grid-2">
        <div
          className={`stat-card clickable ${typeFilter === 'entrada' ? 'active' : ''}`}
          onClick={() => handleCardClick('entrada')}
          title="Clique para filtrar entradas"
        >
          <div className="stat-icon success">
            <ArrowDownCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Entradas</span>
            <span className="stat-value">{totalEntradas.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <div
          className={`stat-card clickable ${typeFilter === 'saida' ? 'active' : ''}`}
          onClick={() => handleCardClick('saida')}
          title="Clique para filtrar saídas"
        >
          <div className="stat-icon">
            <ArrowUpCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Saídas</span>
            <span className="stat-value">{totalSaidas.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por produto ou observação..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as '' | 'entrada' | 'saida')}
              className="filter-select"
            >
              <option value="">Todos os tipos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>
          <button className="btn-secondary" onClick={exportToExcel}>
            <FileSpreadsheet size={18} />
            Exportar Excel
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(movement => (
              <tr key={movement.id}>
                <td>{formatDate(movement.date)}</td>
                <td>
                  <span className={`movement-badge ${movement.type}`}>
                    {movement.type === 'entrada' ? (
                      <><ArrowDownCircle size={14} /> Entrada</>
                    ) : (
                      <><ArrowUpCircle size={14} /> Saída</>
                    )}
                  </span>
                </td>
                <td className="td-name">{movement.productName}</td>
                <td>{movement.quantity}</td>
                <td className="td-notes">{movement.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state">Nenhuma movimentação encontrada.</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova Movimentação</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Tipo de Movimentação</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${form.type === 'entrada' ? 'active entrada' : ''}`}
                    onClick={() => setForm({ ...form, type: 'entrada' })}
                  >
                    <ArrowDownCircle size={16} />
                    Entrada
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${form.type === 'saida' ? 'active saida' : ''}`}
                    onClick={() => setForm({ ...form, type: 'saida' })}
                  >
                    <ArrowUpCircle size={16} />
                    Saída
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Produto</label>
                <select
                  value={form.productId}
                  onChange={e => setForm({ ...form, productId: Number(e.target.value) })}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Estoque: {p.quantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observação</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex: Recebimento do fornecedor, venda balcão..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={`btn-primary ${form.type === 'entrada' ? 'btn-success' : ''}`}>
                  Registrar {form.type === 'entrada' ? 'Entrada' : 'Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
