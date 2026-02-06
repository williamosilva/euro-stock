import { createPortal } from 'react-dom';
import type { Quote } from '../data/mockData';
import { X, Printer } from 'lucide-react';

interface QuotePDFProps {
  quote: Quote;
  onClose: () => void;
}

export default function QuotePDF({ quote, onClose }: QuotePDFProps) {
  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function handlePrint() {
    const originalTitle = document.title;
    document.title = ' ';
    window.print();
    document.title = originalTitle;
  }

  return createPortal(
    <div className="pdf-overlay">
      <div className="pdf-toolbar no-print">
        <span>Visualização do Orçamento #{quote.index}</span>
        <div className="pdf-toolbar-actions">
          <button className="btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={16} />
            Imprimir / Salvar PDF
          </button>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="pdf-container">
        <div className="pdf-page">
          {/* Header */}
          <div className="pdf-header">
            <div className="pdf-logo">
              <div>
                <h1>Euro Grill</h1>
                <span>Churrasqueiras & Acessórios</span>
              </div>
            </div>
            <div className="pdf-doc-info">
              <h2>ORÇAMENTO</h2>
              <p>Nº {String(quote.index ?? quote.id).padStart(4, '0')}</p>
            </div>
          </div>

          {/* Company Info */}
          <div className="pdf-company-info">
            <p>CNPJ: 17.659.944/0001-78 | Tel: +55 19 99891-4958</p>
            <p>Rua Padre Antonio Joaquim Gomes, 205 - Jardim Europa, Jaguariúna - SP, 13914-014</p>
          </div>

          {/* Client & Dates */}
          <div className="pdf-section">
            <div className="pdf-row">
              <div className="pdf-field">
                <label>Cliente</label>
                <span>{quote.customer}</span>
              </div>
              <div className="pdf-field">
                <label>Data</label>
                <span>{formatDate(quote.date)}</span>
              </div>
              <div className="pdf-field">
                <label>Validade</label>
                <span>{formatDate(quote.validUntil)}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="pdf-section">
            <h3>Itens do Orçamento</h3>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Descrição</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Qtd</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Valor Unit.</th>
                  <th style={{ width: '25%', textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      {item.productName}
                      {item.observation && (
                        <span className="pdf-item-obs">{item.observation}</span>
                      )}
                    </td>
                    <td className="center">{item.quantity}</td>
                    <td className="right">R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="right">R$ {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="right"><strong>SUBTOTAL</strong></td>
                  <td className="right"><strong>R$ {quote.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Conditions */}
          <div className="pdf-section">
            <h3>Condições de Pagamento</h3>
            <table className="pdf-table pdf-table-conditions">
              <thead>
                <tr>
                  <th>Forma de Pagamento</th>
                  <th>Parcelas</th>
                  <th>Desconto</th>
                  <th>Valor Final</th>
                </tr>
              </thead>
              <tbody>
                {quote.paymentConditions.map((cond, idx) => (
                  <tr key={idx}>
                    <td>{cond.method}</td>
                    <td className="center">
                      {cond.installments}x
                      {cond.installments > 1 && (
                        <span className="pdf-installment-detail">
                          {' '}de R$ {(cond.finalValue / cond.installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                    <td className="center">{cond.discount > 0 ? `${cond.discount}%` : '-'}</td>
                    <td className="right highlight">R$ {cond.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Observations */}
          {quote.observation && (
            <div className="pdf-section">
              <h3>Observações</h3>
              <div className="pdf-observation">
                {quote.observation}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pdf-footer">
            <div className="pdf-footer-text">
              <p>Este orçamento é válido até <strong>{formatDate(quote.validUntil)}</strong>.</p>
              <p>Valores sujeitos a alteração sem aviso prévio após a data de validade.</p>
            </div>
            <div className="pdf-generated-info">
              <p>Documento gerado virtualmente em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
