import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserBankAccounts, addBankAccount } from "../../../services/api";

interface Bank {
    id?: string;
    accountNumber: string;
    bankName: string;
    accountName: string;
    isPrimary?: boolean;
    createdAt?: string;
}

interface BankContextType {
    banks: Bank[];
    isLoading: boolean;
    error: string | null;
    primaryBankId: string | null;
    addBank: (bank: { bankName: string; accountName: string; accountNumber: string; isPrimary?: boolean }) => Promise<void>;
    removeBank: (id: string) => void;
    setPrimary: (id: string) => void;
    refreshBanks: () => Promise<void>;
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
    const [banks, setBanks] = useState<Bank[]>([]);
    const [primaryBankId, setPrimaryBankId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Load user ID from AsyncStorage
    useEffect(() => {
        const loadUserId = async () => {
            try {
                const id = await AsyncStorage.getItem('userId');
                if (id) {
                    setUserId(id);
                } else {
                    setError("User not logged in");
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Error loading user ID:", err);
                setError("Error loading user data");
                setIsLoading(false);
            }
        };
        
        loadUserId();
    }, []);

    // Load banks when userId is available
    useEffect(() => {
        if (userId) {
            fetchUserBanks();
        }
    }, [userId]);

    const fetchUserBanks = async () => {
        if (!userId) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const bankAccounts = await getUserBankAccounts(userId);
            setBanks(bankAccounts);
            
            // Set primary bank ID if any account is marked as primary
            const primaryBank = bankAccounts.find(bank => bank.isPrimary);
            if (primaryBank) {
                setPrimaryBankId(primaryBank.id || null);
            }
            
            console.log("Loaded banks:", bankAccounts);
        } catch (err) {
            console.error("Error fetching banks:", err);
            setError("Could not load your bank accounts");
        } finally {
            setIsLoading(false);
        }
    };

    const refreshBanks = async () => {
        await fetchUserBanks();
    };

    const addBank = async (bank: { bankName: string; accountName: string; accountNumber: string; isPrimary?: boolean }) => {
        if (!userId) {
            setError("User not logged in");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const updatedBanks = await addBankAccount(userId, bank);
            setBanks(updatedBanks);
            
            // Update primary bank ID if this is a primary account
            if (bank.isPrimary) {
                const primaryBank = updatedBanks.find(b => b.isPrimary);
                if (primaryBank) {
                    setPrimaryBankId(primaryBank.id || null);
                }
            }
            
            console.log("Bank added successfully");
        } catch (err) {
            console.error("Error adding bank:", err);
            setError("Could not add bank account");
        } finally {
            setIsLoading(false);
        }
    };

    const removeBank = (id: string) => {
        // This would need to be updated to use an API call
        setBanks((prev) => prev.filter((b) => b.id !== id));
        if (primaryBankId === id) setPrimaryBankId(null);
    };

    const setPrimary = (id: string) => {
        // This would need to be updated to use an API call
        setPrimaryBankId(id);
    };

    return (
        <BankContext.Provider value={{ 
            banks, 
            primaryBankId, 
            isLoading,
            error,
            addBank, 
            removeBank, 
            setPrimary,
            refreshBanks
        }}>
            {children}
        </BankContext.Provider>
    );
};
