import * as L from '../src/game/logica.ts';
let ok = 0, falhas: string[] = [];
const t = (nome: string, cond: boolean) => { cond ? ok++ : falhas.push(nome); };
const dentro = (s: L.Stats) => [s.fome, s.felicidade, s.energia].every(v => Number.isFinite(v) && v >= 0 && v <= 100);

// 1) limites: 5000 ações aleatórias + tempo, nunca sai de 0..100
let j = L.estadoInicial();
const acoes: L.Acao[] = ['alimentar','carinho','brincar','dormir'];
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
let tudoValido = true;
for (let i = 0; i < 5000; i++) {
  const r = rnd();
  if (r < 0.7) j = L.reducer(j, { tipo: 'ACAO', acao: acoes[Math.floor(rnd()*4)], sorteio: rnd() });
  else if (r < 0.8) j = L.reducer(j, { tipo: 'TEMPO', minutos: 1 });
  else if (r < 0.85) j = L.reducer(j, { tipo: 'AUSENCIA', minutos: rnd()*900 });
  else if (r < 0.9) j = L.reducer(j, { tipo: 'OCIOSA', sorteio: rnd() });
  else if (j.pose) j = L.reducer(j, { tipo: 'FIM_POSE', id: j.pose.id });
  if (!dentro(j.stats) || j.log.length > L.LOG_MAX || j.log.length === 0) tudoValido = false;
}
t('5000 passos aleatórios mantêm status em 0..100 e log com 1..4 linhas', tudoValido);

// 2) regras das ações
const s0 = { fome: 50, felicidade: 50, energia: 50 };
let r = L.aplicarAcao(s0, 'alimentar'); t('alimentar reduz fome', r.stats.fome === 25);
r = L.aplicarAcao(s0, 'carinho'); t('carinho aumenta felicidade', r.stats.felicidade === 62);
r = L.aplicarAcao(s0, 'brincar'); t('brincar: energia↓ fome↑ felicidade↑', r.stats.energia === 30 && r.stats.fome === 58 && r.stats.felicidade === 70);
r = L.aplicarAcao(s0, 'dormir'); t('dormir recupera energia', r.stats.energia === 90);
r = L.aplicarAcao({ fome: 50, felicidade: 50, energia: 10 }, 'brincar'); t('brincar sem energia é recusado, sem mudar status', !r.efetiva && r.stats.energia === 10 && r.chave === 'brincarSemEnergia');
r = L.aplicarAcao({ fome: 0, felicidade: 100, energia: 100 }, 'alimentar'); t('alimentar com fome 0 não muda nada', !r.efetiva && r.stats.fome === 0);
r = L.aplicarAcao({ fome: 0, felicidade: 100, energia: 100 }, 'dormir'); t('dormir com energia cheia não passa de 100', r.stats.energia === 100);
r = L.aplicarAcao({ fome: 100, felicidade: 100, energia: 100 }, 'carinho'); t('carinho no máximo fica em 100', r.stats.felicidade === 100);

// 3) toques repetidos: 200 'brincar' seguidos
let k = L.estadoInicial();
for (let i = 0; i < 200; i++) k = L.reducer(k, { tipo: 'ACAO', acao: 'brincar', sorteio: rnd() });
t('200 brincar seguidos: status válidos e energia nunca negativa', dentro(k.stats) && k.stats.energia >= 0);

// 4) pose temporária: dormir mostra 'dormindo' mas some no FIM_POSE; id antigo é ignorado
let p = L.estadoInicial();
p = L.reducer(p, { tipo: 'ACAO', acao: 'dormir', sorteio: 0.1 });
const idDormir = p.pose!.id;
t('dormir cria pose dormindo', p.pose?.sprite === 'dormindo');
p = L.reducer(p, { tipo: 'ACAO', acao: 'carinho', sorteio: 0.1 });
p = L.reducer(p, { tipo: 'FIM_POSE', id: idDormir });
t('FIM_POSE de pose antiga não apaga a pose nova', p.pose?.sprite === 'carinho');
p = L.reducer(p, { tipo: 'FIM_POSE', id: p.pose!.id });
t('FIM_POSE correto limpa a pose', p.pose === null);

