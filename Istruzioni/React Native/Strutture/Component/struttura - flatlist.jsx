import { StyleSheet, View, FlatList } from 'react-native';

export default function BaseList({ 
  data, 
  renderItem, 
  keyExtractor,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
  onRefresh,
  refreshing = false,
  onEndReached,
  onEndReachedThreshold = 0.5,
  horizontal = false,
  numColumns = 1, 
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = true,
  containerStyle,
  contentContainerStyle
}) {

  return (
    <View style={[styles.container, containerStyle]}>
      <FlatList
        data={data}                                    // L'array di dati (oggetti o primitive) da renderizzare
        renderItem={renderItem}                        // La funzione che disegna graficamente il singolo elemento ({item, index})
        keyExtractor={keyExtractor}                    // Funzione che deve restituire una stringa univoca per ogni elemento (l'ID)
        ListHeaderComponent={ListHeaderComponent}      // Componente da mostrare in cima alla lista (scrolla con essa)
        ListFooterComponent={ListFooterComponent}      // Componente da mostrare in fondo alla lista (es. loader infinite scroll)
        ListEmptyComponent={ListEmptyComponent}        // Componente da mostrare se l'array 'data' è vuoto o null
        ItemSeparatorComponent={ItemSeparatorComponent} // Componente da renderizzare TRA un elemento e l'altro
        onRefresh={onRefresh ? onRefresh : undefined}  // Funzione chiamata quando si tira la lista verso il basso (Pull-to-refresh)
        refreshing={refreshing}                        // Booleano che indica se sta girando la rotellina "Pull-to-refresh"
        onEndReached={onEndReached}                    // Funzione chiamata quando si arriva vicino alla fine della lista
        onEndReachedThreshold={onEndReachedThreshold}  // Quanto vicini alla fine bisogna essere per chiamare onEndReached (0.5 = metà schermata)
        horizontal={horizontal}                        // Se true, la lista scrolla orizzontalmente
        numColumns={numColumns > 1 && !horizontal ? numColumns : undefined} // Divide in N colonne (non va se horizontal={true})
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}     // Mostra/nasconde barra di scorrimento verticale
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator} // Mostra/nasconde barra di scorrimento orizzontale
        contentContainerStyle={[styles.listContent, contentContainerStyle]} // Stili applicati al contenitore degli elementi
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
  },
  listContent: {
    flexGrow: 1,
  },
});