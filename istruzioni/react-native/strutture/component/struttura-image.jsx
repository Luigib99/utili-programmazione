import { StyleSheet, Image, View } from 'react-native';

export default function BaseImage({ 
  source, 
  containerStyle, 
  imageStyle,
  resizeMode = 'cover',
  defaultSource,
  onLoadStart,
  onLoad,
  onLoadEnd,
  onError
}) {

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={source}                        // L'immagine vera e propria: { uri: 'https...' } oppure require('./img.png')
        style={[styles.image, imageStyle]}     // Stile dell'immagine (obbligatorio dare width e height se l'immagine è remota)
        resizeMode={resizeMode}                // 'cover' (taglia i bordi), 'contain' (mostra tutta ma lascia spazi), 'stretch' (deforma)
        defaultSource={defaultSource}          // Immagine di fallback mostrata durante il caricamento (solo per iOS locale)
        onLoadStart={onLoadStart}              // Funzione chiamata appena inizia il download dell'immagine
        onLoad={onLoad}                        // Funzione chiamata quando l'immagine è stata scaricata con successo
        onLoadEnd={onLoadEnd}                  // Funzione chiamata alla fine (sia in caso di successo che di errore)
        onError={onError}                      // Funzione chiamata se l'immagine fallisce il caricamento
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Utile se vuoi gestire l'immagine dentro un blocco specifico (es. overflow: 'hidden')
  },
  image: {
    // Strutturalmente le immagini in RN necessitano spesso di dimensioni esplicite
    width: '100%',
    height: '100%',
  },
});