import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useStock } from "../context/StockContext";
import { api } from "../services/api";
import type { SaleItem, Installment, Product } from "../data/mockData";
import {
  Plus,
  X,
  ShoppingCart,
  Trash2,
  DollarSign,
  Receipt,
  CreditCard,
  Calendar,
  Search,
  Filter,
  FileSpreadsheet,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAYMENT_METHODS = [
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "PIX",
  "Transferência Bancária",
  "Boleto",
];

interface PaginatedSalesResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Vendas() {
  const {
    products: rawProducts,
    addSale,
    loadingProducts,
    refreshProducts,
  } = useStock();

  // Garantir que products seja sempre um array válido
  const products: Product[] = Array.isArray(rawProducts)
    ? (rawProducts as Product[])
    : (rawProducts as PaginatedProductsResponse)?.data || [];

  // Paginação
  const [sales, setSales] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "" | "avista" | "parcelado" | "negociado"
  >("");

  const today = new Date().toISOString().split("T")[0];
  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [customPayment, setCustomPayment] = useState("");
  const [useCustomPayment, setUseCustomPayment] = useState(false);

  // Parcelas
  const [installmentType, setInstallmentType] = useState<
    "avista" | "parcelado" | "negociado"
  >("avista");
  const [numInstallments, setNumInstallments] = useState(2);
  const [negotiatedInstallments, setNegotiatedInstallments] = useState<
    Installment[]
  >([
    { number: 1, value: 0, dueDate: today },
    { number: 2, value: 0, dueDate: "" },
  ]);

  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(0);
  const [selectedQty, setSelectedQty] = useState(1);

  // Carregar produtos iniciais
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Carregar vendas com filtros
  const loadSales = useCallback(
    async (
      pageNum: number,
      pageLimit: number,
      paymentMethod?: string,
      installmentType?: string,
      customer?: string,
    ) => {
      if (!api.getToken()) return;
      setLoadingSales(true);
      try {
        const response = (await api.getSales(
          pageNum,
          pageLimit,
          paymentMethod || undefined,
          installmentType || undefined,
          customer || undefined,
          undefined, // productName - não implementado na UI ainda
        )) as PaginatedSalesResponse;
        setSales(response.data);
        setTotal(response.total);
        setTotalPages(response.totalPages);
        setPage(response.page);
      } catch (error) {
        console.error("Erro ao carregar vendas:", error);
      } finally {
        setLoadingSales(false);
      }
    },
    [],
  );

  // Carregar vendas quando mudar filtros ou limite
  useEffect(() => {
    loadSales(
      1,
      limit,
      paymentFilter || undefined,
      typeFilter || undefined,
      searchApplied || undefined,
    );
  }, [paymentFilter, typeFilter, searchApplied, limit, loadSales]);

  const totalVendas = sales.reduce((s, sale) => s + sale.total, 0);
  const saleTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  function openModal() {
    // Verificar se há produtos disponíveis
    if (!products || products.length === 0) {
      alert(
        "Nenhum produto encontrado. Adicione produtos primeiro no estoque.",
      );
      return;
    }

    setCustomer("");
    setDate(today);
    setPaymentMethod(PAYMENT_METHODS[0]);
    setCustomPayment("");
    setUseCustomPayment(false);
    setInstallmentType("avista");
    setNumInstallments(2);
    setNegotiatedInstallments([
      { number: 1, value: 0, dueDate: today },
      { number: 2, value: 0, dueDate: "" },
    ]);
    setItems([]);
    setSelectedProductId(products[0]?.id || 0);
    setSelectedQty(1);
    setShowModal(true);
  }

  function addItem() {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product || selectedQty <= 0) return;

    const existing = items.find((i) => i.productId === selectedProductId);
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === selectedProductId
            ? { ...i, quantity: i.quantity + selectedQty }
            : i,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          quantity: selectedQty,
          unitPrice: product.price,
        },
      ]);
    }
    setSelectedQty(1);
  }

  function removeItem(productId: number) {
    setItems(items.filter((i) => i.productId !== productId));
  }

  function addFutureDate(months: number): string {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
  }

  function generateRegularInstallments(): Installment[] {
    const valuePerInstallment = saleTotal / numInstallments;
    return Array.from({ length: numInstallments }, (_, i) => ({
      number: i + 1,
      value: valuePerInstallment,
      dueDate: addFutureDate(i),
    }));
  }

  function updateNegotiatedInstallment(
    index: number,
    field: "value" | "dueDate",
    val: string | number,
  ) {
    setNegotiatedInstallments((prev) =>
      prev.map((inst, i) =>
        i === index
          ? { ...inst, [field]: field === "value" ? Number(val) : val }
          : inst,
      ),
    );
  }

  function addNegotiatedInstallment() {
    setNegotiatedInstallments((prev) => [
      ...prev,
      { number: prev.length + 1, value: 0, dueDate: "" },
    ]);
  }

  function removeNegotiatedInstallment(index: number) {
    if (negotiatedInstallments.length <= 2) return;
    setNegotiatedInstallments((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((inst, i) => ({ ...inst, number: i + 1 })),
    );
  }

  const negotiatedTotal = negotiatedInstallments.reduce(
    (s, i) => s + i.value,
    0,
  );

  function handleSearch() {
    setSearchApplied(searchInput);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  function clearSearch() {
    setSearchInput("");
    setSearchApplied("");
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      loadSales(
        newPage,
        limit,
        paymentFilter || undefined,
        typeFilter || undefined,
        searchApplied || undefined,
      );
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product && item.quantity > product.quantity) {
        alert(
          `Estoque insuficiente para "${product.name}". Disponível: ${product.quantity}`,
        );
        return;
      }
    }

    if (
      installmentType === "negociado" &&
      Math.abs(negotiatedTotal - saleTotal) > 0.01
    ) {
      alert(
        `A soma das parcelas (R$ ${negotiatedTotal.toFixed(2)}) deve ser igual ao total da venda (R$ ${saleTotal.toFixed(2)}).`,
      );
      return;
    }

    const finalPayment = useCustomPayment ? customPayment : paymentMethod;
    let finalInstallments: Installment[] = [];

    if (installmentType === "avista") {
      finalInstallments = [{ number: 1, value: saleTotal, dueDate: date }];
    } else if (installmentType === "parcelado") {
      finalInstallments = generateRegularInstallments();
    } else {
      finalInstallments = negotiatedInstallments;
    }

    await addSale(
      customer || "Cliente não informado",
      date,
      items,
      finalPayment || "Não informado",
      installmentType,
      finalInstallments,
    );
    setShowModal(false);
    // Recarregar vendas após adicionar
    loadSales(
      page,
      limit,
      paymentFilter || undefined,
      typeFilter || undefined,
      searchApplied || undefined,
    );
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  function formatInstallmentType(type: string) {
    if (type === "avista") return "À Vista";
    if (type === "parcelado") return "Parcelado";
    return "Negociado";
  }

  async function exportToExcel() {
    setExporting(true);
    try {
      await api.exportSales(
        paymentFilter || undefined,
        typeFilter || undefined,
        searchApplied || undefined,
        undefined, // productName - não implementado na UI ainda
      );
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar Excel");
    } finally {
      setExporting(false);
    }
  }

  if (loadingSales || loadingProducts) {
    return (
      <div className="page stock-page">
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page stock-page">
      <div className="stock-hero">
        <div className="page-header stock-header">
          <div>
            <h2>Lançar Venda</h2>
            <p className="page-description">
              Registre vendas e acompanhe o histórico
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={openModal}
            disabled={!products || products.length === 0}
          >
            <Plus size={18} />
            Nova Venda
          </button>
        </div>

        <div className="stats-grid stats-grid-2 stock-stats">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Receipt size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Vendas Realizadas</span>
              <span className="stat-value">{sales.length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">
              <DollarSign size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Faturamento Total</span>
              <span className="stat-value">
                R${" "}
                {totalVendas.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container stock-table">
        <div className="table-toolbar stock-toolbar">
          <div className="search-group">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchInput && (
                <button
                  className="search-clear"
                  onClick={clearSearch}
                  type="button"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button className="btn-primary btn-search" onClick={handleSearch}>
              <Search size={16} />
              Buscar
            </button>
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos pagamentos</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value as "" | "avista" | "parcelado" | "negociado",
              )
            }
            className="filter-select"
          >
            <option value="">Todos tipos</option>
            <option value="avista">À Vista</option>
            <option value="parcelado">Parcelado</option>
            <option value="negociado">Negociado</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="filter-select limit-select"
          >
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
          <button
            className="btn-secondary"
            onClick={exportToExcel}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 size={18} className="spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileSpreadsheet size={18} />
                Exportar Excel
              </>
            )}
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Data</th>
              <th>Cliente</th>
              <th>Pagamento</th>
              <th>Parcelas</th>
              <th>Itens</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {loadingSales ? (
              <tr>
                <td colSpan={7} className="loading-row">
                  <Loader2 size={20} className="spin" />
                  <span>Carregando...</span>
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">Nenhuma venda encontrada.</div>
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="td-name">#{sale.id}</td>
                  <td>{formatDate(sale.date)}</td>
                  <td>{sale.customer}</td>
                  <td>
                    <span className="badge">{sale.paymentMethod}</span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${sale.installmentType === "avista" ? "ok" : "info"}`}
                    >
                      {formatInstallmentType(sale.installmentType)}
                      {sale.installmentType !== "avista" &&
                        ` (${sale.installments.length}x)`}
                    </span>
                  </td>
                  <td>
                    <div className="sale-items-list">
                      {sale.items.map((item, idx) => (
                        <span key={idx} className="badge">
                          {item.quantity}x {item.productName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="td-name">
                    R${" "}
                    {sale.total.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Mostrando {(page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, total)} de {total} vendas
            </div>
            <div className="pagination-controls">
              <button
                className="btn-icon"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                title="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1),
                )
                .map((p, index, arr) => (
                  <span key={p}>
                    {index > 0 && arr[index - 1] !== p - 1 && (
                      <span className="pagination-ellipsis">...</span>
                    )}
                    <button
                      className={`pagination-btn ${p === page ? "active" : ""}`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  </span>
                ))}

              <button
                className="btn-icon"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                title="Próxima página"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova Venda</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente</label>
                  <input
                    type="text"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="Nome do cliente (opcional)"
                  />
                </div>
                <div className="form-group">
                  <label>Data da Venda</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Forma de Pagamento</label>
                <div className="payment-row">
                  <select
                    value={useCustomPayment ? "__custom__" : paymentMethod}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setUseCustomPayment(true);
                      } else {
                        setUseCustomPayment(false);
                        setPaymentMethod(e.target.value);
                      }
                    }}
                    className="filter-select"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                    <option value="__custom__">Outro (digitar)</option>
                  </select>
                  {useCustomPayment && (
                    <input
                      type="text"
                      value={customPayment}
                      onChange={(e) => setCustomPayment(e.target.value)}
                      placeholder="Digite a forma de pagamento"
                      className="custom-payment-input"
                    />
                  )}
                </div>
              </div>

              <div className="sale-add-item">
                <label>Adicionar Produto</label>
                <div className="sale-add-row">
                  <select
                    value={selectedProductId}
                    onChange={(e) =>
                      setSelectedProductId(Number(e.target.value))
                    }
                    className="sale-product-select"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — R${" "}
                        {p.price.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        (Estoque: {p.quantity})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Number(e.target.value))}
                    className="sale-qty-input"
                  />
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={addItem}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {items.length > 0 && (
                <>
                  <div className="sale-cart">
                    <table className="cart-table">
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th>Qtd.</th>
                          <th>Unit.</th>
                          <th>Subtotal</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.productId}>
                            <td>{item.productName}</td>
                            <td>{item.quantity}</td>
                            <td>
                              R${" "}
                              {item.unitPrice.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="td-name">
                              R${" "}
                              {(item.quantity * item.unitPrice).toLocaleString(
                                "pt-BR",
                                { minimumFractionDigits: 2 },
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-icon danger"
                                onClick={() => removeItem(item.productId)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="sale-total">
                      <ShoppingCart size={18} />
                      <span>Total:</span>
                      <strong>
                        R${" "}
                        {saleTotal.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </strong>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Condição de Pagamento</label>
                    <div className="installment-toggle">
                      <button
                        type="button"
                        className={`toggle-btn-sm ${installmentType === "avista" ? "active" : ""}`}
                        onClick={() => setInstallmentType("avista")}
                      >
                        À Vista
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn-sm ${installmentType === "parcelado" ? "active" : ""}`}
                        onClick={() => setInstallmentType("parcelado")}
                      >
                        Parcelado
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn-sm ${installmentType === "negociado" ? "active" : ""}`}
                        onClick={() => setInstallmentType("negociado")}
                      >
                        Negociado
                      </button>
                    </div>
                  </div>

                  {installmentType === "parcelado" && (
                    <div className="installment-config">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Número de Parcelas</label>
                          <select
                            value={numInstallments}
                            onChange={(e) =>
                              setNumInstallments(Number(e.target.value))
                            }
                            className="filter-select"
                          >
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                              <option key={n} value={n}>
                                {n}x de R${" "}
                                {(saleTotal / n).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="installment-preview">
                        <CreditCard size={16} />
                        <span>
                          {numInstallments}x de{" "}
                          <strong>
                            R${" "}
                            {(saleTotal / numInstallments).toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 },
                            )}
                          </strong>
                        </span>
                        <span className="text-muted">(parcelas mensais)</span>
                      </div>
                    </div>
                  )}

                  {installmentType === "negociado" && (
                    <div className="installment-config">
                      <p className="config-hint">
                        <Calendar size={14} />
                        Defina valores e datas personalizadas para cada parcela
                      </p>
                      <div className="negotiated-list">
                        {negotiatedInstallments.map((inst, idx) => (
                          <div key={idx} className="negotiated-item">
                            <span className="installment-number">
                              {inst.number}ª
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={inst.value || ""}
                              onChange={(e) =>
                                updateNegotiatedInstallment(
                                  idx,
                                  "value",
                                  e.target.value,
                                )
                              }
                              placeholder="Valor"
                              className="negotiated-value"
                            />
                            <input
                              type="date"
                              value={inst.dueDate}
                              onChange={(e) =>
                                updateNegotiatedInstallment(
                                  idx,
                                  "dueDate",
                                  e.target.value,
                                )
                              }
                              className="negotiated-date"
                            />
                            {negotiatedInstallments.length > 2 && (
                              <button
                                type="button"
                                className="btn-icon danger"
                                onClick={() => removeNegotiatedInstallment(idx)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={addNegotiatedInstallment}
                      >
                        <Plus size={14} />
                        Adicionar Parcela
                      </button>
                      <div
                        className={`negotiated-total ${Math.abs(negotiatedTotal - saleTotal) > 0.01 ? "error" : "ok"}`}
                      >
                        Soma das parcelas:{" "}
                        <strong>
                          R${" "}
                          {negotiatedTotal.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </strong>
                        {Math.abs(negotiatedTotal - saleTotal) > 0.01 && (
                          <span className="diff">
                            {" "}
                            (falta R${" "}
                            {(saleTotal - negotiatedTotal).toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 },
                            )}
                            )
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-success"
                  disabled={items.length === 0}
                >
                  <ShoppingCart size={16} />
                  Finalizar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