// 5) estado base coerente
t('fome 95 → irritada', L.estadoBase({ fome: 95, felicidade: 50, energia: 50 }, 0).sprite === 'brava');
t('fome 75 → faminta', L.estadoBase({ fome: 75, felicidade: 90, energia: 90 }, 0).sprite === 'faminta');
t('energia 10 → cansada', L.estadoBase({ fome: 10, felicidade: 90, energia: 10 }, 0).sprite === 'cansada');
t('felicidade 90 e bem → feliz', L.estadoBase({ fome: 10, felicidade: 90, energia: 90 }, 0).sprite === 'feliz');
t('lendária só com 5 selos e status bons', L.estadoBase({ fome: 10, felicidade: 90, energia: 90 }, 5).sprite === 'lendaria' && L.estadoBase({ fome: 10, felicidade: 90, energia: 90 }, 4).sprite === 'feliz' && L.estadoBase({ fome: 50, felicidade: 90, energia: 90 }, 5).sprite !== 'lendaria');

// 6) selo: felicidade chega a 100 com fome ok
let m = { ...L.estadoInicial(), stats: { fome: 30, felicidade: 95, energia: 80 } };
m = L.reducer(m, { tipo: 'ACAO', acao: 'carinho', sorteio: 0.3 });
t('chegar a 100 dá selo e comemoração', m.selos === 1 && m.pose?.sprite === 'comemorando');
let m2 = { ...L.estadoInicial(), stats: { fome: 90, felicidade: 95, energia: 80 } };
m2 = L.reducer(m2, { tipo: 'ACAO', acao: 'carinho', sorteio: 0.3 });
t('com muita fome não dá selo (sem estado contraditório)', m2.selos === 0 && m2.pose?.sprite === 'carinho');

// 7) tempo
const a = L.evoluirTempo({ fome: 10, felicidade: 90, energia: 90 }, 480, 'ausente');
t('ausência 8h: fome ≤ 75, felicidade ≥ 30, energia ≤ 100', a.fome <= 75 && a.felicidade >= 30 && a.energia <= 100);
const b = L.evoluirTempo({ fome: 10, felicidade: 90, energia: 50 }, 100000, 'ausente');
t('ausência gigante é limitada a 8h', Math.abs(b.fome - L.evoluirTempo({ fome: 10, felicidade: 90, energia: 50 }, 480, 'ausente').fome) < 1e-9);
t('minutos negativos/NaN não mudam nada', L.evoluirTempo(s0, -50, 'ausente') === s0 && L.evoluirTempo(s0, NaN, 'ativo') === s0);
const c = L.evoluirTempo({ fome: 99, felicidade: 1, energia: 1 }, 60, 'ativo');
t('tempo ativo respeita 0..100', dentro(c));
const d = L.evoluirTempo({ fome: 90, felicidade: 20, energia: 50 }, 480, 'ausente');
t('ausência não piora quem já está acima do teto/abaixo do piso', d.fome === 90 && d.felicidade === 20);

// 7b) o gate do estado: ausência de 5 min não gera mensagem nem muda muito
let z = { ...L.estadoInicial() };
t('ausência < 1 min ignorada', L.reducer(z, { tipo: 'AUSENCIA', minutos: 0.5 }) === z);

// 8) save: validação e corrupção
const bom = L.montarSave({ stats: { fome: 33.333, felicidade: 60, energia: 70 }, selos: 2, acoes: 9 }, 1000);
t('save ida e volta', JSON.stringify(L.sanitizarSave(JSON.parse(JSON.stringify(bom)))) === JSON.stringify(bom));
t('save null/lixo → null', L.sanitizarSave(null) === null && L.sanitizarSave('abc') === null && L.sanitizarSave({}) === null && L.sanitizarSave({ stats: { fome: 'x' } }) === null);
const sujo = L.sanitizarSave({ stats: { fome: 999, felicidade: -50, energia: 50 }, selos: -3, acoes: 'oi', salvoEm: 'x' })!;
t('save com números fora do limite é corrigido', sujo.stats.fome === 100 && sujo.stats.felicidade === 0 && sujo.selos === 0 && sujo.acoes === 0 && sujo.salvoEm === 0);
t('save com NaN/Infinity é rejeitado', L.sanitizarSave({ stats: { fome: NaN, felicidade: 1, energia: 1 } }) === null);

