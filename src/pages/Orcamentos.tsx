import { useState, type FormEvent } from 'react';
import { useStock } from '../context/StockContext';
import type { QuoteItem, PaymentCondition, Quote } from '../data/mockData';
import { Plus, X, FileText, Trash2, Percent, MessageSquare, Edit3, FileDown, Search, FileSpreadsheet } from 'lucide-react';
import QuotePDF from '../components/QuotePDF';

const PAYMENT_METHODS = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Transferência Bancária', 'Dinheiro'];

export default function Orcamentos() {
  const { products, quotes, addQuote } = useStock();
  const [showModal, setShowModal] = useState(false);
  const [pdfQuote, setPdfQuote] = useState<Quote | null>(null);
  const [search, setSearch] = useState('');

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.customer.toLowerCase().includes(search.toLowerCase()) ||
      q.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const today = new Date().toISOString().split('T')[0];
  const defaultValidUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(today);
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [observation, setObservation] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<PaymentCondition[]>([]);

  // Add item form
  const [selectedProductId, setSelectedProductId] = useState(0);
  const [selectedQty, setSelectedQty] = useState(1);

  // Add payment condition form
  const [condMethod, setCondMethod] = useState(PAYMENT_METHODS[0]);
  const [condInstallments, setCondInstallments] = useState(1);
  const [condDiscount, setCondDiscount] = useState(0);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  function openModal() {
    setCustomer('');
    setDate(today);
    setValidUntil(defaultValidUntil);
    setObservation('');
    setItems([]);
    setPaymentConditions([]);
    setSelectedProductId(products[0]?.id || 0);
    setSelectedQty(1);
    setCondMethod(PAYMENT_METHODS[0]);
    setCondInstallments(1);
    setCondDiscount(0);
    setShowModal(true);
  }

  function addItem() {
    const product = products.find(p => p.id === selectedProductId);
    if (!product || selectedQty <= 0) return;

    const existing = items.find(i => i.productId === selectedProductId);
    if (existing) {
      setItems(items.map(i =>
        i.productId === selectedProductId
          ? { ...i, quantity: i.quantity + selectedQty }
          : i
      ));
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        quantity: selectedQty,
        unitPrice: product.price,
        originalPrice: product.price,
        observation: '',
      }]);
    }
    setSelectedQty(1);
  }

  function updateItem(index: number, field: keyof QuoteItem, value: string | number) {
    setItems(items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function addPaymentCondition() {
    if (subtotal <= 0) return;
    const finalValue = subtotal * (1 - condDiscount / 100);
    setPaymentConditions([...paymentConditions, {
      method: condMethod,
      installments: condInstallments,
      discount: condDiscount,
      finalValue,
    }]);
    setCondDiscount(0);
    setCondInstallments(1);
  }

  function removePaymentCondition(index: number) {
    setPaymentConditions(paymentConditions.filter((_, i) => i !== index));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!customer.trim() || items.length === 0 || paymentConditions.length === 0) {
      alert('Preencha o cliente, adicione itens e pelo menos uma condição de pagamento.');
      return;
    }
    addQuote(customer, date, validUntil, items, observation, paymentConditions);
    setShowModal(false);
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function exportToExcel() {
    const headers = ['#', 'Data', 'Cliente', 'Itens', 'Subtotal', 'Validade', 'Observação'];
    const rows = filteredQuotes.map(q => [
      q.id,
      formatDate(q.date),
      q.customer,
      q.items.map(i => `${i.quantity}x ${i.productName}`).join(', '),
      q.subtotal.toFixed(2).replace('.', ','),
      formatDate(q.validUntil),
      q.observation
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
    link.download = `orcamentos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Orçamentos</h2>
          <p className="page-description">Crie e gerencie orçamentos para clientes</p>
        </div>
        <button className="btn-primary" onClick={openModal}>
          <Plus size={18} />
          Novo Orçamento
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente ou produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-secondary" onClick={exportToExcel}>
            <FileSpreadsheet size={18} />
            Exportar Excel
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Data</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Subtotal</th>
              <th>Validade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">Nenhum orçamento encontrado.</div>
                </td>
              </tr>
            ) : (
              filteredQuotes.map(quote => (
                <tr key={quote.id}>
                  <td className="td-name">#{quote.id}</td>
                  <td>{formatDate(quote.date)}</td>
                  <td>{quote.customer}</td>
                  <td>
                    <div className="sale-items-list">
                      {quote.items.slice(0, 2).map((item, idx) => (
                        <span key={idx} className="badge">{item.quantity}x {item.productName}</span>
                      ))}
                      {quote.items.length > 2 && <span className="badge">+{quote.items.length - 2}</span>}
                    </div>
                  </td>
                  <td className="td-name">R$ {quote.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>{formatDate(quote.validUntil)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon edit"
                        onClick={() => setPdfQuote(quote)}
                        title="Exportar PDF"
                      >
                        <FileDown size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Novo Orçamento</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {/* Customer and Dates */}
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label>Cliente *</label>
                  <input
                    type="text"
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Válido até</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Add Item */}
              <div className="quote-section">
                <label className="section-label"><FileText size={16} /> Itens do Orçamento</label>
                <div className="sale-add-row">
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(Number(e.target.value))}
                    className="sale-product-select"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={e => setSelectedQty(Number(e.target.value))}
                    className="sale-qty-input"
                    placeholder="Qtd"
                  />
                  <button type="button" className="btn-primary btn-sm" onClick={addItem}>
                    <Plus size={16} />
                  </button>
                </div>

                {items.length > 0 && (
                  <div className="quote-items-list">
                    {items.map((item, idx) => (
                      <div key={idx} className="quote-item-card">
                        <div className="quote-item-header">
                          <span className="quote-item-name">{item.productName}</span>
                          <button type="button" className="btn-icon danger btn-xs" onClick={() => removeItem(idx)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="quote-item-fields">
                          <div className="quote-field">
                            <label>Qtd</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                            />
                          </div>
                          <div className="quote-field">
                            <label>Preço Unit.</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))}
                            />
                            {item.unitPrice !== item.originalPrice && (
                              <span className="price-diff">
                                <Edit3 size={12} /> Original: R$ {item.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="quote-field quote-field-obs">
                            <label>Observação</label>
                            <input
                              type="text"
                              value={item.observation}
                              onChange={e => updateItem(idx, 'observation', e.target.value)}
                              placeholder="Ex: Cor específica, tamanho..."
                            />
                          </div>
                        </div>
                        <div className="quote-item-subtotal">
                          Subtotal: <strong>R$ {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </div>
                      </div>
                    ))}
                    <div className="quote-total-bar">
                      <span>Total dos Itens:</span>
                      <strong>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* General Observation */}
              <div className="form-group">
                <label><MessageSquare size={14} /> Observação Geral</label>
                <textarea
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                  placeholder="Observações gerais do orçamento (frete, prazos, condições especiais...)"
                  rows={2}
                  className="textarea-field"
                />
              </div>

              {/* Payment Conditions */}
              <div className="quote-section">
                <label className="section-label"><Percent size={16} /> Condições de Pagamento</label>
                <div className="payment-condition-form">
                  <select
                    value={condMethod}
                    onChange={e => setCondMethod(e.target.value)}
                    className="filter-select"
                  >
                    {PAYMENT_METHODS.map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                  <div className="cond-field">
                    <label>Parcelas</label>
                    <select
                      value={condInstallments}
                      onChange={e => setCondInstallments(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>
                  <div className="cond-field">
                    <label>Desconto %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={condDiscount}
                      onChange={e => setCondDiscount(Number(e.target.value))}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={addPaymentCondition}
                    disabled={subtotal <= 0}
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>

                {paymentConditions.length > 0 && (
                  <div className="payment-conditions-list">
                    {paymentConditions.map((cond, idx) => (
                      <div key={idx} className="payment-condition-card">
                        <div className="cond-info">
                          <span className="cond-method">{cond.method}</span>
                          <span className="cond-details">
                            {cond.installments}x
                            {cond.discount > 0 && <span className="cond-discount"> (-{cond.discount}%)</span>}
                          </span>
                        </div>
                        <div className="cond-value">
                          R$ {cond.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          {cond.installments > 1 && (
                            <span className="cond-installment-value">
                              ({cond.installments}x de R$ {(cond.finalValue / cond.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </span>
                          )}
                        </div>
                        <button type="button" className="btn-icon danger btn-xs" onClick={() => removePaymentCondition(idx)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!customer.trim() || items.length === 0 || paymentConditions.length === 0}
                >
                  <FileText size={16} />
                  Criar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pdfQuote && (
        <QuotePDF quote={pdfQuote} onClose={() => setPdfQuote(null)} />
      )}
    </div>
  );
}
