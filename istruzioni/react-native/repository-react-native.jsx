//------------------------------------------------------ HOOK ------------------------------------------------------------//

//----------------- USE STATE ----------------//
//Ricarica l'interfaccia se cambia
const [conteggioState, setConteggio] = useState(0);
setConteggio(5);
//----------------- USE REF ------------------//
//Non ricarica l'interfaccia se cambia
const conteggioRef = useRef(null);
conteggioRef.current = 5;

//---------------- USE EFFECT ---------------//
//Si esegue all'avvio e al cambio delle dipendenze
useEffect(() => {
  console.log("Schermo caricato o conteggio cambiato!");
}, [conteggio]);

//---------------- USE MEMO -----------------//
//Memorizza array/oggetti con telecomando
const totaleScontato = useMemo(() => {
  return prezzo * 0.8;
}, [prezzo]);

//-------------- USE CALLBACK --------------//
//Memorizza una funzione con telecomando
const eseguiFunzione = useCallback((id) => {
  console.log('funzione eseguita e non ricreata!')
}, []);

//------------- USE CONTEXT --------------//
//Quando usarlo: Per dati globali (User, Theme, Carrello) accessibili ovunque senza passare props.

//IMPORT
import React, { createContext, useContext, useState } from 'react';

//CONTEXT
const MyContext = createContext();

//PROVIDER (con tutte le funzioni e gli state e ref)
export const MyProvider = ({ children }) => {
  const [data, setData] = useState("Valore Iniziale");

  //preferibile usare il callback per non ricreare sempre lo stato
  const updateData = useCallback((newData) => {
    setData(newData);
  }, []);

  return (
    <MyContext.Provider value={{ data, setData }}>
      {children}
    </MyContext.Provider>
  );
};

// ESPORTO IL CONTEXT PER USARLO
export const useMyData = () => {
  const context = useContext(MyContext);
  if (context === undefined) {
    throw new Error('useMyData deve essere usato all\'interno di un MyProvider');
  }
  return context;
};

//-------------- RICHIAMARSI CONTEXT -------------//

//IMPORTO
import { useMyData } from './MyContext';

//COMPONENTE IN CUI USARLA
export default function MyComponent() {
  //...
  //DICHIARO LE PROPS DA PRENDERE E LE USO DOVE VOGLIO
  const { data, setData } = useMyData();

  return (
  //....
)
}
//-------------------------------------------------- OGGETTO ------------------------------------------------------//

//CREARLO
const nomeOggetto = {
  elemento1: 1,
  elemento2: 2,
  elemento3: 3,
};

// MODIFICARE un valore esistente
nomeOggetto.elemento1 = 99; 

// AGGIUNGERE un nuovo elemento (basta inventare il nome)
nomeOggetto.elemento4 = 4;  

// ELIMINARE un elemento
delete nomeOggetto.elemento2;

//PRATICA CORRETTA
const nuovoOggettoAggiornato = {
  ...nomeOggetto,       // Prendi tutto quello che c'era in nomeOgetto
  elemento1: 99,       // Sovrascrivi SOLO elemento1
  elementoNuovo: 50    // Aggiungi un elemento nuovo
};

//-------------------------------------------------- ANIMAZIONE ------------------------------------------------------//

//1 BINARIO
const opacitaAnimata = useRef(new Animated.Value(0)).current;
//2 BINARI
const posizioneXYCompleta = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
const posizioneXYCorta = useRef(new Animated.ValueXY()).current;

//---------OPACITA---------//

//REF
const opacita = useRef(new Animated.Value(0)).current;

//FUNZIONI
//lineare
Animated.timing(motore, {
  duration: durata
})
//Rimbalzo
Animated.spring(motore, {
  friction: attrito,
  tension: forza
})
//Lancio
Animated.decay(motore, {
  decay: decellerazioneLancio
})
//tutte insieme
Animated.parallel([
  anim1,
  anim2
])
//una dopo l'altra
Animated.sequence([
  anim1,
  anim2
])
//tutte insieme ma con ritardo
Animated.stagger(ritardo, [
  anim1,
  anim2
])
//loop
Animated.loop(
  tuaAnimazione
)

//ESEMPI
//----OPACITA-------//
//FUNZIONE PER FAR COMPARIRE
const faiApparire = () => {
  Animated.timing(opacita, {
    toValue: 1,             // Arriva a 1 (Visibilità totale)
    duration: 1000,         // Mettici 1 secondo (1000 millisecondi)
    useNativeDriver: true,  // Regola d'oro per le performance
  }).start();               // Fai partire il timer!
};

//FUNZIONE PER FAR SCOMPARIRE
const faiScomparire = () => {
  Animated.timing(opacita, {
    toValue: 0,             // Torna a 0 (Invisibilità totale)
    duration: 1000,         // Mettici sempre 1 secondo
    delay: 0,                // Ritardo
    useNativeDriver: true,
  }).start();
};

//ELEMENTO CHE USA L'OPACITA
<Animated.View style={[styles.quadratoRosso, { opacity: miaOpacita }]}>
  <Text>Eccomi!</Text>
</Animated.View>

//---------MOVIMENTO----------//
const spostamento = useRef(new Animated.Value(0)).current;

//FUNZIONE PER FAR MUOVERE
const faiMuovere = () => {
  Animated.timing(spostamento, {
    toValue: 150,           // Spostati di 150 pixel
    duration: 1000,         // Mettici 1 secondo
    delay: 0,                // Ritardo
    useNativeDriver: true,  // Fondamentale per far muovere la casella senza scatti
  }).start();
}

//ELEMENTO CHE SI MUOVE
<Animated.View style={{ transform: [{ translateX: spostamento }] }}>
  <Text>Io mi sposterò a destra!</Text>
