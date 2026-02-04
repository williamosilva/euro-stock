import { createContext, useContext, useState, type ReactNode } from 'react';
import { MOCK_PRODUCTS, MOCK_MOVEMENTS, MOCK_SALES, MOCK_QUOTES, type Product, type StockMovement, type Sale, type SaleItem, type Installment, type Quote, type QuoteItem, type PaymentCondition } from '../data/mockData';

interface StockContextType {
  products: Product[];
  movements: StockMovement[];
  sales: Sale[];
  quotes: Quote[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
  addMovement: (movement: Omit<StockMovement, 'id'>) => void;
  addSale: (customer: string, date: string, items: SaleItem[], paymentMethod: string, installmentType: 'avista' | 'parcelado' | 'negociado', installments: Installment[]) => void;
  addQuote: (customer: string, date: string, validUntil: string, items: QuoteItem[], observation: string, paymentConditions: PaymentCondition[]) => void;
}

const StockContext = createContext<StockContextType | null>(null);

export function StockProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [movements, setMovements] = useState<StockMovement[]>(MOCK_MOVEMENTS);
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES);

  function addProduct(product: Omit<Product, 'id'>) {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts(prev => [...prev, { ...product, id: newId }]);
  }

  function updateProduct(product: Product) {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  }

  function deleteProduct(id: number) {
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  function addMovement(movement: Omit<StockMovement, 'id'>) {
    const newId = Math.max(...movements.map(m => m.id), 0) + 1;
    setMovements(prev => [{ ...movement, id: newId }, ...prev]);

    setProducts(prev => prev.map(p => {
      if (p.id === movement.productId) {
        const newQty = movement.type === 'entrada'
          ? p.quantity + movement.quantity
          : p.quantity - movement.quantity;
        return { ...p, quantity: Math.max(0, newQty) };
      }
      return p;
    }));
  }

  function addSale(customer: string, date: string, items: SaleItem[], paymentMethod: string, installmentType: 'avista' | 'parcelado' | 'negociado', installments: Installment[]) {
    const newId = Math.max(...sales.map(s => s.id), 0) + 1;
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    setSales(prev => [{ id: newId, customer, date, items, paymentMethod, installmentType, installments, total }, ...prev]);

    for (const item of items) {
      const movId = Math.max(...movements.map(m => m.id), 0) + 1;
      setMovements(prev => [{
        id: movId + prev.length,
        productId: item.productId,
        productName: item.productName,
        type: 'saida',
        quantity: item.quantity,
        date,
        notes: `Venda #${newId} - ${customer}`,
      }, ...prev]);

      setProducts(prev => prev.map(p => {
        if (p.id === item.productId) {
          return { ...p, quantity: Math.max(0, p.quantity - item.quantity) };
        }
        return p;
      }));
    }
  }

  function addQuote(customer: string, date: string, validUntil: string, items: QuoteItem[], observation: string, paymentConditions: PaymentCondition[]) {
    const newId = Math.max(...quotes.map(q => q.id), 0) + 1;
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    setQuotes(prev => [{
      id: newId,
      customer,
      date,
      validUntil,
      items,
      observation,
      paymentConditions,
      subtotal,
    }, ...prev]);
  }

  return (
    <StockContext.Provider value={{
      products,
      movements,
      sales,
      quotes,
      addProduct,
      updateProduct,
      deleteProduct,
      addMovement,
      addSale,
      addQuote,
    }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (!context) throw new Error('useStock must be used within StockProvider');
  return context;
}
