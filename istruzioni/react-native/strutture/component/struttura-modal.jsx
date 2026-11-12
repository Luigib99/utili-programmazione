import { StyleSheet, View, Modal } from 'react-native';

export default function BaseModal({ 
  visible = false,
  children,
  animationType = 'slide',
  transparent = true,
  onRequestClose,
  onShow,
  onDismiss,
  presentationStyle,
  statusBarTranslucent = false,
  hardwareAccelerated = false,
  overlayStyle,
  contentContainerStyle
}) {

  return (
    <Modal
      visible={visible}                           // Booleano che determina se il modal è aperto (true) o chiuso (false)
      animationType={animationType}               // Animazione di apertura: 'none', 'slide' (dal basso) o 'fade' (dissolvenza)
      transparent={transparent}                   // Se true, il background nativo è trasparente (necessario per vedere l'overlay sotto)
      onRequestClose={onRequestClose}             // FONDAMENTALE su Android: funzione chiamata quando si preme il tasto fisico "Indietro"
      onShow={onShow}                             // Funzione chiamata nel momento esatto in cui l'animazione di apertura finisce
      onDismiss={onDismiss}                       // Funzione chiamata quando il modal viene chiuso (supportato principalmente su iOS)
      presentationStyle={presentationStyle}       // Solo iOS: come si presenta ('fullScreen', 'pageSheet', 'formSheet', 'overFullScreen')
      statusBarTranslucent={statusBarTranslucent} // Solo Android: permette al modal di coprire anche la barra di stato in alto
      hardwareAccelerated={hardwareAccelerated}   // Solo Android: forza l'accelerazione hardware per migliorare le performance
    >
      {/* Contenitore esterno, tipicamente usato per creare l'effetto "sfondo scuro" (overlay) */}
      <View style={[styles.overlay, overlayStyle]}>
        
        {/* Contenitore effettivo in cui andrà il tuo layout (es. la finestrella bianca) */}
        <View style={[styles.modalContent, contentContainerStyle]}>
          {children}                              {/* Qui dentro verranno renderizzati i componenti che passerai al modal */}
        </View>
        
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, 
    // Struttura base per centrare il contenuto del modal nello schermo
    justifyContent: 'center', 
    alignItems: 'center',
  },
  modalContent: {
    // Solo layout strutturale per dare una larghezza di partenza (modificabile da fuori)
    width: '100%',
  },
});