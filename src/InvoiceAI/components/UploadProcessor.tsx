
import React, { useState, useRef, useEffect } from 'react';
import { extractInvoiceData } from '../../services/geminiService';
import { applyVendorIntelligence } from '../utils/intelligence';
import { Invoice, UploadJob } from '../types';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, Play, ArrowRight, X, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface UploadProcessorProps {
  onAnalysisComplete: (drafts: Invoice[]) => void;
  onCancel: () => void;
}

const UploadProcessor: React.FC<UploadProcessorProps> = ({ onAnalysisComplete, onCancel }) => {
  const [queue, setQueue] = useState<UploadJob[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-process queue effect
  useEffect(() => {
    const processNext = async () => {
      if (!isProcessingQueue) return;

      const nextJobIndex = queue.findIndex(job => job.status === 'pending');
      if (nextJobIndex === -1) {
        setIsProcessingQueue(false);
        return;
      }

      setQueue(prev => {
        const newQ = [...prev];
        newQ[nextJobIndex].status = 'processing';
        return newQ;
      });

      const job = queue[nextJobIndex];

      try {
        const base64Data = job.preview.split(',')[1];
        const extractedData = await extractInvoiceData(base64Data, job.file.type);

        let draftInvoice: Invoice = {
          id: uuidv4(),
          vendorName: extractedData.vendorName || "Proveedor Desconocido",
          date: extractedData.date || new Date().toISOString().split('T')[0],
          items: extractedData.items || [],
          subtotal: extractedData.subtotal || 0,
          tax: extractedData.tax || 0,
          total: extractedData.total || 0,
          category: extractedData.category,
          status: 'draft',
          originalImage: job.preview,
          createdAt: Date.now()
        };

        // --- APPLY SMART TEMPLATE / VENDOR INTELLIGENCE ---
        draftInvoice = applyVendorIntelligence(draftInvoice);
        // -------------------------------------------------

        setQueue(prev => {
          const newQ = [...prev];
          newQ[nextJobIndex].status = 'success';
          newQ[nextJobIndex].result = draftInvoice;
          return newQ;
        });

      } catch (err) {
        setQueue(prev => {
          const newQ = [...prev];
          newQ[nextJobIndex].status = 'error';
          newQ[nextJobIndex].error = "Falló la extracción";
          return newQ;
        });
      }
    };

    if (isProcessingQueue) {
      processNext();
    }
  }, [queue, isProcessingQueue]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newJobs: UploadJob[] = [];

      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.type.startsWith('image/')) {
          const preview = await readFileAsBase64(file);
          newJobs.push({
            id: uuidv4(),
            file,
            preview,
            status: 'pending'
          });
        }
      }

      setQueue(prev => [...prev, ...newJobs]);
      setIsProcessingQueue(true); // Auto start processing
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeJob = (id: string) => {
    setQueue(prev => prev.filter(j => j.id !== id));
  };

  const completedCount = queue.filter(j => j.status === 'success').length;
  const totalJobs = queue.length;
  const progress = totalJobs === 0 ? 0 : Math.round((completedCount / totalJobs) * 100);

  const handleFinish = () => {
    const drafts = queue
      .filter(j => j.status === 'success' && j.result)
      .map(j => j.result!);
    onAnalysisComplete(drafts);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-slate-900/50 overflow-hidden">
        <div className="p-5 md:p-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Batch IA</p>
              <h2 className="text-2xl font-bold text-white">Cinta de procesamiento</h2>
              <p className="text-sm text-slate-400">Pensado para móvil: suelta fotos, la IA limpia y las deja listas para revisar.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 text-sm hover:border-white/20">
                Cancelar
              </button>
              <button
                onClick={handleFinish}
                disabled={completedCount === 0}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-sky-900/40 ${
                  completedCount > 0
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:shadow-sky-900/60'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Revisar ({completedCount}) <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-slate-400">{progress}%</span>
            <span className="text-slate-500">({completedCount}/{totalJobs || 1})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5">
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-6 flex flex-col items-center justify-center text-center shadow-inner shadow-slate-900/60">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-sky-500/30 to-indigo-600/30 border border-white/10 flex items-center justify-center text-white shadow-lg shadow-sky-900/40 mb-4">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-white">Arrastra o selecciona</h3>
            <p className="text-slate-400 text-sm mt-1 mb-4 max-w-sm">
              Modo gamer: soltá varias facturas, la IA aplica plantillas y resalta datos clave.
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white hover:bg-white/20"
                onClick={() => fileInputRef.current?.click()}
              >
                Elegir archivos
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-950 font-semibold shadow-lg shadow-emerald-900/50"
                onClick={() => fileInputRef.current?.click()}
              >
                Subir rápido
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              multiple
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 shadow-inner shadow-slate-900/60 flex flex-col max-h-[520px]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Cola de procesamiento</h3>
                <p className="text-xs text-slate-400">Auto-play activado</p>
              </div>
              {isProcessingQueue && <span className="text-xs text-emerald-300 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Analizando</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {queue.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Play className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">La cola está vacía</p>
                </div>
              )}

              {queue.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-sky-400/40 transition relative group"
                >
                  <img src={job.preview} alt="Thumb" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{job.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {job.status === 'pending' && <span className="text-[11px] text-slate-200 bg-slate-800 px-2 py-0.5 rounded-full border border-white/10">Pendiente</span>}
                      {job.status === 'processing' && <span className="text-[11px] text-sky-100 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-300/30 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Analizando</span>}
                      {job.status === 'success' && <span className="text-[11px] text-emerald-100 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-300/30 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completado</span>}
                      {job.status === 'error' && <span className="text-[11px] text-red-200 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-300/30 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Error</span>}
                      {job.status === 'success' && job.result?.isSmartMatch && (
                        <span className="text-[10px] text-purple-100 bg-purple-500/20 px-1.5 py-0.5 rounded-full border border-purple-300/30 flex items-center gap-1" title="Plantilla de proveedor aplicada automáticamente">
                          <Sparkles className="w-2.5 h-2.5" /> Auto
                        </span>
                      )}
                    </div>
                  </div>
                  {job.status === 'success' && job.result && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-sky-100">${job.result.total.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[90px]">{job.result.vendorName}</p>
                    </div>
                  )}
                  <button onClick={() => removeJob(job.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-200 rounded transition absolute top-2 right-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadProcessor;
