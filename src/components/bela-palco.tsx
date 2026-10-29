import React from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { SpriteId } from '@/game/logica';
import {
  obterSprite,
  SPRITE_ALTURA,
  SPRITE_CORTE_ALTURA,
  SPRITE_CORTE_TOPO,
  SPRITE_LARGURA,
} from '@/game/sprites';
import { COR, FONTE } from '@/game/tema';

type Props = { sprite: SpriteId; energia: number; descricao: string };

/**
 * Mostra a pose atual da Bela. Se a imagem não existir, cai no placeholder geométrico.
 * A imagem é exibida com `resizeMode="contain"` numa janela de proporção idêntica à faixa
 * recortada, então a proporção original é preservada sem distorção.
 */
export function BelaPalco({ sprite, energia, descricao }: Props) {
  const { height: alturaTela } = useWindowDimensions();
  const fonte = obterSprite(sprite);

  const altura = Math.max(220, Math.min(340, Math.round(alturaTela * 0.4)));
  const largura = Math.round((altura * SPRITE_LARGURA) / SPRITE_CORTE_ALTURA);
  const alturaImagem = Math.round((largura * SPRITE_ALTURA) / SPRITE_LARGURA);
  const topo = -Math.round((SPRITE_CORTE_TOPO / SPRITE_LARGURA) * largura);

  if (!fonte) return <BelaPlaceholder energia={energia} />;

  return (
    <View
      style={{ width: largura, height: altura, overflow: 'hidden' }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={descricao}
    >
      <Image
        source={fonte}
        resizeMode="contain"
        fadeDuration={0}
        style={{ position: 'absolute', left: 0, top: topo, width: largura, height: alturaImagem }}
      />
    </View>
  );
}

/** Placeholder temporário, desenhado só com View (usado se um sprite faltar). */
function BelaPlaceholder({ energia }: { energia: number }) {
  const alturaOlho = energia > 30 ? 26 : energia > 10 ? 14 : 4;
  const alturaPupila = alturaOlho > 10 ? alturaOlho - 8 : 2;

  return (
    <View style={estilos.placeholderWrap}>
      <View style={estilos.gato}>
        <View style={[estilos.orelha, { left: 14 }]} />
        <View style={[estilos.orelha, { right: 14 }]} />

        <View style={estilos.cabeca}>
          {[58, 70, 82].map((x) => (
            <View key={x} style={[estilos.listra, { left: x }]} />
          ))}

          <View style={estilos.olhos}>
            {[0, 1].map((i) => (
              <View key={i} style={[estilos.olho, { height: alturaOlho }]}>
                <View style={[estilos.pupila, { height: alturaPupila }]} />
              </View>
            ))}
          </View>

          <View style={estilos.narizWrap}>
            <View style={estilos.nariz} />
          </View>

          <View style={[estilos.bigode, { left: -20, top: 72 }]} />
          <View style={[estilos.bigode, { left: -20, top: 80 }]} />
          <View style={[estilos.bigode, { right: -20, top: 72 }]} />
          <View style={[estilos.bigode, { right: -20, top: 80 }]} />
        </View>
      </View>
      <Text style={estilos.placeholderLegenda}>[ sprite ausente ]</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  placeholderWrap: { alignItems: 'center', gap: 12 },
  gato: { width: 160, height: 130 },
  orelha: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 22,
    borderRightWidth: 22,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COR.pelo,
  },
  cabeca: {
    position: 'absolute',
    top: 24,
    left: 8,
    right: 8,
    height: 100,
    borderRadius: 38,
    backgroundColor: COR.pelo,
  },
  listra: { position: 'absolute', top: 0, width: 5, height: 22, backgroundColor: COR.listra },
  olhos: {
    position: 'absolute',
    top: 34,
    left: 20,
    right: 20,
    height: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  olho: {
    width: 34,
    borderRadius: 17,
    backgroundColor: COR.ambar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupila: { width: 6, borderRadius: 3, backgroundColor: '#111' },
  narizWrap: { position: 'absolute', top: 68, left: 0, right: 0, alignItems: 'center' },
  nariz: { width: 12, height: 8, borderRadius: 4, backgroundColor: '#b98a8a' },
  bigode: { position: 'absolute', width: 34, height: 2, backgroundColor: '#d4d7da' },
  placeholderLegenda: { color: COR.mudo, fontFamily: FONTE, fontSize: 11 },
});
