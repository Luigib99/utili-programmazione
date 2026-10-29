import { StyleSheet, TextInput, View, Text } from 'react-native';

export default function BaseTextInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
  returnKeyType = 'done',
  onSubmitEditing,
  onFocus,
  onBlur,
  label,
  containerStyle,
  inputStyle
}) {

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TextInput
        style={[styles.input, inputStyle]}         // Unisce lo stile base dell'input e quello custom
        value={value}                              // Il valore testuale attuale dell'input (stato)
        onChangeText={onChangeText}                // Funzione chiamata ad ogni singolo carattere digitato o cancellato
        placeholder={placeholder}                  // Testo di suggerimento visibile quando l'input è vuoto
        keyboardType={keyboardType}                // Tipo di tastiera che si apre ('default', 'numeric', 'email-address', ecc.)
        secureTextEntry={secureTextEntry}          // Se true, nasconde i caratteri con dei pallini (per le password)
        autoCapitalize={autoCapitalize}            // Comportamento delle maiuscole automatiche ('none', 'sentences', 'words', 'characters')
        autoCorrect={autoCorrect}                  // Abilita o disabilita l'autocorrezione del sistema operativo
        multiline={multiline}                      // Se true, l'input può espandersi su più righe andando a capo
        numberOfLines={multiline ? numberOfLines : 1} // Numero di righe visibili inizialmente (se multiline è true)
        maxLength={maxLength}                      // Limite massimo di caratteri digitabili
        editable={editable}                        // Se false, l'input diventa in sola lettura e non modificabile
        returnKeyType={returnKeyType}              // Cambia l'etichetta del tasto "Invio" sulla tastiera ('done', 'go', 'next', 'search', 'send')
        onSubmitEditing={onSubmitEditing}          // Funzione chiamata quando l'utente preme il tasto "Invio" sulla tastiera
        onFocus={onFocus}                          // Funzione chiamata quando l'input viene "cliccato" e riceve il focus
        onBlur={onBlur}                            // Funzione chiamata quando l'input perde il focus (es. si clicca fuori)
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {},
  input: {
    minHeight: 40, 
    textAlignVertical: 'top', 
  },
});