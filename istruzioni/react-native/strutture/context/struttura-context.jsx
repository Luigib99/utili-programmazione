import React, { createContext, useState, useContext, useMemo } from 'react';

// 1. CREAZIONE DEL CONTEXT
const BaseContext = createContext();

// 2. PROVIDER (Il componente che avvolgerà l'app)
export const BaseProvider = ({ children }) => {
  
  // === STATO GLOBALE ===
  const [user, setUser] = useState(null);               // Esempio: Dati dell'utente loggato
  const [isLoading, setIsLoading] = useState(false);     // Esempio: Stato di caricamento globale
  const [theme, setTheme] = useState('light');          // Esempio: Tema dell'interfaccia

  // === AZIONI (Funzioni per modificare lo stato) ===
  const login = (userData) => {
    setUser(userData);                                  // Imposta i dati utente dopo il login
  };

  const logout = () => {
    setUser(null);                                      // Resetta l'utente al logout
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light')); // Cambia il tema tra light e dark
  };

  // === OTTIMIZZAZIONE (useMemo) ===
  // Evita re-render inutili dei componenti figli se i valori non cambiano
  const value = useMemo(() => ({
    user,                                               // Espone lo stato 'user'
    setUser,                                            // Espone la funzione per settare 'user'
    isLoading,                                          // Espone lo stato 'isLoading'
    setIsLoading,                                       // Espone la funzione per settare 'isLoading'
    theme,                                              // Espone lo stato 'theme'
    login,                                              // Espone la funzione 'login'
    logout,                                             // Espone la funzione 'logout'
    toggleTheme                                         // Espone la funzione 'toggleTheme'
  }), [user, isLoading, theme]);                        // Dipendenze: si aggiorna solo se questi cambiano

  return (
    <BaseContext.Provider value={value}>
      {children}                                        {/* Rende accessibile il contesto a tutti i figli */}
    </BaseContext.Provider>
  );
};

// 3. HOOK PERSONALIZZATO (Per usare il context facilmente)
export const useBaseContext = () => {
  const context = useContext(BaseContext);              // Recupera i dati dal Context
  
  if (!context) {
    // Errore di sicurezza: protegge dall'uso del context fuori dal Provider
    throw new Error('useBaseContext deve essere usato all\'interno di un BaseProvider');
  }
  
  return context;
};