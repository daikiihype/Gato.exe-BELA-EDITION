/**
 * Lógica pura do GATO.EXE (sem React, sem Expo, sem I/O).
 * Tudo aqui é determinístico: a aleatoriedade entra por parâmetro (`sorteio`),
 * o que permite testar fora do celular e usar dentro de um reducer sem efeitos colaterais.
 */

/* ------------------------------------------------------------------ */
/* TIPOS                                                               */
/* ------------------------------------------------------------------ */
export type Stats = { fome: number; felicidade: number; energia: number };
export type Acao = 'alimentar' | 'carinho' | 'brincar' | 'dormir';

export type SpriteId =
  | 'idle'
  | 'feliz'
  | 'faminta'
  | 'cansada'
  | 'dormindo'
  | 'brincando'
  | 'carinho'
  | 'curiosa'
  | 'brava'
  | 'comemorando'
  | 'arteira'
  | 'arteira2'
  | 'lendaria';

export type ChaveMensagem =
  | 'inicio'
  | 'alimentar'
  | 'alimentarCheia'
  | 'carinho'
  | 'brincar'
  | 'brincarSemEnergia'
  | 'dormir'
  | 'dormirDescansada'
  | 'ociosaCuriosa'
  | 'ociosaArteira'
  | 'ficouFaminta'
  | 'ficouCansada'
  | 'ficouIrritada';

/** Estado visual temporário (dura alguns segundos e depois some). */
export type Pose = { sprite: SpriteId; rotulo: string; id: number; duracaoMs: number };

export type Jogo = {
  stats: Stats;
  /** Selos de felicidade máxima. Com META_SELOS selos, a Bela pode ficar Lendária. */
  selos: number;
  /** Total de ações efetivas realizadas. */
  acoes: number;
  /** Mensagens do terminal, a mais recente primeiro. */
  log: string[];
  pose: Pose | null;
  proximaPose: number;
};

/** O que é gravado no disco. */
export type Save = {
  versao: 1;
  stats: Stats;
  selos: number;
  acoes: number;
  salvoEm: number;
};

export type AcaoJogo =
  | { tipo: 'CARREGAR'; save: Save | null; agora: number }
  | { tipo: 'ACAO'; acao: Acao; sorteio: number }
  | { tipo: 'FIM_POSE'; id: number }
  | { tipo: 'TEMPO'; minutos: number }
  | { tipo: 'AUSENCIA'; minutos: number }
  | { tipo: 'OCIOSA'; sorteio: number };

/* ------------------------------------------------------------------ */
/* CONSTANTES DE BALANCEAMENTO                                         */
/* ------------------------------------------------------------------ */
export const MIN = 0;
export const MAX = 100;
export const CUSTO_BRINCAR = 20;
export const META_SELOS = 5;
export const LOG_MAX = 4;
export const MAX_AUSENCIA_MIN = 8 * 60;

const TETO_FOME_AUSENTE = 75;
const PISO_FELICIDADE_AUSENTE = 30;

export const STATS_INICIAIS: Stats = { fome: 40, felicidade: 60, energia: 70 };

/* ------------------------------------------------------------------ */
/* MENSAGENS                                                           */
/* ------------------------------------------------------------------ */
export const MENSAGENS: Record<ChaveMensagem, string[]> = {
  inicio: ['Bela observa você do outro lado do monitor.'],
  alimentar: [
    'Bela devora a ração e limpa o bigode com a pata.',
    'Nham. Bela come devagar, como quem faz um favor.',
    'A tigela está vazia. Bela te encara em silêncio.',
  ],
  alimentarCheia: [
    'Bela cheira a comida e vira o rosto. Está satisfeita.',
    'Nem mais uma migalha. Bela está de barriga cheia.',
  ],
  carinho: [
    'Bela fecha os olhos e ronrona alto.',
    'Bela empurra a cabeça contra a sua mão.',
    'Ronrom detectado. Nível de conforto: alto.',
  ],
  brincar: [
    'Bela dispara atrás do brinquedo e derruba tudo no caminho.',
    'Pulo perfeito. Bela ataca e vence a bolinha.',
    'Bela corre pela sala em velocidade máxima.',
  ],
  brincarSemEnergia: [
    'Bela boceja e se recusa a brincar. Está exausta.',
    'Sem energia para correr agora. Bela precisa dormir.',
  ],
  dormir: [
    'Bela se enrola e adormece. Zzz...',
    'A respiração de Bela fica lenta e tranquila.',
    'Bela cochila ao sol da janela.',
  ],
  dormirDescansada: [
    'Bela abre um olho, vira para o outro lado e continua parada.',
    'Bela já está descansada e só espreguiça.',
  ],
  ociosaCuriosa: [
    'Bela inclina a cabeça. Algo no monitor chamou a atenção.',
    'Bela fica olhando para um ponto vazio da sala.',
  ],
  ociosaArteira: [
    'Bela tem cara de quem vai derrubar alguma coisa da mesa.',
    'Bela balança o rabo. Boa coisa não vem por aí.',
  ],
  ficouFaminta: ['Bela olha para a tigela vazia e depois para você.'],
  ficouCansada: ['Bela boceja e pisca devagar. Está ficando sem energia.'],
  ficouIrritada: ['Bela mia alto. Ela está irritada e quer atenção.'],
};

