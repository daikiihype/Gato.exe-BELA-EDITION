# GATO.EXE — BELA EDITION

Jogo mobile de bichinho virtual com estética de computador antigo. Protagonista: **Bela**, gata cinza rajada de olhos âmbar.
Expo SDK 57 · Expo Router · TypeScript · Android.

## Rodar no computador

```
npm install
npx tsc --noEmit                                   # checa o TypeScript
node scripts/testar-logica.mts                     # testes da lógica do jogo (Node 22.18+)
npx expo start -c
```

> O Expo Go da loja é do SDK 58 e não abre este projeto (SDK 57). Para testar no celular, use o
> Expo Go do SDK 57 (https://expo.dev/go?sdkVersion=57&platform=android&device=true) ou gere o APK abaixo.

## Gerar o APK de teste (EAS Build)

Precisa de uma conta gratuita em https://expo.dev.

```
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Na primeira vez, o EAS pergunta se pode criar o projeto e gerenciar a keystore: responda **sim** às duas.
O perfil `preview` (em `eas.json`) gera um `.apk`; ao final aparece um link para baixar e instalar no celular.

## Onde mexer

| Arquivo | O que faz |
|---|---|
| `src/app/index.tsx` | Tela do jogo |
| `src/game/logica.ts` | Regras, reducer, tempo e validação do save (sem React) |
| `src/game/use-jogo.ts` | Liga a lógica ao React: carrega, salva, timers de pose |
| `src/game/armazenamento.ts` | Lê e grava `gatoexe-save.json` |
| `src/game/sprites.ts` | **Único** mapa dos arquivos de imagem da Bela |
| `assets/sprites/` | PNG usados no jogo (recortados dos JPEG) |
| `assets/images/bela-*.jpeg` | Originais, preservados |
