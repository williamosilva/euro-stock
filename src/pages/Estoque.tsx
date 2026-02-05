import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useStock } from "../context/StockContext";
import { api } from "../services/api";
import type { Product } from "../data/mockData";
import {
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
  DollarSign,
  Archive,
  Plus,
  Pencil,
  Trash2,
  X,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type StatFilter = "all" | "low";

interface PaginatedResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StockStats {
  totalProducts: number;
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
}

const EMPTY_FORM = {
  name: "",
  category: "",
  quantity: 0,
  minQuantity: 0,
  price: 0,
  unit: "un",
};
const LIMIT_OPTIONS = [10, 25, 50, 100];

export default function Estoque() {
  const { addProduct, updateProduct, deleteProduct } = useStock();

  // Paginação
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  // Estatísticas
  const [stats, setStats] = useState<StockStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Filtros e UI
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statFilter, setStatFilter] = useState<StatFilter>("all");
  const [saving, setSaving] = useState(false);
  const [apiCategories, setApiCategories] = useState<
    { id: number; name: string }[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [filterCategories, setFilterCategories] = useState<
    { id: number; name: string }[]
  >([]);

  // Carregar estatísticas
  const loadStats = useCallback(async () => {
    if (!api.getToken()) return;
    setLoadingStats(true);
    try {
      const data = await api.getStockStats();
      setStats(data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Carregar categorias para o filtro
  const loadFilterCategories = useCallback(async () => {
    if (!api.getToken()) return;
    try {
      const cats = await api.getCategories();
      setFilterCategories(cats);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  }, []);

  // Carregar produtos com paginação, filtro de categoria e busca
  const loadProducts = useCallback(
    async (
      pageNum: number,
      pageLimit: number,
      category?: string,
      search?: string,
    ) => {
      if (!api.getToken()) return;
      setLoadingProducts(true);
      try {
        const response = (await api.getStock(
          pageNum,
          pageLimit,
          category || undefined,
          search || undefined,
        )) as PaginatedResponse;
        setProducts(response.data);
        setTotal(response.total);
        setTotalPages(response.totalPages);
        setPage(response.page);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setLoadingProducts(false);
      }
    },
    [],
  );

  // Carregar dados iniciais (stats e categorias do filtro)
  useEffect(() => {
    loadStats();
    loadFilterCategories();
  }, [loadStats, loadFilterCategories]);

  // Carregar produtos quando mudar filtros ou limite
  useEffect(() => {
    loadProducts(
      1,
      limit,
      categoryFilter || undefined,
      searchApplied || undefined,
    );
  }, [categoryFilter, searchApplied, limit, loadProducts]);

  // Filtro local (apenas estoque baixo - categoria e busca são filtradas via API)
  const filtered = products.filter((p) => {
    const matchesStatFilter =
      statFilter === "all" ||
      (statFilter === "low" && p.quantity <= p.minQuantity);
    return matchesStatFilter;
  });

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

  function openAdd() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
    loadCategories();
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
    loadCategories();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct({ ...form, id: editingProduct.id });
      } else {
        await addProduct(form);
      }
      setShowModal(false);
      loadProducts(
        page,
        limit,
        categoryFilter || undefined,
        searchApplied || undefined,
      );
      loadStats();
      loadFilterCategories();
    } catch {
      alert("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteConfirm.id);
      setDeleteConfirm(null);
      loadProducts(
        page,
        limit,
        categoryFilter || undefined,
        searchApplied || undefined,
      );
      loadStats();
    } catch {
      alert("Erro ao excluir produto");
    } finally {
      setDeleting(false);
    }
  }

  function handleStatClick(filter: StatFilter) {
    setStatFilter((prev) => (prev === filter ? "all" : filter));
  }

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      loadProducts(
        newPage,
        limit,
        categoryFilter || undefined,
        searchApplied || undefined,
      );
    }
  }

  async function exportToExcel() {
    setExporting(true);
    try {
      await api.exportStock(
        categoryFilter || undefined,
        searchApplied || undefined,
      );
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar Excel");
    } finally {
      setExporting(false);
    }
  }

  if (loadingProducts && products.length === 0) {
    return (
      <div className="page stock-page">
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Carregando estoque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page stock-page">
      <div className="stock-hero">
        <div className="page-header stock-header">
          <div>
            <h2>Estoque</h2>
            <p className="page-description">
              Gerencie todos os produtos do estoque
            </p>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} />
            Novo Produto
          </button>
        </div>

        <div className="stats-grid stock-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Archive size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total de Produtos</span>
              <span className="stat-value">
                {loadingStats ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  (stats?.totalProducts ?? 0)
                )}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Package size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Itens em Estoque</span>
              <span className="stat-value">
                {loadingStats ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  (stats?.totalItems ?? 0).toLocaleString("pt-BR")
                )}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">
              <DollarSign size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Valor Total</span>
              <span className="stat-value">
                {loadingStats ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  `R$ ${(stats?.totalValue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                )}
              </span>
            </div>
          </div>
          <div
            className={`stat-card clickable ${statFilter === "low" ? "active" : ""}`}
            onClick={() => handleStatClick("low")}
            title="Clique para filtrar produtos com estoque baixo"
          >
            <div className="stat-icon warning">
              <TrendingDown size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Estoque Baixo</span>
              <span className="stat-value">
                {loadingStats ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  (stats?.lowStockCount ?? 0)
                )}
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
                placeholder="Buscar produto..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas as categorias</option>
            {filterCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="filter-select limit-select"
          >
            {LIMIT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} por página
              </option>
            ))}
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
            {loadingProducts ? (
              <tr>
                <td colSpan={9} className="loading-row">
                  <Loader2 size={20} className="spin" />
                  <span>Carregando...</span>
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const isLow =
                  product.status === "Baixo" ||
                  product.quantity <= product.minQuantity;
                const valorTotal =
                  product.valorTotal ?? product.quantity * product.price;
                return (
                  <tr key={product.id}>
                    <td className="td-name">{product.name}</td>
                    <td>
                      <span className="badge">{product.category}</span>
                    </td>
                    <td className={isLow ? "text-danger" : ""}>
                      {product.quantity}
                    </td>
                    <td>{product.minQuantity}</td>
                    <td>{product.unit}</td>
                    <td>
                      R${" "}
                      {product.price.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      R${" "}
                      {valorTotal.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
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
                        <button
                          className="btn-icon edit"
                          onClick={() => openEdit(product)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => setDeleteConfirm(product)}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {filtered.length === 0 && !loadingProducts && (
          <div className="empty-state">Nenhum produto encontrado.</div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Mostrando {(page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, total)} de {total} produtos
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
              <h3>{editingProduct ? "Editar Produto" : "Novo Produto"}</h3>
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
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoria</label>
                  <div className="category-input-wrapper">
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      onFocus={() => setShowCategoryDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowCategoryDropdown(false), 200)
                      }
                      placeholder={
                        loadingCategories
                          ? "Carregando..."
                          : "Selecione ou digite"
                      }
                      required
                      disabled={saving}
                    />
                    <ChevronDown size={16} className="category-dropdown-icon" />
                    {showCategoryDropdown && apiCategories.length > 0 && (
                      <div className="category-dropdown">
                        {apiCategories
                          .filter((cat) =>
                            cat.name
                              .toLowerCase()
                              .includes(form.category.toLowerCase()),
                          )
                          .map((cat) => (
                            <div
                              key={cat.id}
                              className={`category-option ${form.category === cat.name ? "selected" : ""}`}
                              onMouseDown={() =>
                                setForm({ ...form, category: cat.name })
                              }
                            >
                              {cat.name}
                            </div>
                          ))}
                        {form.category &&
                          !apiCategories.some(
                            (cat) =>
                              cat.name.toLowerCase() ===
                              form.category.toLowerCase(),
                          ) && (
                            <div className="category-option new-category">
                              Criar: "{form.category}"
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Unidade</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    disabled={saving}
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
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: Number(e.target.value) })
                    }
                    required
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label>Qtd. Mínima</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minQuantity}
                    onChange={(e) =>
                      setForm({ ...form, minQuantity: Number(e.target.value) })
                    }
                    required
                    disabled={saving}
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
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  required
                  disabled={saving}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Salvando...
                    </>
                  ) : editingProduct ? (
                    "Salvar"
                  ) : (
                    "Adicionar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => !deleting && setDeleteConfirm(null)}
        >
          <div
            className="modal modal-delete"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Confirmar Exclusão</h3>
              <button
                className="btn-icon"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <AlertTriangle size={48} className="warning-icon" />
                <p>Tem certeza que deseja excluir o produto:</p>
                <p className="product-name">"{deleteConfirm.name}"</p>
                <p className="warning-text">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
