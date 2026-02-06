import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";
import type {
  Product,
  StockMovement,
  Sale,
  SaleItem,
  Installment,
  Quote,
  QuoteItem,
  PaymentCondition,
} from "../data/mockData";

interface StockContextType {
  products: Product[];
  movements: StockMovement[];
  sales: Sale[];
  quotes: Quote[];
  loadingProducts: boolean;
  loadingMovements: boolean;
  loadingSales: boolean;
  loadingQuotes: boolean;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  addMovement: (movement: Omit<StockMovement, "id">) => Promise<void>;
  addSale: (
    customer: string,
    date: string,
    items: SaleItem[],
    paymentMethod: string,
    installmentType: "avista" | "parcelado" | "negociado",
    installments: Installment[],
  ) => Promise<void>;
  addQuote: (
    customer: string,
    date: string,
    validUntil: string,
    items: QuoteItem[],
    observation: string,
    paymentConditions: PaymentCondition[],
  ) => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshMovements: () => Promise<void>;
  refreshSales: () => Promise<void>;
  refreshQuotes: () => Promise<void>;
}

const StockContext = createContext<StockContextType | null>(null);

export function StockProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  const refreshProducts = useCallback(async () => {
    if (!api.canRequest()) return;
    setLoadingProducts(true);
    try {
      const productsData = await api.getStock();
      setProducts(productsData as Product[]);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const refreshMovements = useCallback(async () => {
    if (!api.canRequest()) return;
    setLoadingMovements(true);
    try {
      const movementsData = await api.getMovements();
      setMovements(movementsData as StockMovement[]);
    } catch (error) {
      console.error("Error loading movements:", error);
    } finally {
      setLoadingMovements(false);
    }
  }, []);

  const refreshSales = useCallback(async () => {
    if (!api.canRequest()) return;
    setLoadingSales(true);
    try {
      const salesData = await api.getSales();
      setSales(salesData as Sale[]);
    } catch (error) {
      console.error("Error loading sales:", error);
    } finally {
      setLoadingSales(false);
    }
  }, []);

  const refreshQuotes = useCallback(async () => {
    if (!api.canRequest()) return;
    setLoadingQuotes(true);
    try {
      const quotesData = await api.getQuotes();
      setQuotes(quotesData as Quote[]);
    } catch (error) {
      console.error("Error loading quotes:", error);
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  // Reset when logged out
  useEffect(() => {
    if (!isAuthenticated) {
      setProducts([]);
      setMovements([]);
      setSales([]);
      setQuotes([]);
    }
  }, [isAuthenticated]);

  const addProduct = useCallback(async (product: Omit<Product, "id">) => {
    await api.createStock(product);
    await refreshProducts();
  }, [refreshProducts]);

  const updateProduct = useCallback(async (product: Product) => {
    await api.updateStock(product.id, product);
    await refreshProducts();
  }, [refreshProducts]);

  const deleteProduct = useCallback(async (id: number) => {
    await api.deleteStock(id);
    await refreshProducts();
  }, [refreshProducts]);

  const addMovement = useCallback(async (movement: Omit<StockMovement, "id">) => {
    await api.createMovement(movement);
    await Promise.all([refreshProducts(), refreshMovements()]);
  }, [refreshProducts, refreshMovements]);

  const addSale = useCallback(async (
    customer: string,
    date: string,
    items: SaleItem[],
    paymentMethod: string,
    installmentType: "avista" | "parcelado" | "negociado",
    installments: Installment[],
  ) => {
    await api.createSale({
      customer,
      date,
      items,
      paymentMethod,
      installmentType,
      installments,
    });
    await Promise.all([refreshProducts(), refreshMovements(), refreshSales()]);
  }, [refreshProducts, refreshMovements, refreshSales]);

  const addQuote = useCallback(async (
    customer: string,
    date: string,
    validUntil: string,
    items: QuoteItem[],
    observation: string,
    paymentConditions: PaymentCondition[],
  ) => {
    await api.createQuote({
      customer,
      date,
      validUntil,
      items,
      observation,
      paymentConditions,
    });
    await refreshQuotes();
  }, [refreshQuotes]);

  return (
    <StockContext.Provider
      value={{
        products,
        movements,
        sales,
        quotes,
        loadingProducts,
        loadingMovements,
        loadingSales,
        loadingQuotes,
        addProduct,
        updateProduct,
        deleteProduct,
        addMovement,
        addSale,
        addQuote,
        refreshProducts,
        refreshMovements,
        refreshSales,
        refreshQuotes,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (!context) throw new Error("useStock must be used within StockProvider");
  return context;
}
