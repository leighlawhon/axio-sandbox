'use client';
import React, { createContext, useState, useContext } from 'react';

interface AuthContextProps {
    authenticated: boolean;
    checkPasscode: (passcode: string) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authenticated, setAuthenticated] = useState(false);

    const checkPasscode = (passcode: string) => {
        const baCode = process.env.NEXT_PUBLIC_BA_CODE;
        console.log(passcode, baCode, passcode === baCode);
        setAuthenticated(passcode === baCode);
    };

    return (
        <AuthContext.Provider value={{ authenticated, checkPasscode }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};