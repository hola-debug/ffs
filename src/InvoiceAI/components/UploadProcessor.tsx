
import React, { useState, useRef, useEffect } from 'react';
import { extractInvoiceData } from '../../services/geminiService';
import { applyVendorIntelligence } from '../utils/intelligence';
import { Invoice, UploadJob } from '../types';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, Play, ArrowRight, X, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import BlurText from '../../components/BlurText';

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
    <div className="h-full flex flex-col">
      {/* Minimal Progress Bar */}
      {totalJobs > 0 && (
        <div className="fixed top-0 left-0 right-0 z-30 h-1 bg-black/50 backdrop-blur">
          <div className="h-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className="rounded-3xl border border-dashed border-violet-500/30 bg-slate-900/30 backdrop-blur-xl p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-inner shadow-slate-900/60 min-h-[50vh]">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-white shadow-lg shadow-violet-500/40 mb-6 animate-pulse-slow">
            <UploadCloud className="w-12 h-12" />
          </div>
          <BlurText text="Arrastra y suelta o haz clic para subir" className="text-lg font-semibold text-white mb-2" delay={30} />
          <p className="text-sm text-slate-400 mb-6">Imágenes de facturas (JPG, PNG)</p>
          <button
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white font-bold text-lg shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/70 hover:scale-105 transition-all duration-300"
            onClick={() => fileInputRef.current?.click()}
          >
            Subir Facturas
          </button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Processing Queue */}
        <div className="md:w-1/3 rounded-2xl border border-white/10 bg-slate-900/50 shadow-inner shadow-slate-900/60 flex flex-col max-h-[50vh] md:max-h-full">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Cola de procesamiento</h3>
            <span className="text-xs text-slate-400">{completedCount}/{totalJobs}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {queue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Play className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">La cola está vacía</p>
              </div>
            ) : (
              queue.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:border-sky-400/40 transition relative group"
                >
                  <img src={job.preview} alt="Thumb" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{job.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {job.status === 'pending' && <span className="text-[11px] text-slate-200 bg-slate-800 px-2 py-0.5 rounded-full border border-white/10">Pendiente</span>}
                      {job.status === 'processing' && <span className="text-[11px] text-violet-100 bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-300/30 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Analizando</span>}
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
                      <p className="text-xs font-bold text-cyan-100">${job.result.total.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[90px]">{job.result.vendorName}</p>
                    </div>
                  )}
                  <button onClick={() => removeJob(job.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-200 rounded transition absolute top-2 right-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          {/* Action Buttons */}
          <div className="p-4 border-t border-white/5 flex flex-col gap-2">
            <button
              onClick={handleFinish}
              disabled={completedCount === 0 || isProcessingQueue}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continuar con {completedCount} facturas <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold text-sm hover:bg-slate-600 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadProcessor;
