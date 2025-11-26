import React, { useState } from 'react';
import { useInvoice } from '../contexts/InvoiceContext';
import { Store, Loader2, Building2, ChefHat, Warehouse, Truck, ShoppingCart, Wrench, FileText } from 'lucide-react';
import { CompanyType } from '../types';

const COMPANY_TYPES: Array<{
    value: CompanyType;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}> = [
        {
            value: 'restaurant',
            label: '🍽️ Restaurante',
            description: 'Gestiona inventario de alimentos y bebidas',
            icon: <ChefHat className="w-6 h-6" />,
            color: 'from-orange-500 to-red-500'
        },
        {
            value: 'warehouse',
            label: '📦 Almacén',
            description: 'Control de stock y productos',
            icon: <Warehouse className="w-6 h-6" />,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            value: 'transport',
            label: '🚚 Transporte',
            description: 'Gestión de combustible y mantenimiento',
            icon: <Truck className="w-6 h-6" />,
            color: 'from-green-500 to-emerald-500'
        },
        {
            value: 'retail',
            label: '🛒 Retail',
            description: 'Inventario de productos para venta',
            icon: <ShoppingCart className="w-6 h-6" />,
            color: 'from-purple-500 to-pink-500'
        },
        {
            value: 'services',
            label: '🔧 Servicios',
            description: 'Materiales y herramientas',
            icon: <Wrench className="w-6 h-6" />,
            color: 'from-yellow-500 to-amber-500'
        },
        {
            value: 'other',
            label: '📋 Otro',
            description: 'Uso general',
            icon: <FileText className="w-6 h-6" />,
            color: 'from-slate-500 to-gray-500'
        }
    ];

const CompanySetup: React.FC = () => {
    const { createCompany, loading } = useInvoice();
    const [companyName, setCompanyName] = useState('');
    const [companyType, setCompanyType] = useState<CompanyType>('other');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyName.trim()) {
            setError('Por favor ingresa un nombre para tu empresa');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            await createCompany(companyName.trim(), companyType);
        } catch (err) {
            console.error('Error creating company:', err);
            setError('Error al crear la empresa. Por favor intenta de nuevo.');
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
        );
    }

    const selectedType = COMPANY_TYPES.find(t => t.value === companyType)!;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-50 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 top-10 h-72 w-72 bg-sky-500/20 blur-[120px] rounded-full" />
                <div className="absolute right-0 top-40 h-80 w-80 bg-purple-600/20 blur-[140px] rounded-full" />
            </div>
            <div className="max-w-2xl w-full relative">
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${selectedType.color} rounded-2xl shadow-2xl shadow-slate-900/50 mb-6 transition-all duration-300`}>
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">Bienvenido a FFS.finance</h1>
                    <p className="text-slate-300">
                        Comienza configurando tu primera empresa
                    </p>
                </div>

                <div className="bg-slate-950/70 rounded-3xl shadow-2xl border border-white/10 p-8 backdrop-blur">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="company-name" className="block text-sm font-semibold text-slate-200 mb-2">
                                Nombre de la Empresa
                            </label>
                            <div className="relative">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    id="company-name"
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Ej. Mi Empresa S.A."
                                    disabled={isCreating}
                                    className="w-full pl-11 pr-4 py-3 border border-white/10 rounded-xl focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 outline-none transition disabled:bg-slate-900/50 disabled:cursor-not-allowed text-white placeholder:text-slate-500 bg-slate-900/70"
                                    autoFocus
                                />
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-red-300 flex items-center gap-1">
                                    <span className="font-medium">{error}</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-3">
                                Tipo de Empresa
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {COMPANY_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setCompanyType(type.value)}
                                        disabled={isCreating}
                                        className={`relative p-4 rounded-xl border-2 transition-all text-left group ${companyType === type.value
                                                ? `border-sky-400 bg-sky-500/10 shadow-lg shadow-sky-900/40`
                                                : 'border-white/10 bg-white/5 hover:border-sky-300/40'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center text-white mb-2`}>
                                            {type.icon}
                                        </div>
                                        <div className="font-medium text-sm text-white mb-1">{type.label}</div>
                                        <div className="text-xs text-slate-400">{type.description}</div>
                                        {companyType === type.value && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shadow-lg shadow-sky-900/50">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isCreating || !companyName.trim()}
                            className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-sky-400 hover:to-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Building2 className="w-5 h-5" />
                                    Crear Empresa
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-inner shadow-slate-900/40 text-slate-200">
                    <p className="text-sm">
                        <span className="font-semibold">💡 Tip:</span> Podrás crear múltiples empresas más adelante desde la configuración. La IA analizará tus facturas según el tipo de empresa seleccionado.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CompanySetup;
