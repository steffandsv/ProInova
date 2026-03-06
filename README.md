# Plataforma ProInova Jaborandi (v1 scaffold)

Este repositório é um **ponto de partida funcional** (MVP) para a Plataforma ProInova descrita no Projeto de Lei.
Inclui:
- Next.js (Node runtime) + TypeScript
- Prisma (MySQL remoto)
- Autenticação básica (JWT em cookie httpOnly)
- Lookup de munícipe por CPF para auto-preenchimento no cadastro
- Estruturas iniciais de dados (Usuários, Editais, Propostas, Marcos, Avaliações)

> ⚠️ Segurança: **NUNCA** comite credenciais. Use `.env` apenas no servidor e **GitHub Actions Secrets** no deploy.

## Requisitos
- Node 20+
- Docker (para produção)
- Acesso ao MySQL remoto

## Rodando em desenvolvimento
1) Copie o arquivo `.env.example` para `.env` e preencha.
2) Instale dependências:
```bash
npm install
```
3) Gere o Prisma client:
```bash
npx prisma generate
```
4) Rode migrações (aponta para o MySQL remoto; use com cuidado):
```bash
npx prisma migrate dev --name init
```
5) Inicie:
```bash
npm run dev
```

## Produção (Docker)
- Build local:
```bash
docker build -t proinova-web .
docker run --env-file .env -p 3000:3000 proinova-web
```

- Deploy recomendado: GitHub Actions -> GHCR -> VPS (ver `.github/workflows/deploy.yml` e `docker-compose.prod.yml`).

## Estrutura
- `app/` UI + API routes (Next.js App Router)
- `prisma/` schema e migrações
- `lib/` utilitários (auth, validações, CPF)

## Próximos passos (roadmap curto)
- Upload de evidências e galeria do projeto (com armazenamento persistente/S3)
- Fluxo completo: Triagem -> Parecer Educação -> Avaliação CMAA -> Homologação
- Painel público consolidado + páginas públicas por projeto
- Exportação de pagamento/relatórios + trilha de auditoria
