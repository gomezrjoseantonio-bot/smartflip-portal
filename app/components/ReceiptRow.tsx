import { Download } from "lucide-react";

export interface Receipt {
  id: string;
  periodo: string;
  bruto: number;
  retencion: number;
  neto: number;
  path: string;
  nombre_mostrar?: string;
}

export default function ReceiptRow({ receipt }: { receipt: Receipt }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 hover:border-slate-600 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-[#4ECDC4]/10 rounded-lg flex items-center justify-center text-sm">📄</div>
        <div>
          <div className="text-white text-sm font-medium">{receipt.nombre_mostrar || receipt.periodo}</div>
          <div className="text-xs text-slate-500">{receipt.periodo}</div>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="text-center">
          <div className="text-slate-400 text-xs">Bruto</div>
          <div className="text-white">{fmt(receipt.bruto)}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 text-xs">Retención</div>
          <div className="text-red-400">-{fmt(receipt.retencion)}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 text-xs">Neto</div>
          <div className="text-[#2ECC71] font-semibold">{fmt(receipt.neto)}</div>
        </div>
      </div>
      <a
        href={`/api/download?path=${encodeURIComponent(receipt.path)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-[#4ECDC4] hover:text-white bg-[#4ECDC4]/10 hover:bg-[#4ECDC4]/20 px-3 py-1.5 rounded-lg transition-all"
        style={{textDecoration:'none'}}
      >
        <Download size={14} />
        <span className="hidden sm:inline">Descargar</span>
      </a>
    </div>
  );
}
