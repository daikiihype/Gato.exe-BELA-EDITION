import { Platform } from 'react-native';

/** Paleta do GATO.EXE. Compartilhada pela tela e pelos componentes do jogo. */
export const COR = {
  fundo: '#0a0b0b',
  painel: '#151717',
  painelClaro: '#202324',
  bordaClara: '#5a6064',
  bordaEscura: '#030303',
  lime: '#b6ff00',
  limeEscuro: '#4f6d00',
  texto: '#c9cdd1',
  mudo: '#7b8186',
  ambar: '#ffb000',
  perigo: '#ff4d3d',
  pelo: '#8c9094',
  listra: '#3b3e41',
};

export const FONTE = Platform.select({ ios: 'Courier', default: 'monospace' });
