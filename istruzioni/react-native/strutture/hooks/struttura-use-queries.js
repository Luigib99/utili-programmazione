import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getService, postService } from '../services/nomeService';

//=== GET ====/
export const useNomeGetQuery = (params) => {
  return useQuery({
    queryKey: ['nome_key', params],    // CHIAVE UNIVOCA: TanStack usa questo array per la cache. Se 'params' cambia, rifà la chiamata API in automatico.
    queryFn: () => getService(params),    // La chiamata API
    // enabled: !!params.id,              // (Opzionale) Se decommentato, la chiamata parte SOLO se c'è un id valido
  });
};

//=== POST/PATCH/DELETE ====/
export const useNomeMutation = () => {
  const queryClient = useQueryClient();

  //NOME MUTATION
  const nomeMutation = useMutation({
    mutationFn: (payload) => postService(payload),                   // La chiamata API
    onSuccess: (data) => {                                           // Quando la chiamata va a buon fine
      queryClient.invalidateQueries({ queryKey: ['nome_key'] });
    },
    onMutate: async () => { '...' },                                 //Scatta istantaneamente
    onError: (error) => { '...' },                                   //se il server dà errore
    onSettled: () => { '...' },                                      //sempre alla fine
  })


  return {
    //ritorna qui le tue mutations
    //ASINCRONE: nomeEventAsincrono: nomeMutation.mutateAsync,
    //SINCRONE nomeEvent: nomeMutation.mutate,
    //PENDING SALVATAGGIO: isSaving: nomeMutation1.isPending || nomeMutation2.isPending,
  }
}

