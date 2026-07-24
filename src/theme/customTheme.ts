import { teamsLightTheme, teamsDarkTheme } from '@fluentui/react-components';
import type { Theme } from '@fluentui/react-components';

export const customTheme: Theme = {
  ...teamsLightTheme,
  // Override specific tokens for our Google-style theme
  colorBrandForeground1: '#1a73e8',
  colorBrandBackground: '#1a73e8',
  colorBrandBackgroundHover: '#1557b0',
  colorBrandBackgroundPressed: '#0b4c8c',
  
  // Danger / Critical color (Google Red)
  colorPaletteRedBackground3: '#ea4335',
  colorPaletteRedForeground1: '#ea4335',
  
  // Backgrounds
  colorNeutralBackground1: '#F8F9FA',
  colorNeutralBackground2: '#FFFFFF',
  
  // Text
  colorNeutralForeground1: '#2D3748',
  colorNeutralForeground2: '#636F7D',
  
  // Borders
  colorNeutralStroke1: '#E8EAED',
  colorNeutralStroke2: '#E8EAED',
};

export const customDarkTheme: Theme = {
  ...teamsDarkTheme,
  // Override specific tokens for our Google-style dark theme
  colorBrandForeground1: '#8ab4f8',
  colorBrandBackground: '#8ab4f8',
  colorBrandBackgroundHover: '#aecbfa',
  colorBrandBackgroundPressed: '#669df6',
  
  // Danger / Critical color (Google Light Red)
  colorPaletteRedBackground3: '#f28b82',
  colorPaletteRedForeground1: '#f28b82',
  
  // Backgrounds - premium dark colors
  colorNeutralBackground1: '#121212',
  colorNeutralBackground2: '#1E1E1E',
  colorNeutralBackground3: '#2D2D2D',
  
  // Text
  colorNeutralForeground1: '#E2E8F0',
  colorNeutralForeground2: '#A0AEC0',
  
  // Borders
  colorNeutralStroke1: '#2D3748',
  colorNeutralStroke2: '#2D3748',
};