/* ------------------------------------------------------------------ */
/* UTILITÁRIOS                                                         */
/* ------------------------------------------------------------------ */
/** Mantém o valor entre 0 e 100. Valores inválidos (NaN, Infinity) viram `padrao`. */
export function limitar(valor: number, padrao = 0): number {
  if (!Number.isFinite(valor)) return padrao;
  return Math.min(MAX, Math.max(MIN, valor));
}

const arredondar2 = (v: number) => Math.round(v * 100) / 100;

function escolher(lista: string[], sorteio: number, ultima?: string): string {
  const s = Number.isFinite(sorteio) ? Math.min(0.999999, Math.max(0, sorteio)) : 0;
  let i = Math.floor(s * lista.length);
  if (lista.length > 1 && lista[i] === ultima) i = (i + 1) % lista.length;
  return lista[i];
}

function adicionarLog(log: string[], ...novas: string[]): string[] {
  return [...novas.reverse(), ...log].slice(0, LOG_MAX);
}

export function formatarDuracao(minutos: number): string {
  const total = Math.max(0, Math.round(minutos));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/* ------------------------------------------------------------------ */
/* ESTADO BASE (persistente, derivado dos status)                      */
/* ------------------------------------------------------------------ */
export type Base = { sprite: SpriteId; rotulo: string; precisa: boolean };

/**
 * Estado persistente: depende só dos status e dos selos. Sempre existe exatamente um,
 * com ordem de prioridade fixa, então não há estados contraditórios.
 */
export function estadoBase(s: Stats, selos: number): Base {
  if (s.fome >= 90 || s.felicidade <= 10) {
    return { sprite: 'brava', rotulo: 'IRRITADA', precisa: true };
  }
  if (s.fome >= 70) return { sprite: 'faminta', rotulo: 'FAMINTA', precisa: true };
  if (s.energia <= 20) return { sprite: 'cansada', rotulo: 'CANSADA', precisa: true };
  if (selos >= META_SELOS && s.fome <= 35 && s.felicidade >= 80 && s.energia >= 50) {
    return { sprite: 'lendaria', rotulo: 'LENDÁRIA', precisa: false };
  }
  if (s.felicidade >= 75) return { sprite: 'feliz', rotulo: 'FELIZ', precisa: false };
  return { sprite: 'idle', rotulo: 'TRANQUILA', precisa: false };
}

/* ------------------------------------------------------------------ */
/* AÇÕES                                                               */
/* ------------------------------------------------------------------ */
type ResultadoAcao = {
  stats: Stats;
  chave: ChaveMensagem;
  efetiva: boolean;
  sprite: SpriteId;
  rotulo: string;
  duracaoMs: number;
};

/** Aplica uma ação. Nunca produz valores fora de 0..100. */
export function aplicarAcao(s: Stats, acao: Acao): ResultadoAcao {
  switch (acao) {
    case 'alimentar':
      if (s.fome <= 5) {
        return { stats: s, chave: 'alimentarCheia', efetiva: false, sprite: 'curiosa', rotulo: 'SATISFEITA', duracaoMs: 1800 };
      }
      return {
        stats: { ...s, fome: limitar(s.fome - 25), felicidade: limitar(s.felicidade + 3) },
        chave: 'alimentar',
        efetiva: true,
        sprite: 'feliz',
        rotulo: 'COMENDO',
        duracaoMs: 2200,
      };

    case 'carinho':
      return {
        stats: { ...s, felicidade: limitar(s.felicidade + 12) },
        chave: 'carinho',
        efetiva: true,
        sprite: 'carinho',
        rotulo: 'RONRONANDO',
        duracaoMs: 2600,
      };

    case 'brincar':
      if (s.energia < CUSTO_BRINCAR) {
        return { stats: s, chave: 'brincarSemEnergia', efetiva: false, sprite: 'cansada', rotulo: 'CANSADA', duracaoMs: 2200 };
      }
      return {
        stats: {
          fome: limitar(s.fome + 8),
          felicidade: limitar(s.felicidade + 20),
          energia: limitar(s.energia - CUSTO_BRINCAR),
        },
        chave: 'brincar',
        efetiva: true,
        sprite: 'brincando',
        rotulo: 'BRINCANDO',
        duracaoMs: 2600,
      };

    case 'dormir':
      if (s.energia >= 95) {
        return { stats: s, chave: 'dormirDescansada', efetiva: false, sprite: 'arteira', rotulo: 'ESPREGUIÇANDO', duracaoMs: 1800 };
      }
      return {
        stats: { ...s, energia: limitar(s.energia + 40), fome: limitar(s.fome + 10) },
        chave: 'dormir',
        efetiva: true,
        sprite: 'dormindo',
        rotulo: 'DORMINDO',
        duracaoMs: 3200,
      };
  }
}

/* ------------------------------------------------------------------ */
/* PASSAGEM DO TEMPO                                                   */
/* ------------------------------------------------------------------ */
/**
 * 'ativo'   = app aberto (tick de 1 minuto): evolução lenta.
 * 'ausente' = app fechado/em segundo plano: evolução ainda mais gentil, com teto de fome
 *             e piso de felicidade, para o jogador nunca voltar a uma Bela "arruinada".
 */
export function evoluirTempo(s: Stats, minutos: number, modo: 'ativo' | 'ausente'): Stats {
  const limite = modo === 'ausente' ? MAX_AUSENCIA_MIN : 60;
  const m = Number.isFinite(minutos) ? Math.min(limite, Math.max(0, minutos)) : 0;
  if (m === 0) return s;

  if (modo === 'ativo') {
    const taxaFelicidade = s.fome >= 70 ? 0.12 : 0.06;
    return {
      fome: arredondar2(limitar(s.fome + 0.08 * m)),
      felicidade: arredondar2(limitar(s.felicidade - taxaFelicidade * m)),
      energia: arredondar2(limitar(s.energia - 0.04 * m)),
    };
  }

  return {
    fome: arredondar2(s.fome >= TETO_FOME_AUSENTE ? s.fome : Math.min(TETO_FOME_AUSENTE, s.fome + 0.04 * m)),
    felicidade: arredondar2(
      s.felicidade <= PISO_FELICIDADE_AUSENTE ? s.felicidade : Math.max(PISO_FELICIDADE_AUSENTE, s.felicidade - 0.03 * m),
    ),
    energia: arredondar2(limitar(s.energia + 0.12 * m)),
  };
}

function aplicarAusencia(j: Jogo, minutos: number): Jogo {
  if (!Number.isFinite(minutos) || minutos < 1) return j;
  const stats = evoluirTempo(j.stats, minutos, 'ausente');
  const aviso =
    minutos >= 15
      ? [`Você ficou fora por ${formatarDuracao(Math.min(minutos, MAX_AUSENCIA_MIN))}. Bela cochilou e sentiu sua falta.`]
      : [];
  return { ...j, stats, log: adicionarLog(j.log, ...aviso) };
}

/* ------------------------------------------------------------------ */
/* SAVE                                                                */
/* ------------------------------------------------------------------ */
export function montarSave(j: Pick<Jogo, 'stats' | 'selos' | 'acoes'>, agora: number): Save {
  return {
    versao: 1,
    stats: {
      fome: arredondar2(limitar(j.stats.fome)),
      felicidade: arredondar2(limitar(j.stats.felicidade)),
      energia: arredondar2(limitar(j.stats.energia)),
    },
    selos: j.selos,
    acoes: j.acoes,
    salvoEm: agora,
  };
}

const ehNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Valida dados lidos do disco. Retorna null se estiver ausente ou corrompido. */
export function sanitizarSave(bruto: unknown): Save | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const o = bruto as Record<string, unknown>;
  const st = o.stats as Record<string, unknown> | null | undefined;
  if (typeof st !== 'object' || st === null) return null;
  if (!ehNumero(st.fome) || !ehNumero(st.felicidade) || !ehNumero(st.energia)) return null;
  return {
    versao: 1,
    stats: { fome: limitar(st.fome), felicidade: limitar(st.felicidade), energia: limitar(st.energia) },
    selos: ehNumero(o.selos) ? Math.min(99, Math.max(0, Math.floor(o.selos))) : 0,
    acoes: ehNumero(o.acoes) ? Math.max(0, Math.floor(o.acoes)) : 0,
    salvoEm: ehNumero(o.salvoEm) ? o.salvoEm : 0,
  };
}

