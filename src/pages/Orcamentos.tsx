import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { useStock } from "../context/StockContext";
import { api } from "../services/api";
import type { QuoteItem, PaymentCondition, Product } from "../data/mockData";
import QuotePDF from "../components/QuotePDF";
import Tooltip from "../components/Tooltip";
import {
  Plus,
  X,
  FileText,
  Trash2,
  Percent,
  MessageSquare,
  Edit3,
  FileDown,
  Search,
  FileSpreadsheet,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package,
} from "lucide-react";

const PAYMENT_METHODS = [
  "PIX",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Boleto",
  "Transferência Bancária",
  "Dinheiro",
];

interface PaginatedQuotesResponse {
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

export default function Orcamentos() {
  const {
    products: rawProducts,
    addQuote,
    addProduct,
    loadingProducts,
    refreshProducts,
  } = useStock();

  // Garantir que products seja sempre um array válido
  const products: Product[] = Array.isArray(rawProducts)
    ? (rawProducts as Product[])
    : (rawProducts as PaginatedProductsResponse)?.data || [];

  // Paginação
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [pdfQuote, setPdfQuote] = useState<any>(null);

  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [validityFilter, setValidityFilter] = useState<
    "" | "valid" | "expired"
  >("");

  // Carregar produtos iniciais
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Carregar orçamentos com filtros
  const loadQuotes = useCallback(
    async (
      pageNum: number,
      pageLimit: number,
      customer?: string,
      paymentMethod?: string,
      validityStatus?: string,
    ) => {
      if (!api.canRequest()) return;
      setLoadingQuotes(true);
      try {
        const response = (await api.getQuotes(
          pageNum,
          pageLimit,
          customer || undefined,
          undefined, // productName - não implementado na UI ainda
          paymentMethod || undefined,
          validityStatus || undefined,
        )) as PaginatedQuotesResponse;
        setQuotes(response.data);
        setTotal(response.total);
        setTotalPages(response.totalPages);
        setPage(response.page);
      } catch (error) {
        console.error("Erro ao carregar orçamentos:", error);
      } finally {
        setLoadingQuotes(false);
      }
    },
    [],
  );

  // Carregar orçamentos quando mudar filtros ou limite
  useEffect(() => {
    loadQuotes(
      1,
      limit,
      searchApplied || undefined,
      paymentFilter || undefined,
      validityFilter || undefined,
    );
  }, [searchApplied, paymentFilter, validityFilter, limit, loadQuotes]);

  const today = new Date().toISOString().split("T")[0];

  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(today);
  const [validUntil, setValidUntil] = useState(
    () =>
      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
  );
  const [observation, setObservation] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [paymentConditions, setPaymentConditions] = useState<
    PaymentCondition[]
  >([]);

  // Add item form
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);