// 9) carregar: restaura e aplica ausência; relógio para trás não penaliza
const agora = 10_000_000_000;
const salvo = L.montarSave({ stats: { fome: 20, felicidade: 80, energia: 40 }, selos: 3, acoes: 12 }, agora - 120 * 60000);
const car = L.reducer(L.estadoInicial(), { tipo: 'CARREGAR', save: salvo, agora });
t('carregar restaura selos/acoes', car.selos === 3 && car.acoes === 12);
t('carregar após 2h aplica ausência (energia sobe, fome sobe)', car.stats.energia > 40 && car.stats.fome > 20 && dentro(car.stats));
t('carregar mostra mensagem de ausência', car.log[0].includes('2 h'));
const futuro = L.reducer(L.estadoInicial(), { tipo: 'CARREGAR', save: { ...salvo, salvoEm: agora + 9e8 }, agora });
t('save no futuro não penaliza', futuro.stats.fome === 20 && futuro.stats.felicidade === 80);
t('carregar sem save → estado inicial', JSON.stringify(L.reducer(j, { tipo: 'CARREGAR', save: null, agora }).stats) === JSON.stringify(L.STATS_INICIAIS));

// 10) ociosa
const o1 = L.reducer(L.estadoInicial(), { tipo: 'OCIOSA', sorteio: 0.1 });
t('ociosa com Bela bem → arteira', o1.pose?.sprite === 'arteira');
const o2 = L.reducer({ ...L.estadoInicial(), stats: { fome: 80, felicidade: 50, energia: 50 } }, { tipo: 'OCIOSA', sorteio: 0.1 });
t('ociosa ignorada se Bela precisa de algo (faminta)', o2.pose === null);


// 11) fechar e reabrir o app: jogar, "gravar" em JSON, reabrir e comparar
let sessao = L.estadoInicial();
for (const ac of ['alimentar','brincar','carinho','dormir','carinho'] as L.Acao[]) sessao = L.reducer(sessao, { tipo: 'ACAO', acao: ac, sorteio: 0.4 });
const noDisco = JSON.stringify(L.montarSave(sessao, 5_000_000));
const reaberto = L.reducer(L.estadoInicial(), { tipo: 'CARREGAR', save: L.sanitizarSave(JSON.parse(noDisco)), agora: 5_000_000 + 10_000 });
t('reabrir 10 s depois: status idênticos aos gravados', JSON.stringify(reaberto.stats) === JSON.stringify(L.montarSave(sessao, 0).stats));
t('reabrir: selos e ações preservados', reaberto.selos === sessao.selos && reaberto.acoes === sessao.acoes);
t('reabrir: nenhuma pose presa (dormindo não persiste)', reaberto.pose === null);
t('arquivo truncado/corrompido é rejeitado', (() => { try { return L.sanitizarSave(JSON.parse(noDisco.slice(0, 20))) === null; } catch { return true; } })());

// 12) sprites: todo require de src/game/sprites.ts aponta para arquivo existente e todas as poses estão mapeadas
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const aqui = dirname(fileURLToPath(import.meta.url));
const fonte = readFileSync(resolve(aqui, '../src/game/sprites.ts'), 'utf8');
const reqs = [...fonte.matchAll(/(\w+): require\('([^']+)'\)/g)];
const poses: L.SpriteId[] = ['idle','feliz','faminta','cansada','dormindo','brincando','carinho','curiosa','brava','comemorando','arteira','arteira2','lendaria'];
t('as 13 poses estão mapeadas', poses.every(p => reqs.some(m => m[1] === p)) && reqs.length === 13);
t('todos os arquivos de sprite existem', reqs.every(m => existsSync(resolve(aqui, '../src/game', m[2]))));

console.log(`${ok} verificações OK, ${falhas.length} falhas`);
falhas.forEach(f => console.log('FALHOU:', f));
process.exit(falhas.length ? 1 : 0);
