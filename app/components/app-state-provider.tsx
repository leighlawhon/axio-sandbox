'use client'

import { createContext, useState, ReactNode, useContext } from 'react'

const AppStateContext = createContext<
    | {
        isGenerating: boolean
        setIsGenerating: (value: boolean) => void
        isVerified: boolean
        setIsVerified: (value: boolean) => void
    }
    | undefined
>(undefined)


export const AppStateProvider = ({ children }: { children: ReactNode }) => {
    const [isGenerating, setIsGenerating] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    console.log('isGenerating', isGenerating);

    return (
        <AppStateContext.Provider value={{ isVerified, setIsVerified, isGenerating, setIsGenerating }}>
            {children}
        </AppStateContext.Provider>
    )
}

export const useAppState = () => {
    const context = useContext(AppStateContext)
    if (!context) {
        throw new Error('useAppState must be used within an AppStateProvider')
    }
    return context
}
