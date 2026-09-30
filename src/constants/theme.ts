export const THEME = {
  colors: {
    // Official PuerFlix Palette (5 core colors + brand gradations)
    primary: '#FA4340',          // PuerFlix Red (Vermelho principal / coral)
    primaryDark: '#F63C3C',      // Vermelho vivo
    primaryLight: 'rgba(250, 67, 64, 0.15)',
    coralLight: '#FD6C5C',       // Coral claro
    coralSoft: '#FD7E69',        // Coral suave

    secondary: '#2A97EE',        // PuerFlix Blue (Azul principal)
    secondaryLight: 'rgba(42, 151, 238, 0.15)',
    blueLight: '#45B0F7',        // Azul claro
    blueMedium: '#36A3F2',       // Azul intermediário
    blueSoft: '#60C2EC',         // Azul suave
    blueIce: '#D4EBEC',          // Azul muito claro / branco azulado

    mint: '#81D6D1',             // PuerFlix Mint (Verde-menta / turquesa)
    mintLight: 'rgba(129, 214, 209, 0.20)',

    yellow: '#FECB64',           // PuerFlix Yellow (Amarelo principal)
    yellowLight: '#FEE079',      // Amarelo claro
    yellowSoft: '#FDDA89',       // Amarelo suave

    characterBrown: '#753722',   // Marrom escuro do cabelo
    characterBrownMid: '#BB5E44',// Marrom intermediário
    characterPeach: '#FCB07A',   // Tom de pele / pêssego

    white: '#FFFFFF',            // PuerFlix White

    parental: '#2A97EE',         // PuerFlix Blue for Parental Area
    parentalLight: 'rgba(42, 151, 238, 0.15)',
    success: '#81D6D1',          // Mint
    warning: '#FECB64',          // Yellow
    danger: '#FA4340',           // Red

    background: '#121212',       // Pure dark background
    backgroundElevated: '#1E1E1E',
    card: '#1C1C1E',             // Elevated card
    cardHover: '#2C2C2E',
    textPrimary: '#FFFFFF',      // Pure high-contrast white
    textSecondary: '#E2E8F0',    // Slate-200: sharp, high-contrast readable text
    textMuted: '#CBD5E1',        // Slate-300: clear readable secondary text
    border: '#383838',           // Visible boundaries
    chipBackground: '#2A2A2D',
    chipActiveBackground: '#FA4340',
    chipActiveText: '#FFFFFF',
  },
  typography: {
    title: {
      fontSize: 22,
      fontWeight: '800' as const,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '700' as const,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
};
