# Evox Fiscal CRM — TODO

## Requisitos Originais (v1/v2/v3 - já implementados)
- [x] Dashboard com métricas e gráficos
- [x] Cadastro de clientes com RED FLAGS
- [x] Repositório de teses tributárias com classificação e parecer
- [x] Motor de regras tributárias
- [x] Análise cruzada cliente x teses
- [x] Exportação Excel e PDF
- [x] Alertas de informações faltantes com justificativa
- [x] Parceiros comerciais CRUD
- [x] Fila de apuração com Kanban
- [x] Visão analítica por período
- [x] Procuração eletrônica no cadastro
- [x] Exceções e especificidades no cadastro
- [x] Rastreamento de quem cadastrou
- [x] Parceiros: ícone unificado (não diferenciar PF/PJ visualmente)
- [x] Dashboard: cards clicáveis que filtram por prioridade/status
- [x] Cores de prioridade: Alta=Vermelho, Média=Amarelo, Baixa=Azul
- [x] Logo Evox Fiscal em todos os PDFs gerados
- [x] Gestão de Usuários: admin CRUD
- [x] Visão detalhada do cliente com oportunidades e descartadas
- [x] Fila: analista só pode pegar a PRIMEIRA (FIFO)
- [x] Análise automática ao concluir cadastro
- [x] Revisão de carteira ao incluir nova tese
- [x] Persistência com banco de dados (full-stack)
- [x] Importação em massa via CSV/Excel
- [x] Notificações automáticas

## CRM v4 — Transformação em CRM Multisetorial

### Estrutura de Setores e Hierarquia
- [x] Tabela de setores (departamentos) com hierarquia
- [x] Hierarquia de usuários com 5+ níveis (Diretor, Gerente, Coordenador, Analista, Suporte)
- [x] Permissões granulares por setor e nível de acesso
- [x] Usuário pode pertencer a múltiplos setores

### Sistema de Tarefas e Subtarefas (estilo ClickUp)
- [x] Tabela de tarefas com campos completos (título, descrição, responsável, setor, prioridade, SLA)
- [x] Subtarefas vinculadas a tarefas pai
- [x] Tarefas multisetoriais (envolvem mais de um setor)
- [x] Status customizáveis por workflow (Backlog, A Fazer, Em Andamento, Revisão, Concluído, Cancelado)
- [x] SLA com prazos e alertas de vencimento
- [x] Rastreabilidade completa (log de ações/audit trail)
- [x] Comentários em tarefas
- [x] Visualização Kanban e Lista

### Armazenamento de Arquivos
- [x] Upload de arquivos vinculados a clientes, tarefas e teses
- [x] Armazenamento via S3 com metadados no banco
- [x] Visualização e download de arquivos no sistema
- [ ] Controle de versão de documentos (futuro)

### API REST Pública para Integrações
- [x] API REST documentada com autenticação por API Key
- [x] Endpoints para clientes, tarefas, parceiros, relatórios, setores, teses, audit
- [x] Preparada para integração com Conta Azul e outros CRMs
- [x] Endpoint /api/v1/health para monitoramento

### Dados de Teste
- [x] Seed de 5 clientes de teste com dados realistas (via botão admin)
- [x] Seed de 5 parceiros de teste (via botão admin)
- [x] Seed de 6 setores de teste (via botão admin)
- [x] Seed de 5 tarefas de teste (via botão admin)
- [x] Seed de 5 usuários de teste em diferentes níveis (inseridos via SQL)

### Segurança e Rastreabilidade
- [x] Audit log para todas as ações do sistema
- [x] Registro de IP, timestamp e usuário em cada ação
- [x] Controle de acesso baseado em papel (RBAC) com adminProcedure
- [x] Página de Audit Log com busca e filtros

### Frontend CRM
- [x] Página de Tarefas com visualização Kanban e Lista
- [x] Página de detalhe de tarefa com subtarefas, comentários e SLA
- [x] Página de Setores com CRUD e gestão de membros
- [x] Página de Arquivos com upload e listagem
- [x] Página de Audit Log com busca e filtros
- [x] Página de API & Integrações com gestão de chaves e documentação
- [x] Navegação sidebar atualizada com seções Operacional e Administração

