import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

const FUNDO = '#0a0b0b';

// O jogo é sempre escuro; o fundo do tema evita qualquer flash branco entre telas.
const TEMA_GATO = { ...DarkTheme, colors: { ...DarkTheme.colors, background: FUNDO } };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // A splash nativa já é escura (app.json); a tela do jogo mostra o próprio "carregando".
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={TEMA_GATO}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: FUNDO } }} />
    </ThemeProvider>
  );
}
