import { useState, type FormEvent } from 'react';
import { useStock } from '../context/StockContext';
import type { Product } from '../data/mockData';
import { Search, AlertTriangle, Package, TrendingDown, DollarSign, Archive, Plus, Pencil, Trash2, X, FileSpreadsheet } from 'lucide-react';

type StatFilter = 'all' | 'low';

const EMPTY_FORM = { name: '', category: '', quantity: 0, minQuantity: 0, price: 0, unit: 'un' };

export default function Estoque() {
  const { products, addProduct, updateProduct, deleteProduct } = useStock();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [statFilter, setStatFilter] = useState<StatFilter>('all');

  const categories = [...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesStatFilter = statFilter === 'all' || (statFilter === 'low' && p.quantity <= p.minQuantity);
    return matchesSearch && matchesCategory && matchesStatFilter;
  });

  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
  const lowStockCount = products.filter(p => p.quantity <= p.minQuantity).length;

  function openAdd() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      minQuantity: product.minQuantity,
      price: product.price,
      unit: product.unit,
    });
    setShowModal(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingProduct) {
      updateProduct({ ...form, id: editingProduct.id });
    } else {
      addProduct(form);
    }
    setShowModal(false);
  }

  function handleDelete(id: number) {
    deleteProduct(id);
    setDeleteConfirm(null);
  }

  function handleStatClick(filter: StatFilter) {
    setStatFilter(prev => prev === filter ? 'all' : filter);
  }

  function exportToExcel() {
    const headers = ['Produto', 'Categoria', 'Quantidade', 'Qtd. Mínima', 'Unidade', 'Preço Unit.', 'Valor Total', 'Status'];
    const rows = filtered.map(p => [
      p.name,
      p.category,
      p.quantity,
      p.minQuantity,
      p.unit,
      p.price.toFixed(2).replace('.', ','),
      (p.quantity * p.price).toFixed(2).replace('.', ','),
      p.quantity <= p.minQuantity ? 'Estoque Baixo' : 'Normal'
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
    link.download = `estoque_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Estoque</h2>
          <p className="page-description">Gerencie todos os produtos do estoque</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={18} />
          Novo Produto
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Archive size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total de Produtos</span>
            <span className="stat-value">{products.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Package size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Itens em Estoque</span>
            <span className="stat-value">{totalItems.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <DollarSign size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Valor Total</span>
            <span className="stat-value">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div
          className={`stat-card clickable ${statFilter === 'low' ? 'active' : ''}`}
          onClick={() => handleStatClick('low')}
          title="Clique para filtrar produtos com estoque baixo"
        >
          <div className="stat-icon warning">
            <TrendingDown size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Estoque Baixo</span>
            <span className="stat-value">{lowStockCount}</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas as categorias</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="btn-secondary" onClick={exportToExcel}>
            <FileSpreadsheet size={18} />
            Exportar Excel
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Qtd.</th>
              <th>Mín.</th>
              <th>Unidade</th>
              <th>Preço Unit.</th>
              <th>Valor Total</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => {
              const isLow = product.quantity <= product.minQuantity;
              return (
                <tr key={product.id}>
                  <td className="td-name">{product.name}</td>
                  <td><span className="badge">{product.category}</span></td>
                  <td className={isLow ? 'text-danger' : ''}>{product.quantity}</td>
                  <td>{product.minQuantity}</td>
                  <td>{product.unit}</td>
                  <td>R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>R$ {(product.quantity * product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>
                    {isLow ? (
                      <span className="status-badge low">
                        <AlertTriangle size={14} />
                        Baixo
                      </span>
                    ) : (
                      <span className="status-badge ok">Normal</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon edit" onClick={() => openEdit(product)} title="Editar">
                        <Pencil size={16} />
                      </button>
                      {deleteConfirm === product.id ? (
                        <div className="delete-confirm">
                          <button className="btn-icon danger" onClick={() => handleDelete(product.id)} title="Confirmar">
                            <Trash2 size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => setDeleteConfirm(null)} title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button className="btn-icon danger" onClick={() => setDeleteConfirm(product.id)} title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state">Nenhum produto encontrado.</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nome do Produto</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoria</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unidade</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    <option value="un">Unidade</option>
                    <option value="kit">Kit</option>
                    <option value="saco">Saco</option>
                    <option value="cx">Caixa</option>
                    <option value="m">Metro</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantidade</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Qtd. Mínima</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minQuantity}
                    onChange={e => setForm({ ...form, minQuantity: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Preço Unitário (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
