import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BelaPalco } from '@/components/bela-palco';
import { META_SELOS, MAX } from '@/game/logica';
import { COR, FONTE } from '@/game/tema';
import { useJogo } from '@/game/use-jogo';

/* ------------------------------------------------------------------ */
/* COMPONENTES VISUAIS                                                 */
/* (se o arquivo crescer, mova para src/components/)                   */
/* ------------------------------------------------------------------ */

function Janela({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={estilos.janela}>
      <View style={estilos.barraTitulo}>
        <Text style={estilos.tituloJanela} numberOfLines={1}>
          {titulo}
        </Text>
        <View style={estilos.botoesJanela}>
          <View style={estilos.botaoJanela} />
          <View style={estilos.botaoJanela} />
          <View style={[estilos.botaoJanela, { backgroundColor: COR.bordaEscura }]} />
        </View>
      </View>
      <View style={estilos.corpoJanela}>{children}</View>
    </View>
  );
}

function Indicador({
  rotulo,
  valor,
  invertido = false,
}: {
  rotulo: string;
  valor: number;
  /** true quando valor alto é ruim (ex.: fome) */
  invertido?: boolean;
}) {
  const ruim = invertido ? valor : MAX - valor;
  const cor = ruim >= 70 ? COR.perigo : ruim >= 50 ? COR.ambar : COR.lime;
  const blocos = Math.round(valor / 10);

  return (
    <View style={estilos.indicador}>
      <View style={estilos.indicadorTopo}>
        <Text style={estilos.indicadorRotulo}>{rotulo}</Text>
        <Text style={[estilos.indicadorValor, { color: cor }]}>{valor}/100</Text>
      </View>
      <View style={estilos.trilho}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={i}
            style={[estilos.bloco, { backgroundColor: i < blocos ? cor : COR.painelClaro }]}
          />
        ))}
      </View>
    </View>
  );
}

