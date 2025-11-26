import React, { createContext, useContext, useState, useEffect } from 'react';
import { invoiceService, Company, CompanyType } from '../../services/invoiceService';
import { useSupabaseUser } from '../../hooks/useSupabaseUser';

interface InvoiceContextType {
    currentCompany: Company | null;
    companies: Company[];
    loading: boolean;
    refreshCompanies: () => Promise<void>;
    createCompany: (name: string, type: CompanyType) => Promise<void>;
    setCurrentCompany: (company: Company) => void;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
    const { user } = useSupabaseUser();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshCompanies = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await invoiceService.getCompanies();
            setCompanies(data);
            if (data.length > 0 && !currentCompany) {
                setCurrentCompanyState(data[0]);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const createCompany = async (name: string, type: CompanyType) => {
        try {
            const newCompany = await invoiceService.createCompany(name, type);
            await refreshCompanies();
            setCurrentCompanyState(newCompany);
        } catch (error) {
            console.error('Error creating company:', error);
            throw error;
        }
    };

    const setCurrentCompany = (company: Company) => {
        setCurrentCompanyState(company);
    };

    useEffect(() => {
        if (user) {
            refreshCompanies();
        } else {
            setCompanies([]);
            setCurrentCompanyState(null);
            setLoading(false);
        }
    }, [user]);

    return (
        <InvoiceContext.Provider value={{ currentCompany, companies, loading, refreshCompanies, createCompany, setCurrentCompany }}>
            {children}
        </InvoiceContext.Provider>
    );
}

export const useInvoice = () => {
    const context = useContext(InvoiceContext);
    if (context === undefined) {
        throw new Error('useInvoice must be used within an InvoiceProvider');
    }
    return context;
};

// Keep legacy export for gradual migration
export const useResto = useInvoice;
export const RestoProvider = InvoiceProvider;
