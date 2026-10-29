import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importa qui i tuoi Screen
// import HomeScreen from '../screens/HomeScreen';
// import DetailScreen from '../screens/DetailScreen';

const Stack = createNativeStackNavigator();

export default function BaseNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // Spesso si nasconde l'header nativo per usare il tuo BaseHeader
          animation: 'slide_from_right', // Animazione fluida standard
        }}
      >
        {/* Definisci qui tutte le rotte dell'app */}
        {/* <Stack.Screen name="Home" component={HomeScreen} /> */}
        {/* <Stack.Screen name="Detail" component={DetailScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}