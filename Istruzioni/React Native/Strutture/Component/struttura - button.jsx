import { StyleSheet, TouchableOpacity, Text } from 'react-native';

export default function BaseButton({ 
  title,
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled = false,
  activeOpacity = 0.7, 
  hitSlop = { top: 10, bottom: 10, left: 10, right: 10 }, 
  delayLongPress = 500, 
  customContainerStyle, 
  customTextStyle 
}) {
  
  return (
    <TouchableOpacity
      style={[
        styles.container, 
        disabled && styles.disabledContainer, 
        customContainerStyle
      ]}                                   // Unisce stile base, stile disabilitato e stili extra passati
      onPress={onPress}                    // Funzione scatenata al tocco rapido e rilascio
      onLongPress={onLongPress}            // Funzione scatenata se l'utente tiene premuto il bottone
      onPressIn={onPressIn}                // Funzione scatenata nel momento esatto in cui il dito tocca lo schermo
      onPressOut={onPressOut}              // Funzione scatenata nel momento esatto in cui il dito si stacca dallo schermo
      disabled={disabled}                  // Disabilita il bottone (non cliccabile)
      activeOpacity={activeOpacity}        // Definisce l'opacità del bottone quando viene premuto (da 0.0 a 1.0)
      hitSlop={hitSlop}                    // Espande l'area cliccabile invisibile intorno al bottone
      delayLongPress={delayLongPress}      // Tempo in millisecondi necessari prima che parta l'evento onLongPress
    >
      {/* Se passi dei figli (es. un'icona), renderizza quelli. Altrimenti renderizza il Testo base */}
      {children ? children : (
        <Text style={[styles.text, customTextStyle]}>
          {title || 'Base Button'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledContainer: {},
  text: {},
});