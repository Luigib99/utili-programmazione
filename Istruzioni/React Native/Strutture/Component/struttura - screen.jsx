import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';

export default function BaseScreen({ navigation, route }) {
  
  // === 1. STATI E REF ===
  const [data, setData] = useState(null);                 // Stato locale del componente
  const elementRef = useRef(null);                        // Referenza per agganciare componenti (es. ScrollView)

  // === 2. CICLO DI VITA (EFFECTS) ===
  useEffect(() => {
    // Logica eseguita al mount del componente (es. fetch dei dati iniziali)

    return () => {
      // Logica di cleanup eseguita quando si esce dalla pagina (smonto)
    };
  }, []);

  // === 3. FUNZIONI E LOGICA ===
  const handleSyncAction = () => {
    // Esempio di funzione sincrona (es. formattazione dati, calcoli)
  };

  const handleAsyncAction = async () => {
    // Esempio di funzione asincrona (es. chiamate API verso il backend)
    await handleSyncAction();
  };

  // === 4. RENDER STRUTTURALE ===
  return (
    <SafeAreaView style={styles.safeArea}>                {/* Evita che la UI vada sotto il "Notch" o l'Isola Dinamica (iOS) */}
      
      <StatusBar 
        barStyle="dark-content"                           {/* Colore icone di sistema: 'dark-content' (nere) o 'light-content' (bianche) */}
        backgroundColor="transparent"                     {/* Solo Android: colore di sfondo della barra */}
        translucent={false}                               {/* Solo Android: se true, il layout sale fisicamente "sotto" la status bar */}
      />

      <View style={styles.container}>                     {/* Contenitore principale della pagina vera e propria */}
        
        {/* INSERISCI QUI IL CONTENUTO DELLA SCHERMATA */}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,                                              // Obbligatorio: permette alla pagina di coprire l'intera altezza del display
    // backgroundColor: '#ffffff',                        // Inserire il colore di sfondo qui evita bordi neri attorno alla SafeArea
  },
  container: {
    flex: 1,                                              // Obbligatorio: fa espandere il contenuto interno per tutto lo spazio disponibile
    // paddingHorizontal: 16,                             // Decommentare se si desidera un margine laterale fisso per tutta la pagina
  },
});