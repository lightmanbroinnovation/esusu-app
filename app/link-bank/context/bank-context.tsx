import React, { createContext, useContext, useState } from "react";

interface BankContextType {
    banks: { id?: string; accountNumber?: string | undefined; bankName: string; accountName: string; isPrimary?: boolean }[];
    primaryBankId: string | null;
    addBank: (bank: {  bankName: string; accountName: string; isPrimary?: boolean }) => void;
    removeBank: (id: string) => void;
    setPrimary: (id: string) => void;
}



export const useBank = () => {
    const context = useContext(BankContext);
    if (!context) {
        throw new Error("useBank must be used within a BankProvider");
    }
    return context;
};

const BankContext = createContext<BankContextType | undefined>(undefined);


export const BankProvider = ({ children }: any) => {
    const [banks, setBanks] = useState<{ id?: string; accountNumber?: string; bankName: string; accountName: string; isPrimary?: boolean }[]>([]);
    const [primaryBankId, setPrimaryBankId] = useState<string | null>(null);

    const addBank = (bank: { id?: string; bankName: string; accountName: string; isPrimary?: boolean }) => {
        const newBank = { ...bank, id: Date.now().toString() };
        setBanks((prev) => [...prev, newBank]);
        if (bank.isPrimary) setPrimaryBankId(newBank.id);
    };

    const removeBank = (id: any) => {
        setBanks((prev) => prev.filter((b) => b.id !== id));
        if (primaryBankId === id) setPrimaryBankId(null);
    };

    const setPrimary = (id: any) => setPrimaryBankId(id);

    return (
        <BankContext.Provider value={{ banks, primaryBankId, addBank, removeBank, setPrimary }}>
            {children}
        </BankContext.Provider>
    );
};
