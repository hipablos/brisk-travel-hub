Esta é uma entrega grande. Proponho dividir em **3 fases entregáveis**, na ordem abaixo, com aprovação a cada fase para não acumular bugs.

---

## Fase 1 — Fundamentos (rápido)

1. **Favicon oficial**
   - Subir a imagem enviada (avião dourado em fundo azul) como asset do Brisk via Lovable Assets.
   - Aplicar como `<link rel="icon">` em `src/routes/__root.tsx` (substituir o atual).
   - Servir como favicon padrão e como `fallback` quando o admin remover o customizado.

2. **Remover sino de notificações** do `Topbar.tsx`.

3. **Menu do usuário no topbar**
   - Nome do usuário vira `DropdownMenu` com **Perfil** e **Logout**.
   - Logout: `supabase.auth.signOut()` + limpar storage + redirect para `/login`.

4. **Nova seção "Configurações" na sidebar** (acima/abaixo de Integrações, mesmo padrão visual) com 3 subitens:
   - Marca Brisk → `/configuracoes/marca`
   - Layout Login → `/configuracoes/layout-login`
   - Integrações → reaproveita rota existente `/integracoes`

   Cada subitem só aparece para usuários **admin** (já existe `has_role` + tabela `user_roles`? Verificar — se não existir, criar nesta fase).

---

## Fase 2 — Perfil do usuário

Rota `/perfil` (qualquer usuário logado):

- Tabela `profiles` já existe (5 colunas). Estender com: `nome_completo`, `cargo`, `avatar_url`, `idioma`, `tema` (se ainda não tiver). Migração + RLS (cada user lê/edita só o seu).
- Bucket Storage `avatars` (público) para foto de perfil.
- UI:
  - Dados pessoais (nome, e-mail readonly, cargo, criado em)
  - Upload/remover foto
  - Alterar senha (atual + nova + confirmar) via `supabase.auth.updateUser`
  - Preferências: tema (claro/escuro/auto — integra com `use-theme.tsx`), idioma (select preparado, sem i18n ativo)

---

## Fase 3 — Identidade visual gerenciável

Esta é a parte mais pesada. Proposta:

### Banco
- Nova tabela `brand_settings` (single row, id fixo, só admin escreve, todos leem):
  - `nome_sistema`, `logo_url`, `favicon_url`
  - cores: `cor_primaria`, `cor_secundaria`, `cor_destaque`, `cor_botoes`, `cor_links`
  - `tema_padrao` (claro/escuro/auto)
  - fundos: `fundo_login_tipo` (cor/gradiente/imagem), `fundo_login_valor`, `fundo_pdf_*`, `imagem_institucional_url`
  - empresa: `empresa_nome`, `cnpj`, `telefone`, `email`, `site`, `endereco`
- Nova tabela `login_layout_settings`:
  - `fundo_tipo`, `fundo_valor`
  - cores: `cor_botao`, `cor_secundaria`, `cor_textos`, `cor_campos`, `cor_icones`, `cor_links`, `cor_card`
  - logo: `logo_url`, `logo_largura`, `logo_altura`, `logo_alinhamento`
  - textos: `titulo`, `subtitulo`
- Bucket Storage `brand` (público) para logos/favicons/fundos.
- RLS: SELECT para `authenticated` + `anon` (login precisa ler antes de logar); UPDATE só `admin`.

### Aplicação em runtime
- Hook `useBrandSettings()` que carrega 1x no boot (`__root.tsx`) e:
  - Injeta CSS variables (`--primary`, `--secondary`, etc.) no `<html>` sobrescrevendo `src/styles.css`.
  - Atualiza `<link rel="icon">` dinamicamente.
  - Atualiza `document.title` com `nome_sistema`.
- Sidebar/login/topbar passam a usar `logo_url` do contexto (fallback: `BriskLogo`).
- Tela de login lê `login_layout_settings` e renderiza dinamicamente.

### Páginas
- `/configuracoes/marca`: formulário completo + preview ao vivo (sidebar mock, login mock, header PDF mock, favicon preview). Botões Salvar e Restaurar padrão.
- `/configuracoes/layout-login`: formulário + preview ao vivo do login. Salvar/Restaurar padrão.

### PDFs
- Cabeçalho dos PDFs passa a ler logo + dados da empresa de `brand_settings`. *(Precisa confirmar onde os PDFs são gerados hoje — não vi módulo de geração de PDF no código atual; pode ser que ainda não exista.)*

---

## Pontos a confirmar antes de começar

1. **Roles de admin**: o sistema já tem tabela `user_roles` + função `has_role`? Não aparece na lista de tabelas. Posso criá-la na Fase 1 e marcar você como admin?
2. **PDFs**: existe hoje geração de PDF no sistema? Não encontrei módulo. Se não existir, deixo a Fase 3 *preparada* (campos salvos no banco) mas sem integração ativa, e integramos quando o módulo de PDFs for criado.
3. **Tema automático**: já existe `use-theme.tsx`. Vou integrar com ele.
4. Posso seguir **fase a fase**, entregando e validando cada uma antes de ir pra próxima? Ou prefere que eu faça tudo em uma tacada só (risco maior de regressões)?

Responda esses 4 pontos e eu começo pela Fase 1.
