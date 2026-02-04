export const MOCK_USER = {
  email: 'admin@eurogrill.com',
  password: 'euro123',
  name: 'Administrador',
};

export interface Product {
  id: number;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
  unit: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  type: 'entrada' | 'saida';
  quantity: number;
  date: string;
  notes: string;
}

export interface Installment {
  number: number;
  value: number;
  dueDate: string;
}

export interface Sale {
  id: number;
  items: SaleItem[];
  date: string;
  customer: string;
  paymentMethod: string;
  installmentType: 'avista' | 'parcelado' | 'negociado';
  installments: Installment[];
  total: number;
}

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  observation: string;
}

export interface PaymentCondition {
  method: string;
  installments: number;
  discount: number;
  finalValue: number;
}

export interface Quote {
  id: number;
  customer: string;
  date: string;
  validUntil: string;
  items: QuoteItem[];
  observation: string;
  paymentConditions: PaymentCondition[];
  subtotal: number;
}

export const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Churrasqueira Pré-Moldada 65cm', category: 'Churrasqueiras', quantity: 12, minQuantity: 5, price: 1890.00, unit: 'un' },
  { id: 2, name: 'Churrasqueira Pré-Moldada 80cm', category: 'Churrasqueiras', quantity: 8, minQuantity: 5, price: 2490.00, unit: 'un' },
  { id: 3, name: 'Churrasqueira Pré-Moldada 100cm', category: 'Churrasqueiras', quantity: 3, minQuantity: 5, price: 3290.00, unit: 'un' },
  { id: 4, name: 'Grelha Inox 60cm', category: 'Acessórios', quantity: 25, minQuantity: 10, price: 189.90, unit: 'un' },
  { id: 5, name: 'Grelha Inox 80cm', category: 'Acessórios', quantity: 18, minQuantity: 10, price: 249.90, unit: 'un' },
  { id: 6, name: 'Espeto Inox 70cm', category: 'Acessórios', quantity: 50, minQuantity: 20, price: 34.90, unit: 'un' },
  { id: 7, name: 'Kit Espetos (6 peças)', category: 'Acessórios', quantity: 15, minQuantity: 8, price: 179.90, unit: 'kit' },
  { id: 8, name: 'Carvão Vegetal 5kg', category: 'Insumos', quantity: 200, minQuantity: 50, price: 29.90, unit: 'saco' },
  { id: 9, name: 'Acendedor de Carvão', category: 'Acessórios', quantity: 30, minQuantity: 10, price: 59.90, unit: 'un' },
  { id: 10, name: 'Tijolo Refratário', category: 'Materiais', quantity: 500, minQuantity: 100, price: 4.50, unit: 'un' },
  { id: 11, name: 'Argamassa Refratária 5kg', category: 'Materiais', quantity: 45, minQuantity: 20, price: 38.90, unit: 'saco' },
  { id: 12, name: 'Forno de Pizza Iglu', category: 'Churrasqueiras', quantity: 2, minQuantity: 3, price: 4590.00, unit: 'un' },
  { id: 13, name: 'Pegador Inox 45cm', category: 'Acessórios', quantity: 40, minQuantity: 15, price: 44.90, unit: 'un' },
  { id: 14, name: 'Garfo Trinchante Inox', category: 'Acessórios', quantity: 35, minQuantity: 15, price: 39.90, unit: 'un' },
  { id: 15, name: 'Chapéu de Coifa Inox', category: 'Materiais', quantity: 7, minQuantity: 5, price: 890.00, unit: 'un' },
];

export const MOCK_MOVEMENTS: StockMovement[] = [
  { id: 1, productId: 1, productName: 'Churrasqueira Pré-Moldada 65cm', type: 'entrada', quantity: 5, date: '2026-01-28', notes: 'Recebimento fornecedor' },
  { id: 2, productId: 6, productName: 'Espeto Inox 70cm', type: 'entrada', quantity: 20, date: '2026-01-27', notes: 'Reposição de estoque' },
  { id: 3, productId: 8, productName: 'Carvão Vegetal 5kg', type: 'saida', quantity: 30, date: '2026-01-27', notes: 'Venda cliente João' },
  { id: 4, productId: 4, productName: 'Grelha Inox 60cm', type: 'saida', quantity: 3, date: '2026-01-26', notes: 'Venda loja física' },
  { id: 5, productId: 10, productName: 'Tijolo Refratário', type: 'entrada', quantity: 200, date: '2026-01-25', notes: 'Compra fornecedor Reframat' },
  { id: 6, productId: 12, productName: 'Forno de Pizza Iglu', type: 'saida', quantity: 1, date: '2026-01-24', notes: 'Venda sob encomenda' },
];

