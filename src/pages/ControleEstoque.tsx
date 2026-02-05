import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useStock } from "../context/StockContext";
import { api } from "../services/api";
import type { Product } from "../data/mockData";
import {
  Plus,
  X,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  FileSpreadsheet,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PaginatedMovementsResponse {
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

export default function ControleEstoque() {
  const {
    products: rawProducts,
    addMovement,
    loadingProducts,
    refreshProducts,
  } = useStock();

  // Garantir que products seja sempre um array válido
  const products: Product[] = Array.isArray(rawProducts)
    ? (rawProducts as Product[])
    : (rawProducts as PaginatedProductsResponse)?.data || [];

  // Paginação
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "entrada" | "saida">("");

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    productId: 0,
    type: "entrada" as "entrada" | "saida",
    quantity: 1,
    date: today,
    notes: "",
  });

  // Carregar produtos iniciais
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Carregar movimentos com filtros
  const loadMovements = useCallback(
    async (
      pageNum: number,
      pageLimit: number,
      type?: string,
      productName?: string,
    ) => {
      if (!api.getToken()) return;
      setLoadingMovements(true);
      try {
        const response = (await api.getMovements(
          pageNum,
          pageLimit,
          type || undefined,
          productName || undefined,
        )) as PaginatedMovementsResponse;
        setMovements(response.data);
        setTotal(response.total);
        setTotalPages(response.totalPages);
        setPage(response.page);
      } catch (error) {
        console.error("Erro ao carregar movimentações:", error);
      } finally {
        setLoadingMovements(false);
      }
    },
    [],
  );

  // Carregar movimentos quando mudar filtros ou limite
  useEffect(() => {
    loadMovements(
      1,
      limit,
      typeFilter || undefined,
      searchApplied || undefined,
    );
  }, [typeFilter, searchApplied, limit, loadMovements]);

  const totalEntradas = movements
    .filter((m) => m.type === "entrada")
    .reduce((s, m) => s + m.quantity, 0);
  const totalSaidas = movements
    .filter((m) => m.type === "saida")
    .reduce((s, m) => s + m.quantity, 0);

  function openModal() {
    // Verificar se há produtos disponíveis
    if (!products || products.length === 0) {
      alert(
        "Nenhum produto encontrado. Adicione produtos primeiro no estoque.",
      );
      return;
    }

    setForm({
      productId: products[0]?.id || 0,
      type: "entrada",
      quantity: 1,
      date: today,
      notes: "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const product = products.find((p) => p.id === form.productId);
    if (!product) return;

    if (form.type === "saida" && form.quantity > product.quantity) {
      alert(
        `Estoque insuficiente. Disponível: ${product.quantity} ${product.unit}`,
      );
      return;
    }

    await addMovement({
      productId: form.productId,
      productName: product.name,
      type: form.type,
      quantity: form.quantity,
      date: form.date,
      notes: form.notes,
    });
    setShowModal(false);
    // Recarregar movimentos após adicionar
    loadMovements(
      page,
      limit,
      typeFilter || undefined,
      searchApplied || undefined,
    );
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  function handleCardClick(type: "" | "entrada" | "saida") {
    setTypeFilter((prev) => (prev === type ? "" : type));
  }

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
      loadMovements(
        newPage,
        limit,
        typeFilter || undefined,
        searchApplied || undefined,
      );
    }
  }

  async function exportToExcel() {
    setExporting(true);
    try {
      await api.exportMovements(
        typeFilter || undefined,
        searchApplied || undefined,
      );
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar Excel");
    } finally {
      setExporting(false);
    }
  }

  if (loadingMovements || loadingProducts) {
    return (
      <div className="page stock-page">
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Carregando movimentações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page stock-page">
      <div className="stock-hero">
        <div className="page-header stock-header">
          <div>
            <h2>Controle de Estoque</h2>
            <p className="page-description">
              Registre entradas e saídas de produtos
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={openModal}
            disabled={!products || products.length === 0}
          >
            <Plus size={18} />
            Nova Movimentação
          </button>
        </div>

        <div className="stats-grid stats-grid-2 stock-stats">
          <div
            className={`stat-card clickable ${typeFilter === "entrada" ? "active" : ""}`}
            onClick={() => handleCardClick("entrada")}
            title="Clique para filtrar entradas"
          >
            <div className="stat-icon success">
              <ArrowDownCircle size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Entradas</span>
              <span className="stat-value">
                {totalEntradas.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
          <div
            className={`stat-card clickable ${typeFilter === "saida" ? "active" : ""}`}
            onClick={() => handleCardClick("saida")}
            title="Clique para filtrar saídas"
          >
            <div className="stat-icon">
              <ArrowUpCircle size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Saídas</span>
              <span className="stat-value">
                {totalSaidas.toLocaleString("pt-BR")}
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
                placeholder="Buscar por produto ou observação..."
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
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "" | "entrada" | "saida")
              }
              className="filter-select"
            >
              <option value="">Todos os tipos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>
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
              <th>Data</th>
              <th>Tipo</th>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {loadingMovements ? (
              <tr>
                <td colSpan={5} className="loading-row">
                  <Loader2 size={20} className="spin" />
                  <span>Carregando...</span>
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id}>
                  <td>{formatDate(movement.date)}</td>
                  <td>
                    <span className={`movement-badge ${movement.type}`}>
                      {movement.type === "entrada" ? (
                        <>
                          <ArrowDownCircle size={14} /> Entrada
                        </>
                      ) : (
                        <>
                          <ArrowUpCircle size={14} /> Saída
                        </>
                      )}
                    </span>
                  </td>
                  <td className="td-name">{movement.productName}</td>
                  <td>{movement.quantity}</td>
                  <td className="td-notes">{movement.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {movements.length === 0 && !loadingMovements && (
          <div className="empty-state">Nenhuma movimentação encontrada.</div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Mostrando {(page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, total)} de {total} movimentações
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
                    className={`toggle-btn ${form.type === "entrada" ? "active entrada" : ""}`}
                    onClick={() => setForm({ ...form, type: "entrada" })}
                  >
                    <ArrowDownCircle size={16} />
                    Entrada
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${form.type === "saida" ? "active saida" : ""}`}
                    onClick={() => setForm({ ...form, type: "saida" })}
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
                  onChange={(e) =>
                    setForm({ ...form, productId: Number(e.target.value) })
                  }
                  required
                >
                  {products.map((p) => (
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
                    onChange={(e) =>
                      setForm({ ...form, quantity: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observação</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex: Recebimento do fornecedor, venda balcão..."
                />
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
                  className={`btn-primary ${form.type === "entrada" ? "btn-success" : ""}`}
                >
                  Registrar {form.type === "entrada" ? "Entrada" : "Saída"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
