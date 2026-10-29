import type { ImageSourcePropType } from 'react-native';

import type { SpriteId } from './logica';

/**
 * ÚNICO lugar que conhece os arquivos de imagem da Bela.
 * Para trocar a arte (por exemplo, por PNG com transparência real), altere só os `require` abaixo
 * (e as constantes de tamanho, se as proporções mudarem).
 * Os `require` precisam ser literais estáticos para o Metro empacotar as imagens.
 */
export const SPRITES: Record<SpriteId, ImageSourcePropType> = {
  idle: require('../../assets/sprites/bela-idle.png'),
  feliz: require('../../assets/sprites/bela-feliz.png'),
  faminta: require('../../assets/sprites/bela-faminta.png'),
  cansada: require('../../assets/sprites/bela-cansada.png'),
  dormindo: require('../../assets/sprites/bela-dormindo.png'),
  brincando: require('../../assets/sprites/bela-brincando.png'),
  carinho: require('../../assets/sprites/bela-carinho.png'),
  curiosa: require('../../assets/sprites/bela-curiosa.png'),
  brava: require('../../assets/sprites/bela-brava.png'),
  comemorando: require('../../assets/sprites/bela-comemorando.png'),
  arteira: require('../../assets/sprites/bela-arteira.png'),
  arteira2: require('../../assets/sprites/bela-arteira2.png'),
  lendaria: require('../../assets/sprites/bela-lendaria.png'),
};

/**
 * Os PNG de assets/sprites/ são recortes automáticos (fundo removido por IA) dos JPEG originais de
 * assets/images/, que continuam intactos. Todos têm a mesma tela de 688x1145 px com a gata na
 * faixa central, então a Bela não "pula" ao trocar de pose.
 */
export const SPRITE_LARGURA = 688;
export const SPRITE_ALTURA = 1145;
export const SPRITE_CORTE_TOPO = 0;
export const SPRITE_CORTE_ALTURA = 1145;

/** Retorna a imagem da pose; se faltar, cai em `idle`; se também faltar, null (placeholder). */
export function obterSprite(id: SpriteId): ImageSourcePropType | null {
  return SPRITES[id] ?? SPRITES.idle ?? null;
}
