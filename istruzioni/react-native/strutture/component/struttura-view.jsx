import React from 'react';
import { View } from 'react-native';

export const BaseContainer = ({ children }) => {
  return (
    <View
      pointerEvents="auto"           // 'box-none' (tocchi passano ai figli) | 'none' (ignora tocchi) | 'box-only' (solo contenitore)
      hitSlop={{ top: 10, bottom: 10 }} // Espande l'area cliccabile senza cambiare la grafica
      accessible={true}              // Indica che la View è un elemento unico per lo screen reader
      accessibilityLabel="Descrizione" // Testo letto dallo screen reader
      accessibilityRole="summary"    // Ruolo: 'button', 'header', 'link', 'image', 'search', etc.
      importantForAccessibility="yes" // (Android) 'auto', 'yes', 'no', 'no-hide-descendants'
      onLayout={(event) => {         // Scatta quando la View viene renderizzata o cambia dimensione
        const { x, y, width, height } = event.nativeEvent.layout;
      }}
    >
      {children}
    </View>
  );
};