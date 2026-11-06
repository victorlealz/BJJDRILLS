# Jiu-Jitsu Drills

PWA mobile-first para organizar técnicas, gerar sessões de drill, registrar treinos e identificar o que precisa de revisão. O desenho é **local-first**: a interface lê e grava primeiro no IndexedDB; a sincronização com Supabase ocorre em segundo plano.

## Funcionalidades

- Biblioteca editável de grupos e técnicas.
- Técnicas com nome, grupo, nível (fundamental/avançada) e notas opcionais.
- Geradores Aleatório, Fundamentos, Revisão e Avançado.
- Seleção manual e geração por quantidade, sem timer embutido.
- Registro das técnicas realizadas ao finalizar um treino e histórico por data.
- Revisão baseada em técnicas nunca treinadas, tempo desde o último treino e frequência.
- PWA instalável, app shell offline e sessão de treino temporária local.
- Sincronização multi-dispositivo com fila offline, soft delete e last-write-wins.
- Autenticação por e-mail e senha com Supabase Auth.
- RLS por usuário em todas as tabelas pessoais.

## Stack

React 19, TypeScript 7, Vite 8, Supabase/PostgreSQL/Auth, Dexie/IndexedDB, vite-plugin-pwa e Cloudflare Workers Static Assets com Wrangler 4. CSS nativo, sem framework de componentes ou estado global externo.

## Arquitetura

```text
React PWA
  │
  ├─ IndexedDB / Dexie (fonte local imediata)
  │    ├─ groups
  │    ├─ techniques
  │    ├─ drillLogs
  │    ├─ pendingMutations
  │    └─ syncState
  │
  └─ Supabase
       ├─ Auth
       └─ PostgreSQL + RLS
```

Cada mutação recebe UUID e timestamp no cliente, é aplicada localmente e entra em `pendingMutations`. Quando online, `syncService.ts` compara `updated_at` antes de enviar, evitando que uma escrita local mais antiga sobrescreva uma versão remota mais nova. Depois faz pull incremental por `updated_at`. Exclusões são lógicas (`deleted_at`).

## Estrutura principal

```text
src/
  components/
  data/default-library.json
  db/localDb.ts
  features/auth/
  features/drills/
  hooks/
  pages/
  services/repository.ts
  services/supabase.ts
  services/syncService.ts
  styles/global.css
  types/models.ts
supabase/migrations/0001_initial_schema.sql
vite.config.ts
wrangler.jsonc
```

## Instalação

Requer Node.js compatível com Vite 8.

```bash
npm install
cp .env.example .env
npm run dev
```

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Em **Project Settings / API**, copie a **Project URL** e a **Publishable key** apropriada para cliente.
3. Crie `.env`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. Aplique `supabase/migrations/0001_initial_schema.sql` pelo fluxo de migrations do Supabase CLI ou, se estiver configurando manualmente, execute exatamente esse arquivo no SQL Editor.
5. Em Authentication, habilite e-mail/senha. Ajuste confirmação de e-mail conforme sua preferência.
6. Em URL Configuration, adicione a URL local (`http://localhost:5173`) e a URL de produção da aplicação às URLs permitidas/redirects necessárias para recuperação de senha.
7. Execute `npm run dev`.

Nunca coloque secret key, service role ou senha em `.env` de frontend. Apenas a chave pública/publishable deve ser exposta ao Vite.

## Banco e RLS

A migration cria `profiles`, `technique_groups`, `techniques` e `drill_logs`, constraints, índices, grants e políticas separadas de SELECT/INSERT/UPDATE/DELETE. Todas as políticas exigem `auth.uid() = user_id` e só se aplicam a `authenticated`.

A biblioteca padrão é criada uma única vez por conta. `profiles.library_initialized` torna o processo idempotente; depois disso, itens alterados ou excluídos não são recriados automaticamente.

## Offline

O service worker gerado pelo `vite-plugin-pwa` cacheia app shell e assets locais. Dados do usuário ficam no IndexedDB, não no cache. Depois do primeiro login/configuração e carregamento da biblioteca, pesquisa, edição, geração, registro e consulta do histórico local funcionam sem rede. Alterações ficam na fila e são enviadas quando `online` volta.

A sessão de treino corrente é persistida em IndexedDB para reduzir perda caso a PWA seja fechada ou suspensa.

## Testes

```bash
npm test
```

Os testes cobrem geração sem repetição, filtros de nível, revisão e cálculo por duração.

## Build

```bash
npm run build
```

A saída é criada em `dist/`.

## Teste local com Cloudflare

```bash
npm run dev:cloudflare
```

Esse comando gera `dist/` e inicia `wrangler dev` servindo os assets estáticos.

## Deploy no Cloudflare Workers

O projeto usa **Workers Static Assets**, não Cloudflare Pages. `wrangler.jsonc` aponta `assets.directory` para `./dist` e usa `not_found_handling: "single-page-application"`. Não existe Worker server-side porque o frontend conversa diretamente com Supabase sob proteção de Auth + RLS.

Autentique o Wrangler e execute:

```bash
npm run deploy
```

Depois inclua a URL publicada nas URLs permitidas do Supabase Auth.

## GitHub

```bash
git init
git add .
git commit -m "feat: initial jiu-jitsu drills PWA"
```

`.gitignore` exclui `node_modules`, `dist`, `.wrangler` e arquivos `.env`, preservando `.env.example`.

## Segurança

- RLS obrigatória nas quatro tabelas.
- Políticas separadas por operação.
- Índices em `user_id` e campos importantes de consulta/sync.
- Nenhuma tabela pessoal acessível a `anon`.
- Nenhuma chave secreta no frontend.
- Dados locais sempre filtrados por `user_id`.
- Soft delete para preservar consistência de sincronização.
