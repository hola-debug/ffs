
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

  const handleFinish = () => {
    const drafts = queue
      .filter(j => j.status === 'success' && j.result)
      .map(j => j.result!);
    onAnalysisComplete(drafts);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Cinta de Procesamiento (Modo Batch)</h2>
            <p className="text-sm text-slate-500">Sube múltiples facturas. Se aplicarán las plantillas inteligentes automáticamente.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">
              Cancelar
            </button>
            <button
              onClick={handleFinish}
              disabled={completedCount === 0}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium shadow-sm transition ${completedCount > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
                }`}
            >
              Revisar ({completedCount}) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Dropzone */}
          <div className="md:w-1/2 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50">
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl flex-1 flex flex-col items-center justify-center p-10 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Arrastra o Selecciona</h3>
              <p className="text-slate-500 mb-8 text-center max-w-xs">Soporta carga múltiple. La IA detectará el proveedor y ajustará el layout.</p>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
                Elegir Archivos
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                multiple
              />
            </div>
          </div>

          {/* Right: Queue List */}
          <div className="md:w-1/2 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">Cola de Procesamiento</h3>
              {isProcessingQueue && <span className="text-xs text-blue-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Procesando...</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {queue.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Play className="w-12 h-12 mb-2 opacity-20" />
                  <p>La cola está vacía</p>
                </div>
              )}
              {queue.map((job) => (
                <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition group relative">
                  <img src={job.preview} alt="Thumb" className="w-12 h-12 rounded object-cover border border-slate-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{job.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {job.status === 'pending' && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Pendiente</span>}
                      {job.status === 'processing' && <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Analizando</span>}
                      {job.status === 'success' && <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completado</span>}
                      {job.status === 'error' && <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Error</span>}

                      {/* Smart Badge */}
                      {job.status === 'success' && job.result?.isSmartMatch && (
                        <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Plantilla de proveedor aplicada automáticamente">
                          <Sparkles className="w-2.5 h-2.5" /> Auto
                        </span>
                      )}
                    </div>
                  </div>
                  {job.status === 'success' && job.result && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">${job.result.total.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[80px]">{job.result.vendorName}</p>
                    </div>
                  )}
                  <button onClick={() => removeJob(job.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition absolute top-2 right-2">
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
