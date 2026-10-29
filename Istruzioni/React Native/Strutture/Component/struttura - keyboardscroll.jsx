import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';

export default function BaseKeyboardScroll({ 
  children, 
  containerStyle, 
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  behavior = Platform.OS === 'ios' ? 'padding' : undefined,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = true,
  bounces = true,
}) {

  return (
    <KeyboardAvoidingView 
      style={[styles.container, containerStyle]}           // Stile del contenitore esterno
      behavior={behavior}                                  // 'padding', 'height' o 'position'. Su iOS 'padding' è quasi sempre il migliore
      keyboardVerticalOffset={keyboardVerticalOffset}      // Aggiunge spazio extra se hai un header personalizzato
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]} // Stile del contenuto scrollabile (es. padding interno)
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}                 // 'handled' permette di chiudere la tastiera toccando fuori dai campi
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}           // Mostra/nasconde la barra laterale
        bounces={bounces}                                                     // Effetto "rimbalzo" a fine scroll (tipico di iOS)
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Assicura che prenda tutto lo spazio dello schermo
  },
  scrollContent: {
    flexGrow: 1, // Permette al contenuto di crescere, utile se gli elementi sono pochi e vuoi centrarli
  },
});