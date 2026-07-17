import { teamsLightTheme } from '@fluentui/react-components';
import type { Theme } from '@fluentui/react-components';

export const customTheme: Theme = {
  ...teamsLightTheme,
  // Override specific tokens for our institutional theme
  colorBrandForeground1: '#001F3F',
  colorBrandBackground: '#001F3F',
  colorBrandBackgroundHover: '#002A54',
  colorBrandBackgroundPressed: '#00142A',
  
  // Danger / Critical color (Rojo Caribe)
  colorPaletteRedBackground3: '#DC143C',
  colorPaletteRedForeground1: '#DC143C',
  
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

