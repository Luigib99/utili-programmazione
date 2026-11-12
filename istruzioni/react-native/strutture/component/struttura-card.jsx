import { StyleSheet, View, TouchableOpacity } from 'react-native';

export default function BaseCard({ 
  children, 
  onPress,
  containerStyle,
  activeOpacity = 0.8,
  pointerEvents = 'auto',
  onLayout
}) {
  
  // Se viene passato un onPress, la card diventa interattiva (cliccabile)
  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.container, containerStyle]} // Unisce stile base e stile custom passato da fuori
        onPress={onPress}                          // Funzione che si attiva toccando la card
        activeOpacity={activeOpacity}              // Definisce l'opacità al tocco (es. 0.8)
        onLayout={onLayout}                        // Funzione chiamata al render per calcolarne dimensioni e posizione
      >
        {children}                                 {/* Il contenuto interno della card (testi, immagini, ecc.) */}
      </TouchableOpacity>
    );
  }

  // Altrimenti, se non c'è onPress, restituisce un semplice contenitore statico
  return (
    <View 
      style={[styles.container, containerStyle]}   // Unisce stile base e stile custom passato da fuori
      pointerEvents={pointerEvents}                // Decide se la card intercetta i tocchi ('auto', 'none', 'box-none', 'box-only')
      onLayout={onLayout}                          // Funzione chiamata al render per calcolarne dimensioni e posizione
    >
      {children}                                   {/* Il contenuto interno della card (testi, immagini, ecc.) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Nessuna ombra, nessun colore di sfondo o bordo arrotondato.
    // Solo layout strutturale (ad esempio width 100% per assicurarsi che occupi lo spazio necessario)
    width: '100%',
  },
});