function BotaoAcao({
  rotulo,
  detalhe,
  onPress,
}: {
  rotulo: string;
  detalhe: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [estilos.botao, pressed && estilos.botaoPressionado]}
    >
      <Text style={estilos.botaoRotulo}>{rotulo}</Text>
      <Text style={estilos.botaoDetalhe}>{detalhe}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* TELA                                                                */
/* A lógica do jogo vive em src/game/ (logica.ts, use-jogo.ts).        */
/* ------------------------------------------------------------------ */
export default function TelaInicial() {
  const insets = useSafeAreaInsets();
  const { estado, carregado, agir, sprite, humor } = useJogo();
  const { stats } = estado;

  return (
    <View style={estilos.raiz}>
      <ScrollView
        contentContainerStyle={[
          estilos.conteudo,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!carregado ? (
          <Janela titulo="GATO.SAV">
            <Text style={estilos.carregando}>CARREGANDO BELA...</Text>
          </Janela>
        ) : (
          <>
            <Janela titulo="GATO.EXE - BELA EDITION">
              <View style={estilos.cabecalho}>
                <Text style={estilos.nomeBela}>BELA</Text>
                <Text style={estilos.descricaoBela}>gata cinza rajada, olhos âmbar</Text>
              </View>

              <View style={estilos.palco}>
                <BelaPalco
                  sprite={sprite}
                  energia={stats.energia}
                  descricao={`Bela, ${humor.toLowerCase()}`}
                />
              </View>

              <View style={estilos.linhaHumor}>
                <Text style={estilos.humorRotulo}>humor atual</Text>
                <Text style={estilos.humorValor}>{humor}</Text>
              </View>
              <View style={estilos.linhaHumor}>
                <Text style={estilos.humorRotulo}>selos de felicidade</Text>
                <Text style={estilos.selosValor}>
                  {Math.min(estado.selos, META_SELOS)}/{META_SELOS}
                </Text>
              </View>
            </Janela>

            <Janela titulo="STATUS.SYS">
              <Indicador rotulo="FOME" valor={Math.round(stats.fome)} invertido />
              <Indicador rotulo="FELICIDADE" valor={Math.round(stats.felicidade)} />
              <Indicador rotulo="ENERGIA" valor={Math.round(stats.energia)} />
            </Janela>

            <Janela titulo="TERMINAL">
              {estado.log.map((linha, i) => (
                <Text
                  key={`${i}-${linha}`}
                  style={[estilos.linhaLog, i === 0 ? estilos.logAtual : estilos.logAntigo]}
                >
                  {i === 0 ? '> ' : '  '}
                  {linha}
                </Text>
              ))}
            </Janela>

            <Janela titulo="COMANDOS">
              <View style={estilos.grade}>
                <BotaoAcao rotulo="ALIMENTAR" detalhe="fome -25" onPress={() => agir('alimentar')} />
                <BotaoAcao rotulo="CARINHO" detalhe="felicidade +12" onPress={() => agir('carinho')} />
                <BotaoAcao
                  rotulo="BRINCAR"
                  detalhe="felicidade +20, energia -20"
                  onPress={() => agir('brincar')}
                />
                <BotaoAcao rotulo="DORMIR" detalhe="energia +40" onPress={() => agir('dormir')} />
              </View>
            </Janela>

            <Text style={estilos.rodape}>GATO.EXE v0.2 - bela edition - salvamento automático</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* ESTILOS                                                             */
/* ------------------------------------------------------------------ */
const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: COR.fundo },
  conteudo: { paddingHorizontal: 14, gap: 14 },

  /* janela estilo desktop antigo */
  janela: {
    backgroundColor: COR.painel,
    borderWidth: 2,
    borderTopColor: COR.bordaClara,
    borderLeftColor: COR.bordaClara,
    borderRightColor: COR.bordaEscura,
    borderBottomColor: COR.bordaEscura,
  },
  barraTitulo: {
    backgroundColor: COR.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tituloJanela: {
    flex: 1,
    color: COR.bordaEscura,
    fontFamily: FONTE,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  botoesJanela: { flexDirection: 'row', gap: 4, marginLeft: 8 },
  botaoJanela: {
    width: 12,
    height: 12,
    backgroundColor: COR.limeEscuro,
    borderWidth: 1,
    borderColor: COR.bordaEscura,
  },
  corpoJanela: { padding: 12, gap: 12 },

  /* cabeçalho e personagem */
  cabecalho: { alignItems: 'center', gap: 2 },
  nomeBela: {
    color: COR.lime,
    fontFamily: FONTE,
    fontWeight: '700',
    fontSize: 34,
    letterSpacing: 6,
  },
  descricaoBela: { color: COR.mudo, fontFamily: FONTE, fontSize: 12 },
  palco: {
    backgroundColor: COR.fundo,
    borderWidth: 2,
    borderTopColor: COR.bordaEscura,
    borderLeftColor: COR.bordaEscura,
    borderRightColor: COR.bordaClara,
    borderBottomColor: COR.bordaClara,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  linhaHumor: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  humorRotulo: { color: COR.mudo, fontFamily: FONTE, fontSize: 12 },
  humorValor: { color: COR.lime, fontFamily: FONTE, fontWeight: '700', fontSize: 14 },
  selosValor: { color: COR.texto, fontFamily: FONTE, fontSize: 12 },
  carregando: { color: COR.lime, fontFamily: FONTE, fontSize: 14, textAlign: 'center', paddingVertical: 24 },

  /* indicadores */
  indicador: { gap: 5 },
  indicadorTopo: { flexDirection: 'row', justifyContent: 'space-between' },
  indicadorRotulo: { color: COR.texto, fontFamily: FONTE, fontSize: 13, letterSpacing: 1 },
  indicadorValor: { fontFamily: FONTE, fontSize: 13, fontWeight: '700' },
  trilho: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    backgroundColor: COR.fundo,
    borderWidth: 1,
    borderColor: COR.bordaClara,
  },
  bloco: { flex: 1, height: 14 },

  /* terminal */
  linhaLog: { fontFamily: FONTE, fontSize: 13, lineHeight: 19 },
  logAtual: { color: COR.lime },
  logAntigo: { color: COR.mudo },

  /* botões */
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  botao: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: COR.painelClaro,
    borderWidth: 2,
    borderTopColor: COR.bordaClara,
    borderLeftColor: COR.bordaClara,
    borderRightColor: COR.bordaEscura,
    borderBottomColor: COR.bordaEscura,
  },
  botaoPressionado: {
    backgroundColor: COR.limeEscuro,
    borderTopColor: COR.bordaEscura,
    borderLeftColor: COR.bordaEscura,
    borderRightColor: COR.bordaClara,
    borderBottomColor: COR.bordaClara,
  },
  botaoRotulo: {
    color: COR.lime,
    fontFamily: FONTE,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  botaoDetalhe: { color: COR.mudo, fontFamily: FONTE, fontSize: 10, textAlign: 'center' },

  rodape: { color: COR.mudo, fontFamily: FONTE, fontSize: 11, textAlign: 'center' },
});
