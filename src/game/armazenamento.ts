import { File, Paths } from 'expo-file-system';

import { sanitizarSave, type Save } from './logica';

const NOME_SAVE = 'gatoexe-save.json';
const NOME_CORROMPIDO = 'gatoexe-save.corrompido.json';

const arquivoSave = () => new File(Paths.document, NOME_SAVE);

/**
 * Lê o salvamento. Retorna null se não existir ou se estiver ilegível.
 * Um arquivo ilegível é copiado para `gatoexe-save.corrompido.json` antes de ser ignorado,
 * para nunca destruir dados que talvez ainda possam ser recuperados.
 */
export async function lerSave(): Promise<Save | null> {
  const arquivo = arquivoSave();
  try {
    if (!arquivo.exists) return null;
    const texto = await arquivo.text();
    const save = sanitizarSave(JSON.parse(texto));
    if (!save) throw new Error('formato de save inválido');
    return save;
  } catch (erro) {
    console.warn('[GATO.EXE] Save ilegível; iniciando do zero.', erro);
    try {
      await arquivo.copy(new File(Paths.document, NOME_CORROMPIDO), { overwrite: true });
    } catch {
      // melhor esforço
    }
    return null;
  }
}

// Fila: gravações acontecem uma de cada vez, na ordem em que foram pedidas.
let fila: Promise<void> = Promise.resolve();

export function escreverSave(save: Save): Promise<void> {
  const conteudo = JSON.stringify(save);
  fila = fila.then(() => {
    try {
      const arquivo = arquivoSave();
      if (!arquivo.exists) arquivo.create();
      arquivo.write(conteudo);
    } catch (erro) {
      console.warn('[GATO.EXE] Falha ao salvar.', erro);
    }
  });
  return fila;
}