  // New product modal
  const pendingProductName = useRef<string | null>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [apiCategories, setApiCategories] = useState<{ id: number; name: string }[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    quantity: 0,
    minQuantity: 0,
    price: 0,
    unit: "un",
  });

  // Add payment condition form
  const [condMethod, setCondMethod] = useState(PAYMENT_METHODS[0]);
  const [condInstallments, setCondInstallments] = useState(1);
  const [condDiscount, setCondDiscount] = useState(0);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

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
      loadQuotes(
        newPage,
        limit,
        searchApplied || undefined,
        paymentFilter || undefined,
        validityFilter || undefined,
      );
    }
  }

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
    setValidUntil(
      () =>
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
    );
    setObservation("");
    setItems([]);
    setPaymentConditions([]);
    setSelectedProductId(String(products[0]?.id ?? ""));
    setSelectedQty(1);
    setCondMethod(PAYMENT_METHODS[0]);
    setCondInstallments(1);
    setCondDiscount(0);
    setShowModal(true);
  }

  async function loadCategories() {
    setLoadingCategories(true);
    try {
      const cats = await api.getCategories();
      setApiCategories(cats);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setLoadingCategories(false);
    }
  }

  function openNewProduct() {
    setProductForm({ name: "", category: "", quantity: 0, minQuantity: 0, price: 0, unit: "un" });
    setShowNewProduct(true);
    loadCategories();
  }

  async function handleSaveProduct(e: FormEvent) {
    e.preventDefault();
    setSavingProduct(true);
    try {
      pendingProductName.current = productForm.name;
      await addProduct(productForm);
      await refreshProducts();
      setShowNewProduct(false);
    } catch {
      pendingProductName.current = null;
      alert("Erro ao criar produto");
    } finally {
      setSavingProduct(false);
    }
  }

  // Auto-select newly created product when products list updates
  useEffect(() => {
    if (!pendingProductName.current) return;
    const created = products.find((p) => p.name === pendingProductName.current);
    if (created) {
      setSelectedProductId(String(created.id));
      pendingProductName.current = null;
    }
  }, [products]);

  function addItem() {
    const product = products.find((p) => String(p.id) === selectedProductId);
    if (!product || selectedQty <= 0) return;

    const existing = items.find(
      (i) => String(i.productId) === selectedProductId,
    );
    if (existing) {
      setItems(
        items.map((i) =>
          String(i.productId) === selectedProductId
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
          originalPrice: product.price,
          observation: "",
        },
      ]);
    }
    setSelectedQty(1);
  }

  function updateItem(
    index: number,
    field: keyof QuoteItem,
    value: string | number,
  ) {
    setItems(
      items.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function addPaymentCondition() {
    if (subtotal <= 0) return;
    const finalValue = subtotal * (1 - condDiscount / 100);
    setPaymentConditions([
      ...paymentConditions,
      {
        method: condMethod,
        installments: condInstallments,
        discount: condDiscount,
        finalValue,
      },
    ]);
    setCondDiscount(0);
    setCondInstallments(1);
  }

  function removePaymentCondition(index: number) {
    setPaymentConditions(paymentConditions.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !customer.trim() ||
      items.length === 0 ||
      paymentConditions.length === 0
    ) {
      alert(
        "Preencha o cliente, adicione itens e pelo menos uma condição de pagamento.",
      );
      return;
    }
    await addQuote(
      customer,
      date,
      validUntil,
      items,
      observation,
      paymentConditions,
    );
    setShowModal(false);
    // Recarregar orçamentos após adicionar
    loadQuotes(
      page,
      limit,
      searchApplied || undefined,
      paymentFilter || undefined,
      validityFilter || undefined,
    );
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  const handlePdfExport = (quote: any) => {
    setPdfQuote(quote);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await api.exportQuotes(
        searchApplied || undefined,
        undefined, // productName - não implementado na UI ainda
        paymentFilter || undefined,
        validityFilter || undefined,
      );
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar Excel");
    } finally {
      setExporting(false);
    }
  };

  if (loadingQuotes || loadingProducts) {
    return (
      <div className="page stock-page">
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Carregando orçamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page stock-page">
      <div className="stock-hero">
        <div className="page-header stock-header">
          <div>
            <h2>Orçamentos</h2>
            <p className="page-description">
              Crie e gerencie orçamentos para clientes
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={openModal}
            disabled={!products || products.length === 0}
          >
            <Plus size={18} />
            Novo Orçamento
          </button>
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
            value={validityFilter}
            onChange={(e) =>
              setValidityFilter(e.target.value as "" | "valid" | "expired")
            }
            className="filter-select"
          >
            <option value="">Todas validades</option>
            <option value="valid">Válidos</option>
            <option value="expired">Expirados</option>
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
            onClick={handleExportExcel}
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
              <th>Itens</th>
              <th>Subtotal</th>
              <th>Validade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loadingQuotes ? (
              <tr>
                <td colSpan={7} className="loading-row">
                  <Loader2 size={20} className="spin" />
                  <span>Carregando...</span>
                </td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    Nenhum orçamento encontrado.
                  </div>
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id}>
                  <td className="td-name">#{quote.index}</td>
                  <td>{formatDate(quote.date)}</td>
                  <td>{quote.customer}</td>
                  <td>
                    <div className="sale-items-list">
                      <span className="badge">
                        {quote.items[0].quantity}x {quote.items[0].productName}
                      </span>
                      {quote.items.length > 1 && (
                        <Tooltip
                          text={quote.items
                            .slice(1)
                            .map((i: any) => `${i.quantity}x ${i.productName}`)
                            .join(", ")}
                        >
                          <span className="badge badge-more">
                            +{quote.items.length - 1}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                  <td className="td-name">
                    R${" "}
                    {quote.subtotal.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td>{formatDate(quote.validUntil)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon edit"
                        onClick={() => handlePdfExport(quote)}
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

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Mostrando {(page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, total)} de {total} orçamentos
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
        <div className="modal-overlay">
          <div className="modal modal-xl">
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
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Válido até</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Add Item */}
              <div className="quote-section">
                <label className="section-label">
                  <FileText size={16} /> Itens do Orçamento
                </label>
                <div className="sale-add-row">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="sale-product-select"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — R${" "}
                        {p.price.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={openNewProduct}
                    title="Criar novo produto"
                  >
                    <Package size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Number(e.target.value))}
                    className="sale-qty-input"
                    placeholder="Qtd"
                  />
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={addItem}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {items.length > 0 && (
                  <div className="quote-items-list">
                    {items.map((item, idx) => (
                      <div key={idx} className="quote-item-card">
                        <div className="quote-item-header">
                          <span className="quote-item-name">
                            {item.productName}
                          </span>
                          <button
                            type="button"
                            className="btn-icon danger btn-xs"
                            onClick={() => removeItem(idx)}
                          >
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
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="quote-field">
                            <label>Preço Venda.</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "unitPrice",
                                  Number(e.target.value),
                                )
                              }
                            />
                            {item.unitPrice !== item.originalPrice && (
                              <span className="price-diff">
                                <Edit3 size={12} /> Original: R${" "}
                                {item.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="quote-field quote-field-obs">
                            <label>Observação</label>
                            <input
                              type="text"
                              value={item.observation}
                              onChange={(e) =>
                                updateItem(idx, "observation", e.target.value)
                              }
                              placeholder="Ex: Cor específica, tamanho..."
                            />
                          </div>
                        </div>
                        <div className="quote-item-subtotal">
                          Subtotal:{" "}
                          <strong>
                            R${" "}
                            {(item.quantity * item.unitPrice).toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 },
                            )}
                          </strong>
                        </div>
                      </div>
                    ))}
                    <div className="quote-total-bar">
                      <span>Total dos Itens:</span>
                      <strong>
                        R${" "}
                        {subtotal.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* General Observation */}
              <div className="form-group">
                <label>
                  <MessageSquare size={14} /> Observação Geral
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Observações gerais do orçamento (frete, prazos, condições especiais...)"
                  rows={2}
                  className="textarea-field"
                />
              </div>

              {/* Payment Conditions */}
              <div className="quote-section">
                <label className="section-label">
                  <Percent size={16} /> Condições de Pagamento
                </label>
                <div className="payment-condition-form">
                  <select
                    value={condMethod}
                    onChange={(e) => setCondMethod(e.target.value)}
                    className="filter-select"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                  <div className="cond-field">
                    <label>Parcelas</label>
                    <select
                      value={condInstallments}
                      onChange={(e) =>
                        setCondInstallments(Number(e.target.value))
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                        <option key={n} value={n}>
                          {n}x
                        </option>
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
                      onChange={(e) => setCondDiscount(Number(e.target.value))}
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
                            {cond.discount > 0 && (
                              <span className="cond-discount">
                                {" "}
                                (-{cond.discount}%)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="cond-value">
                          R${" "}
                          {cond.finalValue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                          {cond.installments > 1 && (
                            <span className="cond-installment-value">
                              ({cond.installments}x de R${" "}
                              {(
                                cond.finalValue / cond.installments
                              ).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                              )
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-icon danger btn-xs"
                          onClick={() => removePaymentCondition(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                  className="btn-primary"
                  disabled={
                    !customer.trim() ||
                    items.length === 0 ||
                    paymentConditions.length === 0
                  }
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

      {showNewProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Novo Produto</h3>
              <button className="btn-icon" onClick={() => setShowNewProduct(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="modal-form">
              <div className="form-group">
                <label>Nome do Produto</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                  disabled={savingProduct}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoria</label>
                  <div className="category-input-wrapper">
                    <input
                      type="text"
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      onFocus={() => setShowCategoryDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                      placeholder={loadingCategories ? "Carregando..." : "Selecione ou digite"}
                      required
                      disabled={savingProduct}
                    />
                    <ChevronDown size={16} className="category-dropdown-icon" />
                    {showCategoryDropdown && apiCategories.length > 0 && (
                      <div className="category-dropdown">
                        {apiCategories
                          .filter((cat) => cat.name.toLowerCase().includes(productForm.category.toLowerCase()))
                          .map((cat) => (
                            <div
                              key={cat.id}
                              className={`category-option ${productForm.category === cat.name ? "selected" : ""}`}
                              onMouseDown={() => setProductForm({ ...productForm, category: cat.name })}
                            >
                              {cat.name}
                            </div>
                          ))}
                        {productForm.category &&
                          !apiCategories.some((cat) => cat.name.toLowerCase() === productForm.category.toLowerCase()) && (
                            <div className="category-option new-category">
                              Criar: "{productForm.category}"
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Unidade</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    disabled={savingProduct}
                  >
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
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: Number(e.target.value) })}
                    required
                    disabled={savingProduct}
                  />
                </div>
                <div className="form-group">
                  <label>Qtd. Mínima</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.minQuantity}
                    onChange={(e) => setProductForm({ ...productForm, minQuantity: Number(e.target.value) })}
                    required
                    disabled={savingProduct}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Preço Unitário (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  required
                  disabled={savingProduct}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewProduct(false)}
                  disabled={savingProduct}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingProduct}>
                  {savingProduct ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Produto"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
