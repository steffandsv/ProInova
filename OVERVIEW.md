# Overview Técnico - Plataforma ProInova Jaborandi

Este arquivo resume as principais descobertas técnicas, de negócios e de arquitetura da plataforma **ProInova Jaborandi**.

---

## 1. O que o projeto faz e qual problema ele resolve
A plataforma viabiliza a execução da **Lei Municipal do ProInova Jaborandi (Jaborandi-SP)**. Ela gerencia o fluxo completo de submissão, avaliação e prestação de contas de projetos de fomento à inovação pública (como desenvolvimento de softwares, apps, robótica, metodologias e conteúdos educacionais).
* **Problema que resolve:** Automatiza a admissão de cidadãos a partir de 14 anos, valida os CPFs em uma base municipal (`municipes`), auxilia os proponentes com uma **pré-análise baseada em IA** (DeepSeek/Qwen) que avalia se a proposta atende aos requisitos da lei, condiciona os pagamentos de bolsas (até R$ 1.000,00/mês) à validação mensal de **Marcos de Entrega**, e expõe páginas públicas dos projetos de forma transparente e segura, tratando dados de menores e projetos sob sigilo comercial (Artigo 19 da Lei e LGPD).

---

## 2. Stack Tecnológico Completo
* **Core:** Next.js v14.2.10 (App Router, Standalone build output) com TypeScript v5.5.4.
* **Banco de Dados & ORM:** MySQL (remoto) com Prisma Client v5.19.1.
* **Autenticação & Segurança:** Token JWT armazenado em cookie `httpOnly` (assinado via `jsonwebtoken` e encriptado com `bcryptjs` + PASSWORD_PEPPER).
* **Validação de Entrada:** Schemas declarativos do Zod v3.23.8 nas APIs do backend.
* **Editor Rich Text:** React Quill v2.0.0.
* **Estilização (CSS):** Vanilla CSS com design dark premium, HSL, glassmorphism, gradientes e animações scroll controladas via `IntersectionObserver` de forma nativa.
* **Integrações de IA:** Streamings HTTP com a API do **DeepSeek** (`deepseek-reasoner`) e fallback dinâmico para a API do **Qwen** (`qwen-max` na Alibaba Cloud) para analisar as propostas submetidas.

---

## 3. Arquitetura e Estrutura de Pastas Explicada
* **`prisma/schema.prisma`:** Modelagem relacional do banco de dados (tabelas de usuários, editais, propostas, membros da equipe, marcos do cronograma, evidências de entregas, avaliações do comitê, termos de outorga assinados e logs de auditoria).
* **`lib/`:** Lógica de negócio isolada contendo o motor de transições de status (`workflow.ts`), regras de higienização de PII e sigilo (`lgpd.ts`), validação de CPF (`cpf.ts`), orquestração de IA (`ai-preview.ts`) e auditoria (`audit.ts`).
* **`middleware.ts`:** Decodificação leve de JWT na borda (Edge-compatible) para roteamento e regras de acesso restrito (como `/admin` e `/api/admin`).
* **`app/api/`:** Controladores de rotas divididos entre `auth`, `admin` (revisão de propostas, aprovações, pareceres), `propostas` (CRUD e rascunhos de proponentes) e `projeto` (views públicas seguras).
* **`app/admin/`, `app/propostas/` e `app/transparencia/`:** Páginas do ecossistema Next.js.

---

## 4. Padrões e Convenções que Deve Seguir
1. **Transações Bancárias:** Modificações de múltiplos registros relacionados (como atualizar rascunho de proposta e recriar equipe/marcos) devem ser feitas dentro de blocos `prisma.$transaction(async (tx) => { ... })`.
2. **Registro de Auditoria:** Qualquer alteração de status do workflow ou gravação de rascunhos deve invocar a função `logAudit(...)` para manter a trilha de auditoria em conformidade com as regras de compliance público do programa.
3. **Higienização LGPD:** Respostas públicas sobre propostas ou equipes devem passar por `sanitizeForPublic` e `redactMinorData` para garantir que dados de menores de idade ou segredos de projeto sigilosos não vazem no Portal de Transparência.
4. **Verificação de JWT:** Em rotas de API que recebem objetos Request, a validação de sessão ativa e obtenção do ID/Perfil deve utilizar a função `requireAuth(request)`.

---

## 5. Pontos de Atenção, Dívidas Técnicas e Próximos Passos
* **Bypass de Build:** Os arquivos `tsconfig.json` e `next.config.js` estão configurados para **ignorar erros de ESLint e de TypeScript durante o build**. Isso mascara potenciais exceptions estáticas que precisam ser corrigidas antes do deploy definitivo.
* **Componentes Gigantes:** Telas como `nova/page.tsx` e `admin/propostas/[id]/page.tsx` possuem milhares de linhas que misturam renderização, lógica de formulários dinâmicos e manipulação de streaming de IA. Recomenda-se modularizar essas views em subcomponentes.
* **Armazenamento de Arquivos:** Atualmente, a persistência de uploads está configurada localmente. Conforme o roadmap, é necessário evoluir a lógica de upload para um serviço de storage persistente (como S3/compatível) para evitar perda de dados em novos deploys de contêineres Docker.
* **Logs de Auditoria:** Não existe chave física direta no Prisma associando `AuditLog` com a tabela `Proposta` (apenas string `entityId`), o que exige queries adicionais no banco.