/* ------------------------------------------------------------------ */
/* REDUCER                                                             */
/* ------------------------------------------------------------------ */
export function estadoInicial(): Jogo {
  return {
    stats: { ...STATS_INICIAIS },
    selos: 0,
    acoes: 0,
    log: [MENSAGENS.inicio[0]],
    pose: null,
    proximaPose: 1,
  };
}

export function reducer(j: Jogo, a: AcaoJogo): Jogo {
  switch (a.tipo) {
    case 'CARREGAR': {
      if (!a.save) return estadoInicial();
      const base: Jogo = {
        ...estadoInicial(),
        stats: a.save.stats,
        selos: a.save.selos,
        acoes: a.save.acoes,
        log: ['Progresso restaurado de GATO.SAV.'],
      };
      // Relógio mexido para trás ou salvamento no futuro = sem penalidade.
      const minutos = a.save.salvoEm > 0 ? (a.agora - a.save.salvoEm) / 60000 : 0;
      return aplicarAusencia(base, minutos);
    }

    case 'ACAO': {
      const r = aplicarAcao(j.stats, a.acao);
      const ultima = j.log[0];
      const mensagens = [escolher(MENSAGENS[r.chave], a.sorteio, ultima)];

      let selos = j.selos;
      let pose: Pose = { sprite: r.sprite, rotulo: r.rotulo, id: j.proximaPose, duracaoMs: r.duracaoMs };

      // Marco: felicidade chegou a 100 com a Bela bem alimentada.
      if (r.efetiva && r.stats.felicidade >= MAX && j.stats.felicidade < MAX && r.stats.fome <= 60) {
        selos = Math.min(99, selos + 1);
        pose = { sprite: 'comemorando', rotulo: 'COMEMORANDO', id: j.proximaPose, duracaoMs: 3000 };
        mensagens.push(
          selos === META_SELOS
            ? 'Selo 5/5! Bela pode se tornar LENDÁRIA se for bem cuidada.'
            : `Felicidade máxima! Selo ${Math.min(selos, META_SELOS)}/${META_SELOS} conquistado.`,
        );
      }

      return {
        ...j,
        stats: r.stats,
        selos,
        acoes: r.efetiva ? j.acoes + 1 : j.acoes,
        log: adicionarLog(j.log, ...mensagens),
        pose,
        proximaPose: j.proximaPose + 1,
      };
    }

    case 'FIM_POSE':
      return j.pose && j.pose.id === a.id ? { ...j, pose: null } : j;

    case 'TEMPO': {
      const antes = estadoBase(j.stats, j.selos);
      const stats = evoluirTempo(j.stats, a.minutos, 'ativo');
      const depois = estadoBase(stats, j.selos);
      let log = j.log;
      if (depois.sprite !== antes.sprite && depois.precisa) {
        const chave: ChaveMensagem =
          depois.sprite === 'brava' ? 'ficouIrritada' : depois.sprite === 'faminta' ? 'ficouFaminta' : 'ficouCansada';
        log = adicionarLog(log, MENSAGENS[chave][0]);
      }
      return { ...j, stats, log };
    }

    case 'AUSENCIA':
      return aplicarAusencia(j, a.minutos);

    case 'OCIOSA': {
      if (j.pose) return j;
      const base = estadoBase(j.stats, j.selos);
      if (base.precisa) return j;
      const brincalhona = j.stats.energia >= 50 && j.stats.felicidade >= 60 && a.sorteio < 0.5;
      const sprite: SpriteId = brincalhona ? (a.sorteio < 0.25 ? 'arteira' : 'arteira2') : 'curiosa';
      const chave: ChaveMensagem = brincalhona ? 'ociosaArteira' : 'ociosaCuriosa';
      return {
        ...j,
        log: adicionarLog(j.log, escolher(MENSAGENS[chave], a.sorteio * 7.31 - Math.floor(a.sorteio * 7.31), j.log[0])),
        pose: { sprite, rotulo: brincalhona ? 'ARTEIRA' : 'CURIOSA', id: j.proximaPose, duracaoMs: 2800 },
        proximaPose: j.proximaPose + 1,
      };
    }
  }
}
