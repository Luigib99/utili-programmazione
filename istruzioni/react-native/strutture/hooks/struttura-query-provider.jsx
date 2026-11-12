import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Creazione dell'istanza client con le configurazioni globali
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,                     // Se una chiamata fallisce, riprova automaticamente 2 volte prima di dare errore
      staleTime: 1000 * 60 * 5,     // Cache: i dati restano "freschi" per 5 minuti (evita chiamate API doppie inutili)
      refetchOnWindowFocus: false,  // Su React Native si mette spesso false per evitare refresh continui aprendo/chiudendo l'app
      refetchOnMount: true,         // Rifà la chiamata se il componente viene rismontato e l'app non ha i dati freschi
    },
  },
});

export default function BaseQueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}