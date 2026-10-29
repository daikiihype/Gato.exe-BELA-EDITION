import { useEffect, useReducer, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { escreverSave, lerSave } from './armazenamento';
import {
  estadoBase,
  estadoInicial,
  montarSave,
  reducer,
  type Acao,
  type SpriteId,
} from './logica';

const TICK_MS = 60_000;
const SALVAR_APOS_MS = 600;
const OCIOSA_MIN_MS = 15_000;
const OCIOSA_VAR_MS = 15_000;

/**
 * Liga a lógica pura ao React:
 * - lê o salvamento ANTES de liberar a interface (nunca grava o estado padrão por cima);
 * - grava com atraso curto após cada mudança e ao ir para segundo plano;
 * - encerra poses temporárias, faz o tempo passar e dispara pequenas ações ociosas.
 */
export function useJogo() {
  const [estado, dispatch] = useReducer(reducer, undefined, estadoInicial);
  const [carregado, setCarregado] = useState(false);
  const ultimoEstado = useRef(estado);
  const saiuEm = useRef<number | null>(null);

  useEffect(() => {
    ultimoEstado.current = estado;
  });

  // 1) Carregamento inicial
  useEffect(() => {
    let vivo = true;
    lerSave().then((save) => {
      if (!vivo) return;
      dispatch({ tipo: 'CARREGAR', save, agora: Date.now() });
      setCarregado(true);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // 2) Salvamento com atraso (só depois de carregar)
  useEffect(() => {
    if (!carregado) return;
    const t = setTimeout(() => {
      void escreverSave(montarSave(ultimoEstado.current, Date.now()));
    }, SALVAR_APOS_MS);
    return () => clearTimeout(t);
  }, [carregado, estado.stats, estado.selos, estado.acoes]);

  // 3) Fim da pose temporária
  const poseId = estado.pose?.id ?? null;
  const poseDuracao = estado.pose?.duracaoMs ?? 0;
  useEffect(() => {
    if (poseId === null) return;
    const t = setTimeout(() => dispatch({ tipo: 'FIM_POSE', id: poseId }), poseDuracao);
    return () => clearTimeout(t);
  }, [poseId, poseDuracao]);

  // 4) Tempo passando com o app aberto
  useEffect(() => {
    if (!carregado) return;
    const i = setInterval(() => dispatch({ tipo: 'TEMPO', minutos: 1 }), TICK_MS);
    return () => clearInterval(i);
  }, [carregado]);

  // 5) Segundo plano: grava ao sair e aplica a ausência ao voltar
  useEffect(() => {
    if (!carregado) return;
    const sub = AppState.addEventListener('change', (novo) => {
      if (novo === 'active') {
        const saiu = saiuEm.current;
        saiuEm.current = null;
        if (saiu !== null) dispatch({ tipo: 'AUSENCIA', minutos: (Date.now() - saiu) / 60000 });
      } else if (saiuEm.current === null) {
        saiuEm.current = Date.now();
        void escreverSave(montarSave(ultimoEstado.current, saiuEm.current));
      }
    });
    return () => sub.remove();
  }, [carregado]);

  // 6) Pequenas ações ociosas (curiosa/arteira) quando nada está acontecendo
  useEffect(() => {
    if (!carregado || poseId !== null) return;
    const t = setTimeout(
      () => dispatch({ tipo: 'OCIOSA', sorteio: Math.random() }),
      OCIOSA_MIN_MS + Math.random() * OCIOSA_VAR_MS,
    );
    return () => clearTimeout(t);
  }, [carregado, poseId]);

  const agir = (acao: Acao) => dispatch({ tipo: 'ACAO', acao, sorteio: Math.random() });

  const base = estadoBase(estado.stats, estado.selos);
  const sprite: SpriteId = estado.pose?.sprite ?? base.sprite;
  const humor = estado.pose?.rotulo ?? base.rotulo;

  return { estado, carregado, agir, sprite, humor };
}
