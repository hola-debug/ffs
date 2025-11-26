import React, { createContext, useContext, useState, useEffect } from 'react';
import { restoService, Restaurant } from '../../services/restoService';
import { useSupabaseUser } from '../../hooks/useSupabaseUser';

interface RestoContextType {
    currentRestaurant: Restaurant | null;
    restaurants: Restaurant[];
    loading: boolean;
    refreshRestaurants: () => Promise<void>;
    createRestaurant: (name: string) => Promise<void>;
}

const RestoContext = createContext<RestoContextType | undefined>(undefined);

export function RestoProvider({ children }: { children: React.ReactNode }) {
    const { user } = useSupabaseUser();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshRestaurants = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await restoService.getRestaurants();
            setRestaurants(data);
            if (data.length > 0 && !currentRestaurant) {
                setCurrentRestaurant(data[0]);
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const createRestaurant = async (name: string) => {
        try {
            const newResto = await restoService.createRestaurant(name);
            await refreshRestaurants();
            setCurrentRestaurant(newResto);
        } catch (error) {
            console.error('Error creating restaurant:', error);
            throw error;
        }
    };

    useEffect(() => {
        if (user) {
            refreshRestaurants();
        } else {
            setRestaurants([]);
            setCurrentRestaurant(null);
            setLoading(false);
        }
    }, [user]);

    return (
        <RestoContext.Provider value={{ currentRestaurant, restaurants, loading, refreshRestaurants, createRestaurant }}>
            {children}
        </RestoContext.Provider>
    );
}

export const useResto = () => {
    const context = useContext(RestoContext);
    if (context === undefined) {
        throw new Error('useResto must be used within a RestoProvider');
    }
    return context;
};