### Testes
- [x] 33 testes vitest passando (auth, CRM structure, access control, dashboard)

## Futuro (Roadmap)
- [ ] Visualização Calendário para tarefas
- [ ] Menções (@usuario) em comentários
- [ ] Controle de versão de documentos
- [ ] Integração direta com Conta Azul via API
- [ ] App mobile Android/iOS (PWA ou React Native)
- [ ] Notificações push
- [ ] Relatórios de produtividade por setor/usuário
- [ ] Automações de workflow (regras de transição de status)

## Bugs
- [x] Fix: tRPC retornando HTML ao invés de JSON na página /clientes (erro "Unexpected token '<'") — proteção adicionada no catch-all do Vite

## CRM v5 — Reestruturação Setorial Completa

### Busca Global e Interface
- [x] Campo de pesquisa macro fixo no centro superior da tela (busca em todo o sistema)
- [x] Perfil de usuário com foto e dados cadastrais básicos

### Gestão de Usuários (melhorias)
- [x] Admin: incluir, excluir, alterar, inativar usuários
- [ ] Convite de acesso enviado por email ao concluir cadastro de novo usuário

### Reestruturação de Menu/Sidebar por Setores Reais
- [x] Dashboard (geral)
- [x] SPC – Suporte Comercial (submenus: Nova Tarefa, Gestão de Parcerias)
- [x] RCT – Crédito (submenus: Nova Tarefa, Fila de Apuração RCT, Teses Tributárias, Visão Analítica RCT)
- [x] DPT – Transação (submenus: Nova Tarefa, Fila de Apuração DPT, Visão Analítica DPT)
- [x] JUR – Jurídico (submenus: Nova Tarefa, Fila de Execução JUR)
- [x] RT – Reforma Tributária (submenus: Simulador de Impactos, Consultoria)
- [x] CT – Contratos (submenus: Nova Tarefa)
- [x] FIN – Financeiro (submenus: Nova Tarefa, Contas a Pagar, Contas a Receber, Contas Bancárias)
- [x] MKT – Marketing (submenus: Nova Tarefa, Redes Sociais, Imersões, Evox Podcast, Brindes)
- [x] RH – Gente e Gestão (submenus: Nova Tarefa, Colaboradores, Férias)

### Reorganização do Menu
- [x] Mover Parceiros para dentro de Administração
- [x] Remover Tarefas do menu principal (tarefas ficam na visão do usuário e dentro de cada setor)
- [x] Remover Arquivos e Importação CSV do menu principal
- [ ] Visão Analítica e Relatórios em todos os setores

### Gestão de Serviços por Setor
- [x] Tabela de serviços por setor (nome, % honorários comercial, forma de cobrança)
- [x] Admin: incluir, alterar, excluir, inativar serviços
- [x] Associação de serviços a setores

### Visão Setorial Restrita
- [ ] Cada setor vê apenas suas informações
- [ ] Apenas perfis autorizados podem ver além do próprio setor
- [ ] Gestor visualiza tarefas dos colaboradores (hierarquia de visualização)

### Nova Tarefa como Acesso Rápido
- [x] "Nova Tarefa" como menu de acesso rápido para criar demanda para setor/usuário
- [x] Associação automática ao setor do submenu

### Workflow Padrão por Setor
- [x] Status padrão: A Fazer → Fazendo → Feito → Concluído
- [x] Preparar estrutura para automações condicionais futuras (setor a setor, tarefa a tarefa)

### Integração com Email
- [x] Preparar estrutura para integração com emails dos usuários (futuro)

## CRM v6 — Melhorias de Usuários e Layout

### Layout / Sidebar
- [x] Corrigir espaçamento da sidebar para não sobrepor o conteúdo principal

### Gestão de Usuários (CRUD completo)
- [x] Incluir novo usuário com: nome completo, CPF, email, telefone, apelido
- [x] Editar usuário existente (todos os campos)
- [x] Excluir/inativar usuário
- [x] Campo "apelido" = como o nome aparece dentro do sistema (sidebar, comentários etc.)
- [x] Aplicar apelido no próprio usuário logado

### Perfil do Usuário
- [x] Upload de foto/imagem para o perfil do usuário
- [x] Exibir foto do perfil na sidebar e nos cards de usuário
