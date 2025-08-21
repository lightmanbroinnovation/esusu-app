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
        setIsLoading(true);
        setError(null);
        try {
            const bankAccounts = await getUserBankAccounts();
            console.log('[BankContext] Raw bank accounts from API:', bankAccounts);
            // Map the returned data to the expected Bank type
            const mappedBanks = (bankAccounts || []).map((bank: any) => {
                console.log('[BankContext] Mapping bank:', bank);
                // Fallback for missing accountNumber or bankName
                let accountNumber = bank.accountNumber || '';
                let bankName = bank.bankName || '';
                // If bankName is missing but bankCode is present, use bankCode as fallback
                if (!bankName && bank.bankCode) {
                  bankName = String(bank.bankCode);
                }
                return {
                    id: bank.id || bank._id,
                    accountName: bank.accountName || '',
                    accountNumber,
                    bankName,
                    isPrimary: bank.isPrimary,
                    createdAt: bank.createdAt,
                };
            });
            console.log('[BankContext] Mapped banks:', mappedBanks);
            setBanks(mappedBanks);
            // Set primary bank ID if any account is marked as primary
            const primaryBank = mappedBanks.find(bank => bank.isPrimary);
            if (primaryBank) {
                setPrimaryBankId(primaryBank.id);
                console.log('[BankContext] Set primary bank ID:', primaryBank.id);
            }
        } catch (error) {
            console.error('[BankContext] Error fetching banks:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch banks');
            setBanks([]);
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
