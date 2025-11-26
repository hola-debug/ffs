import React, { useState } from 'react';
import { useResto } from '../contexts/RestoContext';
import { Store, Loader2, ChefHat, Utensils } from 'lucide-react';

const RestaurantSetup: React.FC = () => {
    const { createRestaurant, loading } = useResto();
    const [restaurantName, setRestaurantName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!restaurantName.trim()) {
            setError('Por favor ingresa un nombre para tu restaurante');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            await createRestaurant(restaurantName.trim());
        } catch (err) {
            console.error('Error creating restaurant:', err);
            setError('Error al crear el restaurante. Por favor intenta de nuevo.');
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-6">
                        <ChefHat className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido a Resto</h1>
                    <p className="text-slate-600">
                        Comienza configurando tu primer restaurante
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="restaurant-name" className="block text-sm font-semibold text-slate-700 mb-2">
                                Nombre del Restaurante
                            </label>
                            <div className="relative">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="restaurant-name"
                                    type="text"
                                    value={restaurantName}
                                    onChange={(e) => setRestaurantName(e.target.value)}
                                    placeholder="Ej. La Trattoria"
                                    disabled={isCreating}
                                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-800 placeholder:text-slate-400"
                                    autoFocus
                                />
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <span className="font-medium">{error}</span>
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isCreating || !restaurantName.trim()}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Utensils className="w-5 h-5" />
                                    Crear Restaurante
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">💡 Tip:</span> Podrás crear múltiples restaurantes más adelante desde la configuración.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RestaurantSetup;