</Animated.View>

//per cambiare verso
translateX > 0 //destra
translateX < 0 //sinistra
translateY < 0 //alto
translateY > 0 //basso

//-------------------------------------------------- TAN STACK QUERY ------------------------------------------------------//

//------ STRUTTURA HOOK LETTURA (useQuery) -------//
export const useLetturaHook = () => {
  return useQuery({
    queryKey: ['chiave-lettura', parametro], //aggiungo una chiave e un parametro (se mi serve nel service)
    queryFn: () => UtenteServices.nomeService(parametro), //faccio la chiamata del service
    enabled: !!parametro, //sicurezza: fa aprtire la chimata solo se esiste il parametro
  });
};

//------ STRUTTURA HOOK AZIONE (useMutation) -------//
export const useAzioneHook = () => {

  const queryClient = useQueryClient(); //telecomando OBBLIGATORIO

  return {
    eseguiAzione: useMutation({
      mutationFn: (parametro) => UtenteServices.salvaNome(parametro), //Quando il componente chiama mutate si esegue
      onMutate: async (nuovoNome) => {...},  //Scatta istantaneamente
      onError: (errore, nuovoNome, context) => {...}, //scatta se il server dà errore
      onSuccess: () => {... }, //scatta se il server non da errore
      onSettled: () => {... }, //Scatta sempre alla fine
    })
  };
};

//------ QUERY CLIENT (comandi hook azione)-------//

// getQueryData
const datiVecchi = queryClient.getQueryData(['profilo']); //leggo dalla memoria in modo silenzioso.
//cancelQueries
await queryClient.cancelQueries({ queryKey: ['profilo'] }); //blocca istantaneamente qualsiasi download o chiamata di rete
//prefetchQuery
queryClient.prefetchQuery({ queryKey: ['profilo'], queryFn: () => UtenteServices.getProfilo() });  //Scarica i dati prima ancora che l'utente apra la pagina 
//fetchQuery
const dati = await queryClient.fetchQuery({ queryKey: ['profilo'], queryFn: () => UtenteServices.getProfilo() }) //È come useQuery, ma si usa fuori dai componenti React

//----------- ESEMPIO HOOK COMPLETO ---------//

//import
import { useQuery } from '@tanstack/react-query';
import UtenteServices from '../services/utenteServices';

// HOOK PER LEGGERE
export const useLetturaProfilo = () => {
  return useQuery({
    queryKey: ['profilo'],
    queryFn: () => UtenteServices.getProfilo(),
  });
};

// HOOK PER MODIFICARE
export const useAzioneProfilo = () => {
  const queryClient = useQueryClient();

  return {
    // 1) MANDO DATI AL SERVER: invalidateQueries
    salvaNomeSulServer: useMutation({
      mutationFn: (nuovoNome) => UtenteServices.salvaNome(nuovoNome),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['profilo'] });
      }
    }),

    // 2) CAMBIA SENZA SERVER: setQueryData
    cambiaNomeIstantaneo: () => {
      queryClient.setQueryData(['profilo'], { nome: 'Hacker', email: 'hacker@web.com' });
    },

    // 3) DISTRUGGE MEMORIA: removeQueries
    eseguiLogout: () => {
      queryClient.removeQueries({ queryKey: ['profilo'] });
    },

    //4) CASO: L'UNIONE PERFETTA (Ottimistico)
    salvaNomeOttimistico: useMutation({

      mutationFn: (nuovoNome) => UtenteServices.salvaNome(nuovoNome),
      onMutate: async (nuovoNome) => {
        await queryClient.cancelQueries({ queryKey: ['profilo'] });
        // Falso aggiornamento istantaneo a schermo
        const datiVecchi = queryClient.getQueryData(['profilo']);
        // Mantiene tutti i dati vecchi, sovrascrive solo il nome
        queryClient.setQueryData(['profilo'], (datiPrecedenti) => {
          return { ...datiPrecedenti, nome: nuovoNome };
        });
        return { datiVecchi };
      },
      onError: (errore, nuovoNome, context) => {
        // Se il server esplode, rimette a schermo il dato vecchio
        queryClient.setQueryData(['profilo'], context.datiVecchi);
      },
      onSettled: () => {
        // Alla fine, si allinea col server per sicurezza
        queryClient.invalidateQueries({ queryKey: ['profilo'] });
      }
    })
  };
};

//-------- COMPONENT -------//
//import hook
import { useLetturaProfilo, useAzioneProfilo } from '../hooks/useUtente';

export default function SchermataDashboard() {

  // richiamiamo hook lettura
  const {
    data: datiCaricati, // diamo un nome ai dati dell'hook
    isLoading: caricamentoIniziale, //diamo un nome al al booleano caricamento inziale se carica (true) o no (false)
    isFetching: caricamentoContinuo, //diamo un nome al al booleano caricamento continuo se carica (true) o no (false)
    isSuccess: booleanSuccesso, //diamo un nuome al booleano se riesce a scaricare i dati
    isError: booleanErrore, // diamo un nome al booleano se c'è un errore (true) o no (false)
    error: dettagliErrore, // diamo un nome al messaggio dell'errore
    refetch: ricaricaDatiManualmente, //diamo un nome alla funzione di ricarica manuale
  } = useLetturaProfilo();

  //richiamo hook azione
  const { salvaNomeSulServer, cambiaNomeIstantaneo, eseguiLogout } = useAzioneProfilo();

  //body
  return (
    <View>
      <Text>Email: {datiCaricati.email}</Text>
      <Text>Nome: {datiCaricati.nome}</Text>
      <Button title="Aggiorna Profilo" onPress={ricaricaDatiManualmente} />
    </View>
  )
}