export const MOCK_SALES: Sale[] = [
  {
    id: 1,
    customer: 'João Silva',
    date: '2026-01-30',
    items: [
      { productId: 1, productName: 'Churrasqueira Pré-Moldada 65cm', quantity: 1, unitPrice: 1890.00 },
      { productId: 4, productName: 'Grelha Inox 60cm', quantity: 2, unitPrice: 189.90 },
    ],
    paymentMethod: 'Cartão de Crédito',
    installmentType: 'parcelado',
    installments: [
      { number: 1, value: 756.60, dueDate: '2026-01-30' },
      { number: 2, value: 756.60, dueDate: '2026-02-28' },
      { number: 3, value: 756.60, dueDate: '2026-03-30' },
    ],
    total: 2269.80,
  },
  {
    id: 2,
    customer: 'Maria Santos',
    date: '2026-01-28',
    items: [
      { productId: 8, productName: 'Carvão Vegetal 5kg', quantity: 10, unitPrice: 29.90 },
      { productId: 6, productName: 'Espeto Inox 70cm', quantity: 6, unitPrice: 34.90 },
    ],
    paymentMethod: 'PIX',
    installmentType: 'avista',
    installments: [{ number: 1, value: 508.40, dueDate: '2026-01-28' }],
    total: 508.40,
  },
  {
    id: 3,
    customer: 'Carlos Oliveira',
    date: '2026-01-25',
    items: [
      { productId: 12, productName: 'Forno de Pizza Iglu', quantity: 1, unitPrice: 4590.00 },
    ],
    paymentMethod: 'Transferência Bancária',
    installmentType: 'negociado',
    installments: [
      { number: 1, value: 2000.00, dueDate: '2026-01-25' },
      { number: 2, value: 2590.00, dueDate: '2026-02-25' },
    ],
    total: 4590.00,
  },
];

export const MOCK_QUOTES: Quote[] = [
  {
    id: 1,
    customer: 'Roberto Ferreira',
    date: '2026-02-01',
    validUntil: '2026-02-15',
    items: [
      { productId: 2, productName: 'Churrasqueira Pré-Moldada 80cm', quantity: 1, unitPrice: 2490.00, originalPrice: 2490.00, observation: 'Cor tijolo tradicional' },
      { productId: 5, productName: 'Grelha Inox 80cm', quantity: 1, unitPrice: 249.90, originalPrice: 249.90, observation: '' },
      { productId: 7, productName: 'Kit Espetos (6 peças)', quantity: 2, unitPrice: 160.00, originalPrice: 179.90, observation: 'Desconto especial' },
    ],
    observation: 'Cliente VIP - oferecer frete grátis se fechar negócio',
    paymentConditions: [
      { method: 'PIX', installments: 1, discount: 5, finalValue: 2906.91 },
      { method: 'Cartão de Crédito', installments: 3, discount: 0, finalValue: 3059.90 },
      { method: 'Boleto', installments: 1, discount: 3, finalValue: 2968.10 },
    ],
    subtotal: 3059.90,
  },
  {
    id: 2,
    customer: 'Ana Paula Costa',
    date: '2026-01-28',
    validUntil: '2026-02-10',
    items: [
      { productId: 3, productName: 'Churrasqueira Pré-Moldada 100cm', quantity: 1, unitPrice: 3290.00, originalPrice: 3290.00, observation: 'Instalação inclusa' },
      { productId: 15, productName: 'Chapéu de Coifa Inox', quantity: 1, unitPrice: 890.00, originalPrice: 890.00, observation: '' },
      { productId: 10, productName: 'Tijolo Refratário', quantity: 50, unitPrice: 4.00, originalPrice: 4.50, observation: 'Preço especial por quantidade' },
    ],
    observation: 'Entregar no endereço da obra - Rua das Flores, 123',
    paymentConditions: [
      { method: 'PIX', installments: 1, discount: 8, finalValue: 3917.60 },
      { method: 'Cartão de Crédito', installments: 6, discount: 0, finalValue: 4380.00 },
      { method: 'Cartão de Crédito', installments: 12, discount: 0, finalValue: 4380.00 },
    ],
    subtotal: 4380.00,
  },
  {
    id: 3,
    customer: 'Pedro Almeida',
    date: '2026-01-20',
    validUntil: '2026-01-30',
    items: [
      { productId: 1, productName: 'Churrasqueira Pré-Moldada 65cm', quantity: 2, unitPrice: 1800.00, originalPrice: 1890.00, observation: 'Desconto por quantidade' },
      { productId: 4, productName: 'Grelha Inox 60cm', quantity: 2, unitPrice: 189.90, originalPrice: 189.90, observation: '' },
    ],
    observation: 'Revenda - aplicar desconto de parceiro',
    paymentConditions: [
      { method: 'Boleto', installments: 1, discount: 10, finalValue: 3581.82 },
      { method: 'Transferência Bancária', installments: 1, discount: 10, finalValue: 3581.82 },
    ],
    subtotal: 3979.80,
  },
];
