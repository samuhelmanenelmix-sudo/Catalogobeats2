import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  ShieldCheck, 
  Printer, 
  Code, 
  Eye,
  Calendar,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { PurchasedLicense } from '../types';
import { generateContractHtml, generateContractPlainText } from '../utils/contractTemplate';

interface LicenseContractModalProps {
  purchases: PurchasedLicense[];
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseContractModal: React.FC<LicenseContractModalProps> = ({
  purchases,
  isOpen,
  onClose,
}) => {
  const [selectedPurchase, setSelectedPurchase] = useState<PurchasedLicense | null>(
    purchases.length > 0 ? purchases[0] : null
  );
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');

  React.useEffect(() => {
    if (purchases.length > 0 && !selectedPurchase) {
      setSelectedPurchase(purchases[0]);
    }
  }, [purchases, selectedPurchase]);

  if (!isOpen) return null;

  const currentHtml = selectedPurchase?.contractHtml || (selectedPurchase ? generateContractHtml({
    buyerName: selectedPurchase.buyerName,
    buyerEmail: selectedPurchase.buyerEmail,
    artistStageName: selectedPurchase.artistStageName,
    beatTitle: selectedPurchase.beatTitle,
    purchaseDate: selectedPurchase.purchaseDate,
    tierKey: selectedPurchase.tierKey,
    tierName: selectedPurchase.tierName,
    amountPaid: selectedPurchase.amountPaid,
    transactionId: selectedPurchase.transactionRef || selectedPurchase.orderId,
    isOfferBased: selectedPurchase.tierKey === 'premium',
    offeredAmount: selectedPurchase.amountPaid
  }) : '');

  const currentTxt = selectedPurchase?.contractText || (selectedPurchase ? generateContractPlainText({
    buyerName: selectedPurchase.buyerName,
    buyerEmail: selectedPurchase.buyerEmail,
    artistStageName: selectedPurchase.artistStageName,
    beatTitle: selectedPurchase.beatTitle,
    purchaseDate: selectedPurchase.purchaseDate,
    tierKey: selectedPurchase.tierKey,
    tierName: selectedPurchase.tierName,
    amountPaid: selectedPurchase.amountPaid,
    transactionId: selectedPurchase.transactionRef || selectedPurchase.orderId
  }) : '');

  const handleDownloadHtml = (license: PurchasedLicense) => {
    const blob = new Blob([currentHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contrato_Licencia_${license.beatTitle.replace(/\s+/g, '_')}_${license.orderId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = (license: PurchasedLicense) => {
    const blob = new Blob([currentTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contrato_Licencia_${license.beatTitle.replace(/\s+/g, '_')}_${license.orderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintContract = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(currentHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div 
        className="relative w-full max-w-5xl bg-[#030A14] border border-[#00F0FF]/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)] text-[#E0F2FE] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#00F0FF]/20 bg-[#051525]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                Bóveda de Licencias & Contratos HTML
              </h3>
              <p className="text-xs text-sky-300/70">
                Visualiza, imprime y descarga el contrato oficial con los datos del comprador automatizados.
              </p>
            </div>
          </div>

          <button
            id="btn-close-purchases"
            onClick={onClose}
            className="p-2 rounded-full bg-[#030A14] text-sky-300/70 hover:text-white hover:border-[#00F0FF] transition border border-[#00F0FF]/25"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#02070E]">
          {purchases.length === 0 ? (
            <div className="text-center py-14 space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#051525] border border-[#00F0FF]/30 flex items-center justify-center mx-auto text-[#00F0FF]">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white font-display">
                Aún no tienes licencias registradas
              </h4>
              <p className="text-xs text-sky-300/70 max-w-md mx-auto">
                Cuando adquieras un beat o realices una prueba de compra, aquí podrás consultar tus contratos legales en HTML/PDF con tu nombre inyectado automáticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: List of Purchases */}
              <div className="md:col-span-4 space-y-2.5 border-b md:border-b-0 md:border-r border-[#00F0FF]/20 pb-4 md:pb-0 md:pr-4">
                <span className="text-xs font-bold uppercase font-mono tracking-wider text-sky-300/80 block mb-2">
                  Tus Licencias Registradas ({purchases.length})
                </span>

                {purchases.map((p) => {
                  const isSelected = selectedPurchase?.orderId === p.orderId;
                  return (
                    <div
                      key={p.orderId}
                      onClick={() => setSelectedPurchase(p)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                        isSelected
                          ? 'border-[#00F0FF] bg-[#051525] text-white shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                          : 'border-[#00F0FF]/20 bg-[#030A14] text-sky-200 hover:border-[#00F0FF]/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-sm truncate">{p.beatTitle}</h5>
                        <span className="text-[10px] font-mono text-[#00F0FF] bg-[#02070E] px-2 py-0.5 rounded border border-[#00F0FF]/30 font-bold">
                          {p.tierKey === 'premium' ? 'PREMIUM OFERTA' : p.tierKey.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-sky-300/70 mt-1 font-mono">{p.tierName}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-sky-400/60 mt-2.5 pt-2 border-t border-[#00F0FF]/15">
                        <span>{p.purchaseDate}</span>
                        <span className="font-bold text-[#00F0FF]">${p.amountPaid.toFixed(2)} USD</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Contract Viewer */}
              <div className="md:col-span-8 flex flex-col justify-between">
                {selectedPurchase ? (
                  <div className="space-y-4">
                    {/* Actions toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#00F0FF]/20">
                      <div>
                        <h4 className="text-base font-bold text-white">
                          "{selectedPurchase.beatTitle}" - {selectedPurchase.tierName}
                        </h4>
                        <span className="text-xs text-sky-300/70 font-mono">
                          Cliente: <strong className="text-[#00F0FF]">{selectedPurchase.buyerName}</strong> ({selectedPurchase.artistStageName})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* View Switcher */}
                        <div className="flex bg-[#030A14] p-0.5 rounded-xl border border-[#00F0FF]/25 mr-1 text-xs">
                          <button
                            onClick={() => setViewMode('html')}
                            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition ${
                              viewMode === 'html' ? 'bg-[#00F0FF] text-black' : 'text-sky-300 hover:text-white'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5 inline mr-1" />
                            HTML
                          </button>
                          <button
                            onClick={() => setViewMode('text')}
                            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition ${
                              viewMode === 'text' ? 'bg-[#00F0FF] text-black' : 'text-sky-300 hover:text-white'
                            }`}
                          >
                            <Code className="w-3.5 h-3.5 inline mr-1" />
                            TXT
                          </button>
                        </div>

                        {/* Print / PDF button */}
                        <button
                          onClick={handlePrintContract}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#051525] hover:bg-[#0A223D] text-xs font-bold text-white border border-[#00F0FF]/30 rounded-xl transition"
                          title="Imprimir o Guardar en PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#00F0FF]" />
                          <span>PDF</span>
                        </button>

                        {/* Download HTML */}
                        <button
                          onClick={() => handleDownloadHtml(selectedPurchase)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#00F0FF] hover:bg-[#38BDF8] text-xs font-bold text-black rounded-xl transition shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                          title="Descargar archivo .html"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>.HTML</span>
                        </button>

                        {/* Download TXT */}
                        <button
                          onClick={() => handleDownloadTxt(selectedPurchase)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#051525] hover:bg-[#0A223D] text-xs font-bold text-sky-200 border border-[#00F0FF]/30 rounded-xl transition"
                          title="Descargar archivo .txt"
                        >
                          <Download className="w-3.5 h-3.5 text-[#00F0FF]" />
                          <span>.TXT</span>
                        </button>
                      </div>
                    </div>

                    {/* View Preview */}
                    {viewMode === 'html' ? (
                      <div className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#00F0FF]/30 max-h-[500px] overflow-y-auto">
                        <iframe
                          title="Contrato HTML Preview"
                          srcDoc={currentHtml}
                          className="w-full min-h-[520px] border-0"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-[#030A14] border border-[#00F0FF]/25 rounded-2xl font-mono text-[11px] text-sky-200 whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto">
                        {currentTxt}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-sky-300/60 font-mono pt-1">
                      <span>Productor: <strong>Samu helman en el mix</strong> (samuhelmanenelmix@gmail.com)</span>
                      <span>Ref Transacción: {selectedPurchase.transactionRef || selectedPurchase.orderId}</span>
                    </div>
                  </div>
                ) : null}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
