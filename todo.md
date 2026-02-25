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

- [x] Fix: erro recorrente tRPC retornando HTML ao invés de JSON na página principal — retry automático com backoff exponencial no cliente

## CRM v7 — Evolução Completa do CRM

### Renomear Setores (remover siglas)
- [x] SPC → Suporte
- [x] RCT → Crédito
- [x] DPT → Transação
- [x] JUR → Jurídico
- [x] RT → Reforma
- [x] CT → Contratos
- [x] FIN → Financeiro
- [x] MKT → Marketing
- [x] RH → Gente e Gestão
- [x] Ao recolher menu, manter somente o ícone dos setores (tooltips)

### Novos Setores
- [x] Contencioso (submenus: Nova Tarefa, Fila de Execução, Relatório)
- [x] Comercial (submenus: Nova Tarefa, Fila de Execução, Relatório)
- [x] Soluções Financeiras (submenus: Nova Tarefa, Fila de Execução, Relatório)
- [x] Universidade Evox (repositório de treinamentos internos)
- [x] Evox Monitor (monitoramento tributário e-CAC/Regularize)

### Reorganização do Menu
- [x] Mover Parceiros e Clientes para dentro do Suporte (submenu)
- [x] Ordenar setores em ordem alfabética
- [x] Dentro de Crédito: adicionar submenu "Média de Guias" (funcionalidade do evoxguias)

### Integração Google
- [ ] Integração com Gmail
- [ ] Integração com Google Drive
- [ ] Integração com Google Docs
- [ ] Integração com Google Calendar (Agenda)

### Premissas Básicas (transversal a todo o sistema)
- [x] Rastreabilidade de processos e informações
- [x] Segurança da informação por perfil de usuário
- [x] Hierarquia de acessos
- [x] Gestão de prazos (SLA)
- [x] Integração de setores na criação de tarefas/subtarefas
- [x] Geração de relatórios gerenciais

### Histórico Imutável
- [x] Histórico de alterações imutável (ninguém pode excluir/alterar/editar) — tabela cliente_historico
- [x] Histórico individualizado por setor
- [x] Histórico individualizado por cliente (quem fez, quando fez, o que fez, o que deixou de fazer)
- [x] Registro de: inclusão, edição, exclusão, ativação, inativação de clientes, parceiros, usuários

### SLA Configurável pelo Admin
- [x] Admin pode definir SLA padrão de cada tarefa diretamente no sistema
- [x] Admin pode alterar SLA a qualquer momento
- [x] Cada departamento pode ter tarefas padrão com SLAs atribuídos
- [x] Somente admin pode criar, alterar, excluir, ativar ou inativar tarefas padrão

### Serviços e Automação de Tarefas
- [x] Serviço = produto principal comercializado pela Evox
- [x] Cada serviço tem etapas/tarefas que a equipe segue durante execução
- [x] Ao atribuir serviço a um cliente, sistema gera automaticamente as tarefas dos setores
- [x] Tarefas entram automaticamente na fila de execução de cada setor (critério: data/hora)
- [x] Somente coordenador do setor pode alterar a fila de execução (prioridade)

### Gestão de Parcerias (Administração)
- [x] Menu "Gestão de Parcerias" dentro de Administração
- [x] Classificação: Parceiro Diamante, Parceiro Ouro, Parceiro Prata
- [x] Percentuais de comissão por serviço e por modelo de parceria
- [x] Serviços do menu Serviços replicados dentro de cada modelo de parceria com seus percentuais

### Gestão de Comissões de Parceiros
- [x] No cadastro do parceiro: selecionar produtos/serviços que vai trabalhar com a Evox
- [x] Sistema traz comissão padrão predefinida no cadastro de serviços
- [x] Usuário pode alterar percentual: se menor → alerta de dupla conferência
- [x] Se percentual maior que padrão → requer autorização do diretor (tarefa automática de aprovação)
- [x] Alterar percentual no cadastro de serviço NÃO altera parceiros já cadastrados (somente novos)
- [x] Opção de alterar para todos mediante aprovação da diretoria

### Subparceiros
- [x] Atribuir parceiro à equipe de outro parceiro (Parceiro e Subparceiro)
- [x] Gestão de repasse de comissões entre parceiro e subparceiro
- [x] Exemplo: Parceiro X recebe 50%, repassa 40% ao subparceiro Y, fica com 10%
- [x] Associar subparceiro a parceiro e fazer gestão de comissão
- [x] Em todas as visões do cliente, exibir parceiro responsável e se é subparceiro (a quem está ligado)

### Cadastro de Clientes (melhorias)
- [ ] Regime tributário: campo sempre em branco com dropdown (Simples Nacional, Lucro Presumido, Lucro Real)
- [x] Ao digitar CNPJ: auto-fill CNAE principal, descrição CNAE, segmento econômico, UF e cidade
- [ ] Opção de cadastrar clientes pessoa física (CPF)
- [ ] Rolagem de tela responsiva em todos os dispositivos

### Campos Configuráveis pelo Admin
- [ ] Admin pode determinar se campo é obrigatório ou não
- [ ] Admin pode incluir, excluir ou editar campos de formulários

### Relatórios
- [x] Todos os relatórios com download em PDF e Excel (botões funcionais)
- [ ] Relatório por parceiro
- [ ] Relatório por tipo de produto/serviço
- [ ] Relatório por setor
- [ ] Relatório por colaborador
- [ ] Relatório por indicadores financeiros
- [ ] Relatório de produtividade

### Portal do Parceiro (acesso restrito)
- [ ] Parceiro tem acesso restrito à sua carteira de clientes
- [ ] Parceiro vê andamento das execuções etapa por etapa
- [ ] Parceiro recebe notificações importantes (ex: análise concluída)

### Visão do Colaborador
- [x] Colaborador vê apenas suas tarefas e tarefas atribuídas a ele
- [x] Visão focada na execução (sem dispersão com outras visões)

### Perfil do Usuário (melhorias)
- [ ] Recorte/ajuste de foto no upload de imagem do perfil

### Média de Guias (dentro de Crédito)
- [ ] Integrar funcionalidade do evoxguias dentro do CRM (submenu Crédito > Média de Guias)

### Serviços (CRUD completo)
- [x] Criar, alterar, excluir, ativar, inativar serviços
- [x] Associar setor(es) responsável(is) pela execução de cada serviço
- [x] Associar pessoa(s) responsável(is) pela execução
- [x] Percentual padrão de comissão por tipo de parceria (Diamante/Ouro/Prata)

## CRM v8 — Integrações Google

### Gmail
- [ ] Página de Email integrada ao CRM (inbox, busca, leitura de threads)
- [ ] Envio de emails diretamente do CRM (com confirmação)
- [ ] Vincular emails a clientes/tarefas/parceiros
- [ ] Busca de emails por remetente, assunto, data

### Google Calendar (Agenda)
- [ ] Página de Agenda integrada ao CRM
- [ ] Visualização de eventos do Google Calendar
- [ ] Criar eventos diretamente do CRM (reuniões, prazos)
- [ ] Vincular eventos a clientes/tarefas
- [ ] Atualizar e excluir eventos

### Google Drive
- [ ] Página de Drive integrada ao CRM
- [ ] Navegação por pastas e arquivos do Google Drive
- [ ] Upload de arquivos para o Drive via CRM
- [ ] Vincular arquivos do Drive a clientes/tarefas

### Google Docs
- [ ] Visualização de documentos Google Docs no CRM
- [ ] Criar documentos a partir de templates
- [ ] Vincular documentos a clientes/tarefas

## CRM v9 — Correções e Premissas Básicas

### Bugs
- [x] Fix: erro ao cadastrar novo serviço

### Premissas Básicas (reforço em todo o sistema)
- [x] Rastreabilidade: todas as ações de CRUD geram entrada no audit log imutável
- [ ] Segurança: acessos delimitados por perfil de usuário (RBAC) em todas as entidades
- [ ] Hierarquia: respeitar níveis de acesso em todas as operações
- [ ] SLA: gestão de prazos integrada em tarefas e subtarefas
- [ ] Integração setorial: tarefas e subtarefas vinculadas a setores
- [ ] Relatórios gerenciais: disponíveis em todas as entidades principais
- [ ] Histórico imutável individualizado por cliente (quem fez, quando, o que fez)
- [ ] Histórico imutável individualizado por setor
- [x] CRUD completo em todas as entidades: incluir, editar, excluir, ativar, inativar
- [x] UX fluida estilo Apple: priorizar usabilidade e fluidez do trabalho

## CRM v10 — Reformulação do Cadastro de Serviços

### Formulário de Novo Serviço (melhorias)
- [x] Comissão padrão por modelo de parceria (Diamante/Ouro/Prata) no cadastro do serviço
- [x] Vincular comissões do serviço automaticamente aos modelos de parceria na Gestão de Parcerias
- [x] Percentual padrão de honorários cobrado do cliente
- [x] Novas formas de cobrança: Entrada + Êxito, Percentual sobre Êxito
- [x] Valor fixo com possibilidade de parcelamento e quantidade de parcelas
- [x] Atualizar backend para suportar novos campos de serviço
- [x] Atualizar schema do banco de dados para novos campos

## CRM v11 — Melhorias no Cadastro de Clientes

### Rolagem Responsiva
- [x] Corrigir rolagem de tela em todas as telas/dialogs para dispositivos variados
- [x] Formulário de novo cliente com scroll adequado (campos não ficam invisíveis)

### Indicador Novo/Base
- [x] Campo indicador no cadastro: Cliente Novo ou Cliente Base
- [x] Conversão automática: após 90 dias do cadastro, Cliente Novo vira Cliente Base
- [x] Informação visível na listagem e visão detalhada do cliente

### Endereço
- [x] Adicionar campo Complemento no endereço
- [x] Auto-preencher complemento via consulta CNPJ quando disponível

### Busca CNPJ Expandida
- [x] Buscar quadro societário via CNPJ
- [x] Buscar CNAEs secundários via CNPJ
- [x] Buscar data de abertura via CNPJ
- [x] Preencher segmento econômico automaticamente baseado nos CNAEs

### Pessoa Física
- [x] Opção de cadastrar cliente pessoa física (CPF)
- [x] Formulário adaptado para PF (sem CNPJ, razão social, etc.)

### Procuração Eletrônica (melhorias)
- [x] Toggle habilitada/desabilitada com indicador visual (vermelho quando desabilitada)
- [x] Campo certificado vinculado (Gercino Neto ou Evox Fiscal) quando habilitada
- [x] Campo data de validade da procuração quando habilitada
- [x] Alerta de próximo ao vencimento (7 dias antes)
- [x] Alerta de procuração vencida
- [x] Informação da procuração acompanha o cliente em todas as visões

## CRM v12 — Reformulação do Formulário de Cliente

### Layout do Formulário
- [x] Remover abas/tabs do formulário de novo/editar cliente
- [x] Tela única com rolagem contínua (todos os campos visíveis em sequência)
- [x] Botão "Cadastrar Cliente" somente ao final do formulário

### Campos Obrigatórios
- [x] Parceiro Comercial como campo obrigatório (incluindo opção "Nenhum")
- [x] Procuração Eletrônica como campo obrigatório (mesmo que desabilitada)

### Proteção contra Perda de Dados
- [x] Alerta de confirmação ao clicar em Cancelar
- [x] Alerta de confirmação ao clicar fora do formulário (fechar dialog)
- [x] Não perder dados preenchidos ao clicar acidentalmente

## CRM v12.1 — Ajustes no Formulário de Cliente

### Campo CNPJ
- [x] Aumentar largura do campo CNPJ para visualizar número completo

### Classificação do Cliente
- [x] Deixar classificação em branco por padrão (sem seleção)
- [x] Tornar classificação obrigatória (validação no submit)

### Parceiro Comercial
- [x] Remover opção "Nenhum" do dropdown de parceiro
- [x] Parceiro obrigatório sem fallback

### Consulta CNPJ Cruzada
- [x] Consultar múltiplas APIs (BrasilAPI + CNPJ.ws)
- [x] Priorizar fonte com dados mais recentes
- [x] Exibir data de atualização da base de dados
- [x] Aviso visual quando dados podem estar desatualizados (base > 30 dias)
- [x] Motivo da situação cadastral quando disponível
- [x] Nota explicativa sobre dumps periódicos da Receita Federal

## CRM v12.2 — Ajustes no Formulário de Cliente

### Layout
- [x] Corrigir sobreposição do campo Razão Social sobre o botão Consultar
- [x] CNPJ e Consultar em uma linha, Razão Social em linha separada ou layout adequado

### Natureza Jurídica
- [x] Preencher natureza jurídica automaticamente via consulta CNPJ

### Remoção de Seção
- [x] Excluir seção "Atividades e Tributos" do formulário de cliente

## CRM v12.3 — Ajustes Formulário Cliente

### Dados Financeiros
- [x] Incluir Folha Pagamento Média na lista de campos faltantes que pedem justificativa

### CNPJ
- [x] Máscara automática de CNPJ (XX.XXX.XXX/XXXX-XX) ao digitar somente números

## CRM v12.4 — Ajustes Detalhe do Cliente

### Página de Detalhe do Cliente
- [ ] Remover campos Atividades/Tributos (Industrializa, Comercializa, etc.) da página de detalhe
- [ ] Incluir Folha Pagamento Média nos Dados Financeiros da página de detalhe
- [ ] Incluir Folha Pagamento nos Alertas de Informação quando valor for zero

### Segmento Econômico
- [x] Remover preenchimento automático do segmento via CNPJ
- [x] Deixar segmento econômico manual, em branco, com preenchimento obrigatório
- [x] Campo Segmento Econômico como combobox com autocomplete (atividades do salario.com.br/empresas, ordem alfabética, filtro dinâmico ao digitar)

### Menu Lateral - Reorganização
- [x] Renomear "Setores" para "Equipes" no menu lateral
- [x] Agrupar todas as equipes dentro de um menu colapsável "Equipes"
- [x] Manter Universidade Evox fora do agrupamento de Equipes
- [x] Menu "Equipes" abre/fecha ao clicar (visualmente mais limpo)

### Reformulação Completa do Cadastro de Parceiros
- [x] Tipo de pessoa (PF/PJ) como primeiro campo, condiciona formulário
- [x] PF: campos padrão (nome, CPF com validação, RG, email, telefone, endereço completo com complemento)
- [x] PJ: consulta automática CNPJ (razão social, endereço, situação cadastral, quadro societário)
- [x] PJ: campo para sócio PF responsável pela parceria (dados completos)
- [x] Campo Apelido (nome de exibição do parceiro no sistema)
- [x] Validador automático de CPF
- [x] Dados bancários (banco, agência, conta, tipo conta, chave PIX)
- [x] Seleção de serviços que o parceiro trabalha (importados da aba Serviços)
- [x] Campo parceiro/subparceiro com seleção de parceiro pai quando subparceiro
- [x] Hierarquia parceiro/subparceiro acompanha toda jornada no sistema
- [x] Exibir info parceiro/subparceiro nas visões de clientes/empresas
- [x] Schema: novos campos na tabela parceiros (tipoPessoa, apelido, razaoSocial, etc.)
- [x] Schema: tabela dados bancários do parceiro
- [x] Testes unitários para validação CPF e hierarquia parceiro/subparceiro

### CRM v13 — Comissões, Executivos Comerciais e Melhorias no Cadastro de Parceiros

#### Comissões Editáveis com Alertas
- [x] Campo modelo parceria (Diamante/Ouro/Prata) busca automática da Gestão de Parcerias
- [x] Comissão padrão carregada automaticamente mas editável
- [x] Alerta se comissão editada for menor que o padrão (confirmar para seguir)
- [x] Alerta se comissão editada for maior que o padrão (enviar tarefa de aprovação ao Diretor)
- [x] Parâmetro de comissão baseado no percentual cadastrado em Gestão de Parcerias e Serviços

#### Rateio de Comissão para Subparceiros
- [x] Habilitar rateio de comissão por tipo de serviço quando subparceiro
- [x] Rateio parceiro + subparceiro jamais pode exceder o percentual máximo do modelo
- [x] Validação automática do teto de comissão por serviço

#### Executivos Comerciais
- [x] Schema: tabela executivos_comerciais
- [x] CRUD completo de Executivos Comerciais (incluir, editar, excluir, ativar, inativar)
- [x] Submenu "Executivos Comerciais" dentro do menu Comercial na sidebar
- [x] Página de listagem e cadastro de Executivos Comerciais

#### Associação Executivo ao Parceiro
- [x] Campo para associar Executivo Comercial ao parceiro no cadastro
- [x] Subparceiro herda automaticamente o Executivo do parceiro pai
- [x] Subparceiro não pode ter Executivo diferente do parceiro pai
- [x] Info do Executivo acompanha o parceiro em toda jornada no sistema

#### Formulário de Parceiro - Melhorias UX
- [x] Formulário em aba única com rolagem (remover tabs)
- [x] Proteção contra perda de dados (alerta ao cancelar ou clicar fora)
- [x] Admin pode incluir, excluir, ativar, inativar e editar todos os parceiros

## CRM v14 — Detalhes do Cliente, Filtros, Aprovações e Relatórios

### Correção da Tela de Detalhes do Cliente
- [x] Remover campos obsoletos (Industrializa, Comercializa, Presta Serviços, Contribuinte ICMS, Contribuinte IPI)
- [x] Adicionar valor médio da folha de pagamento nos Dados Financeiros (já existia)
- [x] Incluir Folha Pagamento nos Alertas de Informação quando valor for zero (já existia)

### Filtro por Parceiro na Lista de Clientes
- [x] Adicionar dropdown de filtro por parceiro na lista de clientes
- [x] Permitir filtrar por parceiro ou subparceiro específico
- [x] Exibir contagem de clientes filtrados

### Painel de Aprovações de Comiss- [x] Criar página de aprovações de comissão para o Diretor
- [x] Listar solicitações pendentes com detalhes (parceiro, serviço, % solicitado vs padrão)
- [x] Botões de aprovar/rejeitar com campo de observação
- [x] Histórico de aprovações/rejeições
- [x] Cards de resumo (pendentes, aprovadas, rejeitadas)
- [x] Adicionar link no menu Administração- [x] Criar página de relatório de comissões
- [x] Visão consolidada das empresas vinculadas a cada parceiro/subparceiro
- [x] Cálculo de comissões baseado nos serviços contratados
- [x] Filtros por modelo de parceria, executivo comercial e tipo (parceiro/subparceiro)
- [x] Exibir hierarquia parceiro/subparceiro no relatório
- [x] Adicionar rota e menu na sidebar

## CRM v15 — Correções Cadastro de Parceiros
- [x] Corrigir consulta automática de CNPJ (não está buscando dados e dá erro de CNPJ inválido)
- [x] Adicionar busca automática de endereço por CEP (ViaCEP)
- [x] Tornar todos os campos obrigatórios no cadastro de parceiros

## CRM v16 — Filtros Avançados e Cards de Empresa

### Filtros na Lista de Clientes
- [x] Filtro por parceiro ou subparceiro
- [x] Filtro por tipo: cliente novo ou base
- [x] Filtro por procuração: habilitada, vencida ou próximo do vencimento
- [x] Filtro por prioridade
- [x] Filtro por status: ativo ou inativo
- [x] Filtro por segmento econômico
- [x] Filtro por regime tributário

### Cards de Empresa (todas as visões)
- [x] Exibir parceiro/subparceiro no card
- [x] Exibir indicador novo/base no card
- [x] Exibir status da procuração no card
- [x] Exibir prioridade no card
- [x] Exibir status ativo/inativo no card
- [x] Exibir segmento econômico no card
- [x] Exibir regime tributário no card
- [x] Propagar cards atualizados em todas as visões do sistema (lista, detalhe, fila, relatórios)

## CRM v16.1 — Ajustes nos Filtros de Clientes

### Layout dos Filtros
- [x] Campos maiores com largura fixa (não expandem com o texto)
- [x] Diminuir espaçamento entre os campos de filtro
- [x] Filtros fixos (não mudam de tamanho conforme seleção)

### Opção "Sem Atribuição"
- [x] Adicionar opção "Sem atribuição" em todos os menus de filtro
- [x] Filtrar empresas que não possuem a informação preenchida

### Autocomplete nos Filtros
- [x] Campo de digitação autocomplete no filtro de Parceiro (muitas opções)
- [x] Campo de digitação autocomplete no filtro de Segmento (muitas opções)

### Ordem Alfabética
- [x] Todas as opções dos menus de filtro em ordem alfabética

## CRM v16.2 — Correção Alerta Comissão e Percentuais
- [x] Corrigir loop infinito no alerta de comissão acima do padrão (Usar Padrão / Solicitar Aprovação não funciona)
- [x] Corrigir "Continuar Editando" que gera loop infinito com alerta "Deseja sair do cadastro?"
- [x] Padronizar todos os percentuais de comissão para 1 casa decimal após a vírgula

## CRM v16.3 — Correção Definitiva do Alerta de Comissão
- [x] Remover abordagem onBlur que causa loop infinito no alerta de comissão
- [x] "Usar Padrão": resetar percentual ao padrão e retornar ao formulário normalmente
- [x] "Solicitar Aprovação": manter percentual solicitado, criar tarefa de aprovação para Diretor, marcar como pendente no parceiro, retornar ao formulário
- [x] Garantir que o usuário sempre consiga voltar ao formulário de edição após interagir com o alerta
- [x] Comissão abaixo do padrão: "Continuar" mantém o valor e volta ao formulário

## CRM v16.4 — Refatoração Comissão + Fonte Menus
- [x] Campo de comissão padrão somente leitura (não editável)
- [x] Campos de rateio (% Parceiro Principal e % Subparceiro) editáveis com auto-cálculo da diferença
- [x] Alerta de comissão abaixo dos campos de rateio sem sobrepor campos
- [x] Se soma dos rateios > padrão: alerta "acima do padrão" com opções Usar Padrão / Solicitar Aprovação
- [x] Se soma dos rateios < padrão: alerta "abaixo do padrão" com opção Confirmar Valor
- [x] Aumentar suavemente o tamanho da fonte de todos os menus e submenus da sidebar

## CRM v17 — Novo Setor, Gestão de Usuários, Histórico e Chat Interno

### Novo Setor
- [x] Criar setor "IA e Tecnologia" dentro de Equipes com submenu "Nova Tarefa"

### Gestão de Usuários (melhorias)
- [x] Dropdown obrigatório para associar usuário a um setor no cadastro de novo usuário
- [x] Adicionar nível de acesso "Supervisor"
- [x] Remover nível de acesso "Suporte Comercial"

### Histórico de Usuários
- [x] Histórico completo de todos os usuários (ativos e inativos)
- [x] Registrar criação, alterações e inativação com data/hora e quem realizou
- [x] Exibir histórico na tela de gestão de usuários

### Chat Interno
- [x] Chat geral para comunicação interna entre usuários do sistema
- [x] Schema de banco de dados para mensagens do chat
- [x] Backend (tRPC procedures) para enviar, listar e buscar mensagens
- [x] Frontend com interface de chat em tempo real
- [x] Menções a @usuários dentro do chat
- [x] Menções a @clientes dentro do chat

## CRM v17.1 — Chat: Canais, Notificações e Menções

### Renomear e Reorganizar
- [x] Renomear "Chat Interno" para apenas "Chat" em toda a aplicação

### Menções
- [x] Usar @ apenas para mencionar usuários
- [x] Usar # para mencionar clientes (código diferente do @)
- [x] Atualizar frontend para suportar ambos os códigos de menção

### Canais/Salas
- [x] Schema de banco de dados para canais (por setor ou projeto)
- [x] Backend para criar, listar e gerenciar canais
- [x] Frontend com lista de canais na sidebar do chat
- [x] Canal "Geral" padrão para todos os usuários

### Notificações de Menção
- [x] Schema de banco de dados para notificações de menção
- [x] Backend para criar e marcar notificações como lidas
- [x] Badge/balão no ícone do Chat na sidebar com contagem de não lidas
- [x] Badge/balão nas conversas/canais com menções não lidas

## CRM v18 — Módulo RH: Gente & Gestão

### Renomear Setor
- [x] Renomear "Gente e Gestão" para "Gente & Gestão"

### 1. Nova Tarefa (submenu)
- [x] Interface para criar tarefas rápidas do setor
- [x] Atribuir usuários do setor como responsáveis
- [x] Nome da tarefa, prazo de início e fim, status

### 2. Colaboradores (submenu)
- [x] Cadastro com dados pessoais (nome, CPF, RG, CTPS, PIS/PASEP, etc.)
- [x] Dados profissionais (admissão, cargo, remuneração, jornada, tipo contrato)
- [x] Dados de saúde (ASO admissional)
- [x] Dados bancários e dependentes
- [x] Alerta para data de admissão retroativa
- [x] Listagem e busca de colaboradores

### 3. Férias (submenu)
- [x] Gestão de férias conforme regras CLT
- [x] Cálculo automático de período aquisitivo e concessivo
- [x] Alertas de férias em dobro, fracionamento, início proibido
- [x] Fluxo de solicitação de folgas/férias com aprovação hierárquica
- [x] Justificativa obrigatória em caso de recusa

### 4. Ações e Benefícios (submenu)
- [x] Interface para cadastro e gestão de ações (fit, solidárias, campanhas)
- [x] Medição de engajamento da equipe

### 5. Atestados e Licenças (submenu)
- [x] Gestão de atestados médicos dos colaboradores
- [x] Gestão de licenças (maternidade, paternidade, etc.)

### 6. Cargos e Salários (submenu)
- [x] Visão analítica por setor, nível e custo salarial
- [x] Dashboard para diretoria com dados consolidados

### 7. Carreira & Desenvolvimento (submenu)
- [x] Planos de carreira e desenvolvimento para a equipe
- [x] Gestão de trilhas de desenvolvimento

### Infraestrutura
- [x] Schema de banco de dados para todas as tabelas do módulo RH
- [x] Rotas backend (tRPC) para CRUD de todas as entidades
- [x] Atualizar sidebar com os 7 submenus
- [x] Testes unitários para as rotas do módulo RH

## CRM v18.1 — Refatoração Formulário Colaboradores

### Layout
- [x] Remover abas e colocar todos os dados em aba única com rolagem
- [x] Alerta de sair e descartar alterações ao fechar formulário

### Dados Pessoais
- [x] Validador automático de CPF no campo CPF
- [x] Máscara de telefone com separadores (XX) XXXXX-XXXX
- [x] Preenchimento automático de endereço a partir do CEP (via API ViaCEP)

### Dados Profissionais
- [x] Jornada de trabalho com dias da semana (checkboxes)
- [x] Vale transporte com toggle Sim/Não (verde/vermelho)

### Dados Bancários
- [x] Campo Chave PIX

### Saúde
- [x] ASO Apto com toggle Sim/Não (verde/vermelho)

### Dependentes
- [x] Opções pré-definidas de parentesco (cônjuge, filho, etc.)
- [x] Nome completo, data de nascimento e idade calculada automaticamente

### Dados de Teste
- [x] Inserir 5 colaboradores de teste para refletir em todos os ambientes do sistema

## CRM v19 — Integração RH Avançada

### Integração Colaboradores + Férias
- [x] Selecionar colaborador do cadastro ao registrar férias
- [x] Pré-preencher dados do colaborador automaticamente
- [x] Gestão de saldo de dias de férias por período aquisitivo
- [x] Controle de fracionamento (máx 3 períodos, mín 14 dias no primeiro)
- [x] Exibir saldo restante ao registrar nova férias

### Integração Colaboradores + Atestados
- [x] Selecionar colaborador do cadastro ao registrar atestado
- [x] Pré-preencher dados do colaborador automaticamente

### Relatórios RH (submenu)
- [x] Dashboard de headcount por setor com gráficos
- [x] Dashboard de turnover (admissões vs desligamentos)
- [x] Dashboard de absenteísmo (atestados e licenças)
- [x] Dashboard de custo salarial por período e setor
- [x] Adicionar submenu "Relatórios" na sidebar do Gente & Gestão

### Avaliação de Desempenho 360°
- [x] Schema para ciclos de avaliação
- [x] Avaliação por múltiplas perspectivas (gestor, pares, autoavaliação)
- [x] Vincular avaliações aos planos de carreira
- [x] Interface para criar e gerenciar ciclos de avaliação

### Upload de Documentos do Colaborador
- [x] Upload de foto do colaborador
- [x] Upload de RG digitalizado
- [x] Upload de CTPS digitalizado
- [x] Upload de ASO digitalizado
- [x] Armazenamento via S3 com referência no banco

## CRM v20 — Avaliação Avançada, PDF e KPIs

### Notificações Automáticas de Avaliação
- [x] Notificar colaboradores quando novo ciclo de avaliação for aberto
- [x] Notificar colaboradores quando houver avaliações pendentes
- [x] Integrar com sistema de notificações existente (notificacoes table)
- [x] Disparar notificações ao criar/ativar ciclo e ao registrar avaliação

### Exportação de Relatórios RH em PDF
- [x] Botão de exportação PDF no dashboard de Relatórios RH
- [x] Gerar PDF formatado com KPIs, tabelas e gráficos
- [x] Endpoint backend para geração do PDF server-side

### Painel de Metas Individuais (KPIs)
- [x] Schema para metas individuais vinculadas a ciclos de avaliação
- [x] CRUD de metas com título, descrição, meta numérica e progresso
- [x] Interface para gerenciar metas por colaborador
- [x] Vincular metas às avaliações 360° para medir evolução
- [x] Rota e submenu no Gente & Gestão

## CRM v21 — Ajustes Formulário Colaboradores e Status

### Correção de Layout do Formulário
- [x] Corrigir textos sobrepostos nos campos do formulário de cadastro
- [x] Aumentar campos pequenos (especialmente dependentes)
- [x] Melhorar espaçamento geral entre campos e seções
- [x] Garantir que labels não sobreponham inputs

### Campo de Status do Colaborador
- [x] Adicionar campo statusColaborador ao schema (ativo, inativo, afastado, licença, atestado, desligado, férias)
- [x] Adicionar campo ao formulário de cadastro/edição
- [x] Exibir status na listagem de colaboradores com badges visuais
- [x] Atualizar Relatórios RH para refletir os novos status
- [x] Atualizar dashboard de headcount para considerar os novos status

## CRM v22 — Melhorias no Chat

### Correção de Rolagem
- [x] Habilitar rolagem no chat em telas menores
- [x] Garantir layout responsivo funcional em mobile/tablet

### Controles Administrativos do Chat
- [x] Excluir mensagens individuais (admin)
- [x] Limpar todo o histórico de um chat (admin)
- [x] Ativar/inativar canais de chat (admin)
- [x] Indicação visual de mensagens excluídas

### Notificações do Chat
- [x] Notificar usuário sobre novas mensagens em chats que participa
- [x] Notificar quando o usuário for mencionado (@nome) em uma mensagem
- [x] Badge de contagem de mensagens não lidas
- [x] Integrar com sistema de notificações existente

## CRM v23 — Status Automático, Histórico e Filtros Avançados

### Alteração Automática de Status
- [x] Ao registrar férias, alterar status do colaborador para 'ferias' automaticamente
- [x] Ao registrar atestado, alterar status do colaborador para 'atestado' automaticamente
- [x] Ao registrar desligamento/demissão, alterar status para 'desligado' automaticamente
- [x] Ao encerrar férias/atestado, retornar status para 'ativo' automaticamente

### Histórico de Mudanças de Status
- [x] Criar tabela historico_status_colaborador no schema
- [x] Registrar cada alteração de status com data, motivo e usuário responsável
- [x] Exibir timeline de histórico no cadastro do colaborador
- [x] Permitir consulta de auditoria por colaborador

### Filtros Avançados na Listagem de Colaboradores
- [x] Filtro por local de trabalho
- [x] Filtro por cargo
- [x] Filtro por setor
- [x] Filtro por status do colaborador
- [x] Filtro por vale transporte (sim/não)
- [x] Filtro por nível hierárquico
- [x] Filtro por tipo de contrato
- [x] Combinar múltiplos filtros simultaneamente
- [x] Limpar todos os filtros com um clique

## CRM v24 — Exportação, Aniversariantes e Alertas de Contrato

### Exportação da Listagem Filtrada em Excel/CSV
- [x] Botão de exportação na listagem de colaboradores
- [x] Exportar apenas os colaboradores visíveis (respeitando filtros ativos)
- [x] Gerar arquivo Excel (.xlsx) com todas as colunas relevantes
- [x] Opção de exportar em CSV também
- [x] Incluir nome do filtro aplicado no nome do arquivo

### Dashboard de Aniversariantes do Mês
- [x] Card no painel principal com aniversariantes do mês corrente
- [x] Exibir foto/avatar, nome, data de aniversário e setor
- [x] Destacar aniversariantes do dia
- [x] Rota backend para buscar aniversariantes por mês

### Alertas de Vencimento de Contratos
- [x] Identificar contratos de experiência próximos do vencimento
- [x] Identificar contratos temporários próximos do vencimento
- [x] Gerar notificação automática 30 e 15 dias antes do vencimento
- [x] Exibir card de alertas no dashboard ou na listagem de colaboradores
- [x] Rota backend para listar contratos próximos do vencimento

### Renomear Submenu
- [x] Renomear "Relatórios" para "Visão Analítica" no submenu Gente & Gestão

## CRM v25 — E-mail Aniversariantes, BI RH e Workflow Contratos

### E-mail Automático de Aniversariantes
- [x] Rota backend para enviar e-mail de parabéns aos aniversariantes do dia
- [x] Template de e-mail personalizável (título, mensagem, assinatura)
- [x] Configuração de template na interface administrativa
- [x] Disparar e-mails automaticamente ao consultar aniversariantes
- [x] Registro de e-mails enviados para evitar duplicatas

### Painel de BI Consolidado do RH
- [x] Página dedicada com gráficos interativos (Recharts)
- [x] Cruzamento de dados: turnover x absenteísmo x custo salarial
- [x] Filtros por período (mês/trimestre/ano)
- [x] Indicadores de metas (KPIs) por ciclo de avaliação
- [x] Gráficos de evolução temporal comparativos
- [x] Adicionar rota e submenu no Gente & Gestão

### Workflow de Renovação de Contrato
- [x] Detectar contratos próximos do vencimento automaticamente
- [x] Criar tarefa no sistema de tarefas para o gestor
- [x] Tarefa com dados do colaborador e opções (renovar/desligar)
- [x] Notificar gestor sobre a tarefa criada
- [x] Evitar criação de tarefas duplicadas para o mesmo contrato

## CRM v26 — Dashboard GEG Dedicado e Melhorias

### Dashboard Gente & Gestão
- [x] Criar página de Dashboard exclusivo para o setor Gente & Gestão
- [x] Incluir KPIs: headcount, turnover, absenteísmo, custo salarial
- [x] Incluir card de aniversariantes do mês
- [x] Incluir card de contratos vencendo
- [x] Incluir distribuição por status dos colaboradores
- [x] Incluir distribuição por setor/cargo
- [x] Adicionar rota e submenu no GEG

### Remover Cards do Dashboard Macro
- [x] Remover card de Aniversariantes do Dashboard principal
- [x] Remover card de Contratos Vencendo do Dashboard principal

### Agendamento Automático de E-mails
- [x] Configurar envio diário automático dos e-mails de aniversário
- [x] Sem necessidade de clique manual (scheduler/cron)

### Exportação do BI em PDF/Excel
- [x] Botão de exportação nos gráficos do painel de BI
- [x] Gerar PDF ou Excel com dados dos gráficos

### Notificações Push do Workflow
- [x] Notificação em tempo real ao gestor quando workflow é criado
- [x] Integrar com sistema de notificações existente

## CRM v27 — Onboarding, Clima e Banco de Horas

### Onboarding Digital de Novos Colaboradores
- [x] Criar tabelas onboarding_templates, onboarding_etapas_template, onboarding_colaborador, onboarding_etapas no schema
- [x] Checklist automatizado com etapas de admissão (documentos, treinamentos, acessos, equipamentos, integração)
- [x] Vincular onboarding ao cadastro do colaborador
- [x] Interface para gerenciar templates de checklist com etapas configuráveis
- [x] Interface para acompanhar progresso do onboarding por colaborador (KPIs, tabs Templates/Ativos)
- [x] Rotas backend CRUD para templates, etapas e onboardings
- [x] Adicionar rota /rh/onboarding e submenu no GEG
- [x] Testes vitest para onboarding (4 testes passando)

### Pesquisa de Clima Organizacional
- [x] Criar tabelas pesquisas_clima, perguntas_clima e respostas_clima no schema
- [x] Módulo para criar pesquisas com 4 tipos de perguntas (escala, sim/não, múltipla escolha, texto livre)
- [x] Respostas anônimas dos colaboradores com indicador visual
- [x] Resultados consolidados com gráficos (BarChart, PieChart) no painel de resultados
- [x] Interface completa: criar, ativar, responder, encerrar e visualizar resultados
- [x] Rotas backend CRUD para pesquisas, perguntas e respostas
- [x] Adicionar rota /rh/pesquisa-clima e submenu no GEG
- [x] Testes vitest para pesquisa de clima (5 testes passando)

### Banco de Horas
- [x] Criar tabela banco_horas no schema
- [x] Controle de horas extras e compensações por colaborador (4 tipos: extra, compensação, ajuste+, ajuste-)
- [x] Cálculo automático de saldo (extras - compensações) por colaborador e geral
- [x] Interface com 3 tabs: Registros, Saldos por Colaborador, Gráfico
- [x] Filtro por colaborador, aprovação de registros, KPIs de saldo
- [x] Rotas backend CRUD para banco de horas com saldo individual e geral
- [x] Adicionar rota /rh/banco-horas e submenu no GEG
- [x] Testes vitest para banco de horas (7 testes passando)

## CRM v28 — Melhorias Banco de Horas e Pesquisa de Clima

### Integração Banco de Horas no Dashboard GEG
- [x] Card resumo com saldo geral de banco de horas no Dashboard GEG
- [x] Alertas de colaboradores com saldo negativo
- [x] Indicadores visuais (cores, ícones) para saldos positivos/negativos

### Exportação PDF da Pesquisa de Clima
- [x] Botão de exportar PDF no painel de resultados
- [x] Relatório consolidado com gráficos (barras, distribuição, resumo geral) para apresentações gerenciais
- [x] Rota backend exportPdf + geração PDF via jsPDF no frontend

## CRM v28.1 — Dashboard GEG em Branco

### Verificação do Dashboard GEG
- [x] Diagnosticado: Dashboard GEG estava funcional (possível estado transitório durante deploy)
- [x] Confirmado KPIs: ativos, inativos, total, turnover, absenteísmo, custo salarial
- [x] Confirmado gráficos: distribuição por status, headcount por setor, turnover mensal
- [x] Confirmado card de Banco de Horas com saldo geral e alertas de saldo negativo
- [x] Confirmado aniversariantes do mês e contratos vencendo
- [x] Confirmado links rápidos para módulos do GEG
- [x] Verificado renderização correta no navegador — todos indicadores visíveis

## CRM v29 — Melhorias no Chat

### Polling mais rápido / WebSocket
- [x] Reduzido intervalo de polling de 5s para 1.5s (mensagens) e 2s (notificações)
- [x] Mensagens aparecem quase instantaneamente sem espera perceptível

### Reações com Emojis
- [x] Criada tabela chat_reactions no schema com índices
- [x] Rotas backend addReaction, removeReaction, reactions (toggle)
- [x] UI de reações: picker com 12 emojis rápidos, contagem, toggle, tooltips com nomes
- [x] 3 testes vitest passando (add, remove, fetch reactions)

### Mensagens Fixadas (Pin)
- [x] Adicionados campos pinned, pinnedBy, pinnedByName, pinnedAt na tabela chat_messages
- [x] Rotas backend pinMessage, unpinMessage, pinnedMessages (admin only)
- [x] Painel de mensagens fixadas no topo do canal com botão de desfixar
- [x] Badge "Fixada" nas mensagens e borda lateral amarela
- [x] 3 testes vitest passando (pin, list, unpin)

### Gestão de Grupos (Exclusão/Inativação)
- [x] Adicionado campo status (active/inactive/deleted) na tabela chat_channels
- [x] Rotas backend deleteChannel (soft delete), restoreChannel, toggleChannel
- [x] 3 abas na sidebar do chat (admin): Ativos, Inativos, Lixeira
- [x] Apenas admin pode excluir/inativar/restaurar grupos
- [x] Botões rápidos de restaurar/excluir ao passar o mouse nos canais
- [x] 4 testes vitest passando (delete, restore, toggle, channels list)

## CRM v30 — Chat: DM, Digitação e Upload

### Mensagens Privadas (DM)
- [x] Criada lógica para canais tipo "dm" entre dois usuários (schema + db helpers)
- [x] Rotas backend startDm e dmChannels para iniciar/buscar DMs
- [x] Aba "DMs" separada na sidebar com lista de conversas privadas
- [x] Dialog para iniciar conversa privada com busca de usuários
- [x] Nome do parceiro exibido (não "DM: User1 & User2")
- [x] 2 testes vitest passando (startDm, dmChannels)

### Indicador de Digitação
- [x] Criada tabela chat_typing_indicators com limpeza automática (expiração 5s)
- [x] Rotas backend startTyping, stopTyping, typingUsers
- [x] UI com animação de 3 pontos e "Fulano está digitando..." no canal ativo
- [x] Suporte a múltiplos digitadores simultâneos
- [x] 2 testes vitest passando (startTyping/stopTyping, typingUsers)

### Upload de Arquivos no Chat
- [x] Adicionados campos fileUrl, fileName, fileType, fileSize na tabela chat_messages
- [x] Rota backend uploadFile com upload via S3 (storagePut) e limite de 10MB
- [x] UI com botão de anexo (Paperclip), preview de imagens inline, card de documentos com download
- [x] Barra de preview do arquivo antes do envio com opção de cancelar
- [x] 2 testes vitest passando (upload file, reject >10MB)

## CRM v31 — Chat: Notificações, Buscas e Alerta Sonoro

### Notificações Push de DM
- [x] Notificações de DM já existiam via sistema de notificações do chat (chat_notifications)
- [x] Badge visual na sidebar indicando DMs não lidas (contador com animação pulse)
- [x] Contador de mensagens não lidas por canal e total geral na aba DMs

### Busca Global de Mensagens
- [x] Rota backend searchGlobal para buscar mensagens em todos os canais simultaneamente
- [x] UI com painel de busca global (ícone Globe) com resultados mostrando canal, autor e data
- [x] Clicar no resultado navega diretamente ao canal correspondente
- [x] 2 testes vitest passando (busca global com resultados, busca sem resultados)

### Busca de Arquivos na Conversa
- [x] Rota backend searchFiles para listar arquivos enviados (por canal ou global)
- [x] Painel de arquivos (ícone FileSearch) com filtro por tipo (imagens, PDF, texto)
- [x] Preview com ícone, nome, autor, tamanho e data + download direto
- [x] 2 testes vitest passando (busca geral, busca filtrada por tipo)

### Busca por Nome de Usuário na Conversa
- [x] Rota backend searchByUser para buscar mensagens de um usuário no canal
- [x] Painel de busca por usuário (ícone UserSearch) com resultados formatados
- [x] 2 testes vitest passando (busca com resultados, busca sem resultados)

### Alerta Sonoro de Nova Mensagem
- [x] Som de notificação via Web Audio API (beep 880Hz, 0.3s) ao receber nova mensagem
- [x] Alerta sonoro também para novas notificações não lidas (DMs e outros canais)
- [x] Toggle de som (ícone Volume2/VolumeX) no header do chat com persistência em localStorage

## CRM v32 — Chat: Threads, Status Online, Edição + Dashboard Comissões Parceiro

### Threads/Respostas em Mensagens
- [x] Adicionado campo replyToId na tabela chat_messages
- [x] Rotas backend sendReply, threadMessages, threadCounts, getMessage
- [x] UI de resposta: botão "Responder" no hover, preview da mensagem original com barra lateral azul
- [x] Painel de thread inline com contagem de respostas e botão "Ver thread"
- [x] 3 testes vitest passando (send reply, fetch thread, thread counts)

### Status Online/Offline dos Usuários
- [x] Criada tabela user_presence com heartbeat e status (online/away/offline)
- [x] Rotas backend heartbeat e onlineUsers com limpeza automática (5min timeout)
- [x] Indicador verde/cinza ao lado do avatar na sidebar (DMs) e no header do chat
- [x] Heartbeat automático a cada 30s via useEffect
- [x] 2 testes vitest passando (heartbeat, online users)

### Edição de Mensagens
- [x] Adicionados campos editedAt e editedContent na tabela chat_messages
- [x] Rota backend editMessage (apenas autor pode editar)
- [x] UI com botão "Editar" no hover (apenas para mensagens próprias)
- [x] Indicador visual "(editada)" na mensagem com tooltip de data
- [x] Modo de edição inline com campo de texto e botões Salvar/Cancelar
- [x] 2 testes vitest passando (edit message, fetch single message)

### Dashboard de Comissões no Perfil do Parceiro
- [x] Rota backend commissionsDashboard com clientes, serviços, aprovações, subparceiros, rateios
- [x] Componente CommissionsDashboardTab na aba "Comissões" do dialog de detalhes do parceiro
- [x] KPIs: clientes vinculados (ativos), serviços autorizados, subparceiros
- [x] Seções: modelo de parceria, serviços e comissões, rateio, clientes vinculados, subparceiros, histórico de aprovações
- [x] 2 testes vitest passando (dashboard com dados, parceiro inexistente)

## CRM v33 — Menções Autocomplete, Export PDF Chat, Dashboard Comissões

### Menções com Autocomplete no Chat
- [x] Detecção de "@" no campo de mensagem já existia (sistema de menções com autocomplete)
- [x] Popup de autocomplete com lista de usuários filtrada por digitação
- [x] Inserção de menção formatada ao selecionar usuário
- [x] Destaque visual das menções (@nome) nas mensagens renderizadas com cor primária
- [x] Notificações automáticas para usuários mencionados

### Exportação do Histórico de Chat em PDF
- [x] Rota backend exportHistory para buscar histórico completo de um canal
- [x] Geração de PDF via jsPDF com mensagens formatadas (autor, data, conteúdo, arquivos)
- [x] Botão "Exportar PDF" (ícone FileDown) no header do canal
- [x] 2 testes vitest passando (export com canal, export canal inexistente)

### Dashboard Consolidado de Comissões
- [x] Página dedicada /dashboard-comissoes com visão geral de comissões por parceiro
- [x] Gráfico AreaChart de evolução mensal de comissões (últimos 12 meses)
- [x] Gráfico BarChart de quantidade de aprovações por mês
- [x] Gráfico PieChart de top 8 parceiros por valor aprovado
- [x] Ranking completo com tabela (posição, nome, tipo, status, modelo, clientes, serviços, aprovadas, pendentes, valor)
- [x] KPIs: valor total aprovado, valor pendente, aprovações/pendentes/rejeitadas, parceiros ativos
- [x] Rota registrada no App.tsx e link adicionado ao sidebar
- [x] 3 testes vitest passando (dados consolidados, ranking, evolução mensal)

## CRM v34 — Filtros Avançados e Exportação no Dashboard de Comissões

### Filtros Avançados no Dashboard de Comissões
- [x] Filtro por período (data início e data fim) com inputs date
- [x] Filtro por tipo de parceiro (PF/PJ) com Select dropdown
- [x] Filtro por modelo de parceria com Select dinâmico (lista de modelos do backend)
- [x] Rota backend atualizada para aceitar parâmetros: dataInicio, dataFim, tipoParceiro, modeloParceriaId
- [x] UI de filtros com painel colapsável, botões Aplicar/Limpar, badges de filtros ativos
- [x] 6 testes vitest passando (modelos list, filtro PF, filtro PJ, date range, modeloParceriaId, filtros combinados)

### Exportação do Ranking em Excel/PDF
- [x] Botão "Excel" exporta CSV compatível com Excel (UTF-8 BOM, separador ;)
- [x] Botão "PDF" gera relatório via jsPDF com KPIs, ranking e evolução mensal
- [x] Relatório inclui filtros aplicados, indicadores gerais, ranking completo e evolução mensal
- [x] Paginação automática no PDF para rankings longos

## CRM v35 — Comparativo de Períodos e Metas de Comissões

### Comparativo de Períodos no Dashboard
- [x] Seletor de dois períodos (Período A e Período B) com date pickers
- [x] Rota backend para buscar dados de comissões para dois períodos distintos
- [x] Gráfico comparativo lado a lado (barras agrupadas) mostrando evolução dos dois períodos
- [x] KPIs comparativos com variação percentual (↑/↓) entre períodos
- [x] Tabela de ranking comparativo com colunas de ambos os períodos

### Meta de Comissões por Parceiro
- [x] Criar tabela metas_comissoes no schema (parceiro, período, valor meta, tipo: mensal/trimestral)
- [x] Rotas backend CRUD para metas de comissões
- [x] Rota backend para calcular progresso (realizado vs meta)
- [x] UI para definir metas por parceiro (dialog de cadastro)
- [x] Barra de progresso de atingimento no dashboard e no ranking
- [x] Indicadores visuais: verde (≥100%), amarelo (50-99%), vermelho (<50%)

## GEG v36 — Gente e Gestão: Requisitos Completos

### Bloco A: Campos Adicionais do Colaborador
- [x] Título de eleitor: zona e sessão (campos separados)
- [x] CTPS: UF de emissão
- [x] Dependentes: campos "Dependente IR?" e "Dependente Plano de Saúde?"
- [x] Grau de instrução (enum) + campo descrição formação acadêmica/pós/cursos
- [x] Contato de emergência (nome, telefone, parentesco)
- [x] Campo: Colaborador paga pensão alimentícia? (boolean + valor)
- [x] Campo: Colaborador tem contribuição assistencial? (boolean + valor)

### Bloco B: Férias — Melhorias
- [x] Validação: proibido iniciar férias 2 dias antes de feriado ou final de semana
- [x] Edição e exclusão de períodos programados
- [x] Fluxo de aprovação: gestor e diretoria (campos aprovadorGestorId, aprovadorDiretoriaId)

### Bloco C: Benefícios — VT, Academia, Comissão
- [x] Vale Transporte: cálculo automático (dias úteis × 2 passagens × valor unitário)
- [x] Vale Transporte: valor unitário por cidade (SP e Barueri)
- [x] Vale Transporte: valor total a pagar por colaborador
- [x] Academia: cadastro (qual academia, plano, valor, desconto folha, data entrada, fidelidade)
- [x] Comissão RH: tipo (Evox Monitor, DPT, Crédito), cálculo, total a pagar

### Bloco D: Licenças Expandidas
- [x] Day Off aniversário: listar todas datas, campo alteração, motivo, aprovação
- [x] Doação de sangue: data doação, prazo folga, data folga, aprovação (gestor/RH/diretoria), comprovante
- [x] Licença Maternidade (120 dias), Paternidade (5 dias), Casamento (3 dias), Óbito (2 dias)
- [x] Licença Médica (15 dias empresa + INSS), Militar, Vestibular, Mesário, Acompanhamento médico
- [x] Expandir enum de tipos na tabela atestados_licencas

### Bloco E: Reajustes Salariais
- [x] Reajuste 10% após 2 anos de casa: detecção automática, cálculo, registro
- [x] Reajuste sindical anual: campos para percentuais por colaborador, cálculo automático
- [x] Tabela de histórico de reajustes

### Bloco F: Relatório de Apontamentos da Folha
- [x] Consolidar VT, academia, comissões, reajustes em relatório único
- [ ] Exportar para contabilidade (Excel/PDF) (frontend)
- [x] Filtros por mês/ano e colaborador

### Bloco G: Cargos e Salários — Melhorias
- [x] Níveis de cargo por setor
- [x] Requisitos para mudança de nível vinculados a grau de instrução
- [x] Pré-requisitos de formação para promoção

### Bloco H: Ações e Eventos
- [x] Ação FIT Mensal: campos (o quê, data, horário, onde, arte/convite) — adicionados campos horário/local/arteConviteUrl na tabela acoes_beneficios
- [x] Ação Solidária Mensal: campos (descrição, data, horário, onde, arte/convite) — mesmos campos

### Frontend — Novas Páginas GEG
- [x] ValeTransporteGEG.tsx — CRUD com cálculo automático
- [x] AcademiaGEG.tsx — CRUD com fidelidade e desconto
- [x] ComissaoRhGEG.tsx — CRUD por tipo
- [x] DayOffGEG.tsx — CRUD com aprovação
- [x] DoacaoSangueGEG.tsx — CRUD com comprovante e aprovação
- [x] ReajustesGEG.tsx — CRUD + detecção 2 anos + sindical
- [x] ApontamentosFolhaGEG.tsx — Geração e listagem
- [x] NiveisCargoGEG.tsx — CRUD com requisitos
- [x] Submenus GEG atualizados no sidebar
- [x] Ícones de submenu adicionados
- [x] 25 testes vitest para rotas GEG v36
- [ ] Exportar apontamentos para contabilidade (Excel/PDF) — futuro

## GEG v37 — Alertas de Reajuste + Dashboard GEG Consolidado

### Alertas Automáticos de Reajuste (2 anos)
- [x] Verificação automática diária de colaboradores que completam 2 anos
- [x] Notificação ao owner/RH quando colaborador atinge 2 anos de casa
- [x] Incluir dados do colaborador (nome, cargo, data admissão, salário atual, novo salário estimado)
- [x] Integrar com scheduler existente (birthday emails)

### Dashboard GEG Consolidado
- [x] Rota backend para consolidar indicadores GEG do mês
- [x] KPI: Total VT do mês (valor total a pagar)
- [x] KPI: Total Academia do mês (valor total desconto)
- [x] KPI: Reajustes pendentes (colaboradores elegíveis 2 anos)
- [x] KPI: Day Offs do mês (pendentes/aprovados)
- [x] KPI: Total colaboradores ativos
- [x] KPI: Comissões RH do mês
- [x] Gráfico de evolução mensal de custos (VT + Academia + Comissões)
- [x] Lista de próximos aniversários (Day Off)
- [x] Lista de reajustes pendentes com ação rápida
- [x] Página frontend DashboardGEG.tsx integrada ao dashboard existente
- [x] 6 testes vitest para rota dashboardGEG

## GEG v38 — Reestruturação de Submenus e Melhorias

### Campos do Colaborador
- [x] Dois campos de período de experiência (experiência 1 e experiência 2) para cálculo de rescisão
- [x] Campo comissão em remuneração (sim/não apenas)

### Férias — CLT/CCT 2026
- [x] Pesquisar mudanças CLT e CCT 2026 para férias
- [x] Atualizar validações de férias conforme novas regras (aviso 30 dias, feriados nacionais 2026, pagamento 2 dias antes)

### Reestruturação de Submenus GEG
- [x] Criar submenu "Gestão RH" contendo: Colaboradores, Onboarding, Comissões, Banco de Horas, Atestados e Licenças, Férias e Folgas, Reajustes Salariais
- [x] Separar "Ações e Benefícios" em dois: "Ações Evox" e "Benefícios"
- [x] "Ações Evox" com tipos: Ação Fit, Ação Solidária, Ação de Engajamento, Doação de sangue (excluir benefício e campanha)
- [x] "Benefícios" contendo: Vale Transporte, Academia, Day Off, opção de incluir novo
- [x] Criar submenu "Carreira e Desenvolvimento" contendo: Carreira, Metas, Avaliação 360, Pesquisa de Clima, opção de incluir novo
- [x] Renomear "Cargos e Salários" para "Custo Salarial"
- [x] Renomear "Níveis de Cargo" para "Cargos e Salários"
- [x] Renomear "Relatórios RH" para "Visão Analítica"
- [x] 8 testes vitest para GEG v38

## GEG v39 — Sidebar Limpo com Telas Hub

### Reestruturação do Sidebar GEG
- [x] Sidebar deve mostrar apenas itens de nível superior: Nova Tarefa, Gestão RH, Ações Evox, Benefícios, Carreira e Desenvolvimento, Administração
- [x] Ao clicar em cada item, navegar para uma tela hub intermediária
- [x] Tela hub lista os itens que integram o submenu com cards clicáveis
- [x] Ao clicar no card, navegar para a tela específica do item
- [x] Criar página hub GestaoRhHub.tsx
- [x] Criar página hub AcoesEvoxHub.tsx
- [x] Criar página hub BeneficiosHub.tsx
- [x] Criar página hub CarreiraDesenvolvimentoHub.tsx + AdministracaoHub.tsx
- [x] Atualizar AppSidebar para mostrar apenas os itens de nível superior
- [x] Registrar rotas hub no App.tsx
- [x] Atualizar setor_config no banco para 6 itens hub
- [x] Remover link Relatórios automático para GEG
- [x] 346 testes passando

## GEG v40 — Exportação, Formulários Dinâmicos e Rescisão

### Exportação de Apontamentos da Folha (Excel/PDF)
- [x] Backend: rota para gerar Excel consolidado com VT, academia, comissões e reajustes
- [x] Backend: rota para gerar PDF consolidado para envio à contabilidade
- [x] Frontend: botões de exportação Excel e PDF na página de Apontamentos da Folha
- [x] Relatório deve incluir mês/ano de referência, totais por colaborador e totais gerais

### Opção "Incluir Novo" nos Hubs Benefícios e Carreira
- [x] Criar tabela beneficios_custom para benefícios personalizados
- [x] Criar tabela programas_carreira para programas de carreira personalizados
- [x] Backend: CRUD para benefícios e programas customizados
- [x] Frontend: formulário dinâmico ao clicar "Incluir Novo" em Benefícios
- [x] Frontend: formulário dinâmico ao clicar "Incluir Novo" em Carreira
- [x] Novos itens aparecem como cards nos respectivos hubs

### Relatório de Rescisão
- [x] Criar tabela rescisoes para armazenar cálculos de rescisão
- [x] Backend: cálculo automático de verbas rescisórias por tipo de desligamento
- [x] Tipos: sem justa causa, justa causa, pedido de demissão, término de experiência (1º/2º período), acordo mútuo
- [x] Cálculo inclui: saldo de salário, aviso prévio, 13º proporcional, férias proporcionais + 1/3, FGTS + multa 40%
- [x] Frontend: página de rescisão com seleção de colaborador e tipo de desligamento
- [ ] Geração de PDF do termo de rescisão (próxima iteração)
- [x] Testes vitest para as 3 funcionalidades (356 testes passando)

## Bug Fix v40.1 — Visão Analítica 404
- [x] Corrigir rota do submenu Visão Analítica (antigo Relatórios RH) que retorna 404 — rota era /rh/relatorios-rh, corrigida para /rh/relatorios

## GEG v41 — Programar Folgas e Calendário Day Off

### Programar Folgas (antigo Solicitação de Folga/Férias)
- [x] Renomear botão "Solicitação de Folga" para "Programar Folgas"
- [x] Renomear título do dialog de "Solicitação de Folga/Férias" para "Programar Folgas"
- [x] Substituir campo Tipo por menu suspenso de Motivo: Day Off, Doação de Sangue, Banco de Horas, Outros
- [x] Ao selecionar "Outros", exibir campo de texto para digitar o motivo
- [x] Adicionar campo de Observações no formulário
- [x] Atualizar backend para suportar novo campo motivo e observações (motivo concatenado no campo existente)

### Calendário de Aniversários no Day Off
- [x] Adicionar calendário anual na página Day Off com datas de aniversário dos colaboradores
- [x] Buscar datas de nascimento do cadastro de colaboradores
- [x] Exibir nomes dos aniversariantes em cada data do calendário (tooltip no hover)
- [x] 356 testes passando

## GEG v42 — Day Off Avançado, Histórico de Folgas e Notificações

### Calendário Day Off — Melhorias
- [x] Filtro por visualização: Dia (hoje), Mês ou Ano no calendário
- [x] Lista de aniversariantes do mês com nome, data e status
- [x] Ao clicar no aniversariante, opção de agendar Day Off diretamente
- [x] Aniversários recorrentes todos os anos (até status desligado)
- [x] Status do colaborador refletido no calendário (badges visuais)

### Histórico de Folgas no Perfil do Colaborador
- [x] Nova seção no perfil mostrando todas as folgas (Day Off, Doação de Sangue, etc.)
- [x] Exibir status e datas de cada folga

### Notificação Automática de Aniversariantes
- [x] Alerta ao gestor 7 dias antes do aniversário
- [x] Alerta ao gestor 3 dias antes do aniversário
- [x] Alerta ao gestor no dia do aniversário (já existia, mantido)
- [x] 356 testes passando

## GEG v43 — Correções de Rota, Projeção Financeira e Simulador de Férias

### Bug Fixes
- [x] Corrigir rota do hub Carreira (estava abrindo Cargos/Salários em vez de Carreira)
- [x] Mover item Comissões de Gestão RH para Administração

### Integração Day Off no Calendário de Férias
- [x] Exibir Day Offs agendados na aba Cronograma da página de Férias
- [x] Visão unificada de ausências (férias + day offs)

### Projeção Financeira da Folha (Administração)
- [x] Criar painel de projeção financeira mensal e anual
- [x] Incluir dados de colaboradores, férias, rescisões, benefícios
- [x] Atualizar automaticamente ao agendar férias ou inserir rescisão
- [x] Servir como indicador para o setor financeiro

### Simulador Financeiro de Férias
- [x] Simulador de valor a pagar de férias por colaborador
- [x] Suporte a férias coletivas (múltiplos colaboradores)
- [x] Cálculo baseado em salário, 1/3 constitucional, abono pecuniário, INSS e IRRF
- [x] Botão Simulador adicionado na página de Férias
- [x] 356 testes passando

## GEG v44 — Projeção Financeira Avançada

### Bug Fixes
- [x] Corrigir badge "Atual" que aparece em 2027 — só marcar no ano corrente real
- [x] Atualizar descrição na capa de Projeção Financeira em Administração para "Projeção mensal e anual de custos com pessoal"

### Memória de Cálculo
- [x] Ao clicar em qualquer valor da projeção, exibir detalhamento (ex: tabela de colaboradores e salários)
- [x] Memória de cálculo para Salários Base (lista de colaboradores)
- [x] Memória de cálculo para Encargos (INSS + FGTS detalhado)
- [x] Memória de cálculo para Benefícios (VT, academia, etc.)
- [x] Memória de cálculo para Provisões (13º e férias)
- [x] Memória de cálculo para Férias Programadas (lista de férias)
- [x] Memória de cálculo para Rescisões (lista de rescisões)

### Férias e Rescisões Expandidas
- [x] Alterar indicativo de férias e rescisões para últimos e próximos 6 meses (em vez de 3)

### Projeção 5 Anos
- [x] Seletor de ano dinâmico: ano atual até ano atual + 4
- [x] Acréscimo automático ao virar o ano (ex: 2026→2030, 2027→2031)
- [x] 356 testes passando

## GEG v45 — Férias Reestruturado

### Visão Mensal/Anual
- [x] Calendário mensal e anual com férias e folgas programadas
- [x] Ano atual e ano seguinte, auto-incremento na virada de ano
- [x] Ao clicar no mês ou dia, exibir lista de colaboradores com férias/folgas naquele período

### Alertas de Período Concessivo
- [x] Alertas de períodos concessivos a vencer nos próximos 6 meses
- [x] Destaque visual para colaboradores com concessivo próximo do vencimento

### Lista Enxuta de Colaboradores
- [x] Visão inicial compacta: nome, cargo, setor, período concessivo, tempo de casa
- [x] Ao clicar no colaborador, expandir com todas as informações de férias e folgas
- [x] Incluir histórico completo de férias e folgas no detalhe expandido

### Alerta de Ruptura de Setor
- [x] Ao programar férias/folgas de mais de um colaborador do mesmo setor, gerar alerta
- [x] Alerta também em férias coletivas e folgas
- [x] Confirmação para seguir com a programação mesmo com sobreposição

- [x] 28 novos testes vitest (ferias-v45.test.ts)
- [x] 384 testes passando no total

## GEG v46 — Painel do Colaborador

### Lista de Colaboradores
- [x] Trocar visualização de cards para lista em ordem alfabética
- [x] Manter na lista as mesmas informações do card (nome, cargo, status, regime, unidade, admissão)

### Painel do Colaborador (expandido ao clicar)
- [x] Dados pessoais: nome, cargo, setor, admissão, aniversário, status
- [x] Histórico salarial: valores mês a mês, ano a ano, custo total e por período
- [x] Histórico de férias completo
- [x] Histórico de folgas e day offs
- [x] Histórico de faltas
- [x] Histórico de atestados
- [x] Histórico de licenças
- [x] Plano de carreira (se está ou não)
- [x] Formação acadêmica
- [x] Outras habilidades e experiências
- [x] Unidade de trabalho
- [x] Status atual e histórico de mudanças de status
- [x] Mudanças de cargo e função
- [x] Todas as informações em uma única tela
- [x] 54 novos testes vitest (colaboradores-v46.test.ts)
- [x] 438 testes passando no total

## GEG v47 — Dashboard direto, gráfico fix, melhorias Colaboradores

### Navegação
- [x] Menu Gente & Gestão abre direto no Dashboard do setor ao clicar

### Dashboard GEG — Gráfico fix
- [x] Corrigir labels sobrepostas/ocultas no gráfico de Distribuição por Status

### Colaboradores — Melhorias
- [x] Adicionar paginação na lista de colaboradores
- [x] Implementar exportação do Painel individual do colaborador em PDF (botão Imprimir/PDF)
- [x] Adicionar gráfico de evolução salarial no Histórico Salarial
- [x] 21 novos testes vitest (colaboradores-v47.test.ts)
- [x] 459 testes passando no total

## GEG v48 — Submenus ocultos no sidebar + campo comissionado

### Sidebar — Submenus GEG
- [x] Adicionar "Aniversariantes" como submenu dentro de Gestão RH
- [x] Adicionar "Contratos Vencendo" (workflow de renovação) como submenu dentro de Gestão RH
- [x] Adicionar "BI — Indicadores de RH" como submenu dentro de Administração

### Formulário Novo Colaborador
- [x] Trocar campo "Comissões (valor)" por "Cargo Comissionado? Sim/Não"
- [x] Renomear seção/campo de comissões para "Comissões e Prêmios" (tratado em outro módulo)

### Dashboard GEG — Correções visuais
- [x] Cores da legenda devem seguir as cores do gráfico de Distribuição por Status
- [x] Headcount por Setor: adicionar visão por setor E por local de trabalho (toggle/tabs)

## GEG v49 — Equipamentos, Senhas e Contatos Corporativos

### Correção Painel do Colaborador
- [x] Corrigir sobreposição do campo email sobre telefone em Dados Pessoais
- [x] Separar campos: email pessoal, email corporativo, telefone pessoal, telefone corporativo

### Gestão de Equipamentos e Comunicações (Gestão RH)
- [x] Criar tabela equipamentosColaborador no schema
- [x] Criar router CRUD para equipamentos
- [x] Criar página EquipamentosGEG com gestão de celulares, notebooks, emails e telefones corporativos
- [x] Adicionar ao hub Gestão RH

### Gestão de Senhas e Autorizações (Gestão RH)
- [x] Criar tabela senhasAutorizacoes no schema
- [x] Criar router CRUD para senhas e autorizações
- [x] Criar página SenhasAutorizacoesGEG com gestão de senhas, chaves, autorizações de veículos
- [x] Adicionar ao hub Gestão RH
- [x] 29 novos testes vitest (v49-equipamentos-senhas.test.ts)
- [x] 488 testes passando no total

## GEG v50 — UX Global, Painel Ativos, Devolução Equipamentos

### Descrições no hub Gestão RH
- [ ] Adicionar descrição em todos os campos do hub Gestão RH (Aniversariantes, Contratos Vencendo, Equipamentos, Senhas)

### Navegação — Seta de Voltar
- [ ] Garantir seta de voltar em todas as páginas GEG (Equipamentos, Senhas, etc.)

### Alerta de saída ao editar
- [ ] Criar hook useUnsavedChanges para alertar ao sair de formulários em edição
- [ ] Aplicar em todas as páginas com formulários de edição/inserção

### Limpar Filtros
- [ ] Adicionar botão "Limpar Filtros" em todas as páginas com filtros

### Painel do Colaborador — Equipamentos e Autorizações
- [ ] Adicionar aba "Ativos & Acessos" no painel do colaborador com equipamentos, senhas e autorizações

### Controle de Devolução de Equipamentos
- [ ] Criar fluxo de devolução com termo de responsabilidade ao desligar colaborador
- [ ] Gerar termo de responsabilidade para assinatura digital

### Relatório Consolidado de Ativos
- [ ] Criar página de relatório consolidado de ativos por colaborador (equipamentos + acessos + autorizações)
- [ ] Exportar relatório em PDF para auditorias

## GEG v51 — Reestruturar Equipamentos & Comunicações em 3 Abas

### Separar em 3 abas isoladas
- [x] Aba Equipamentos: gestão de notebooks, celulares, etc. com KPIs próprios
- [x] Aba E-mails Corporativos: criação com domínio @grupoevox.com.br, sugestão automática de nomes e verificação de duplicidade
- [x] Aba Senhas & Acessos: gestão de senhas, chaves, autorizações separada dos equipamentos
- [x] KPIs independentes por aba
- [x] Cada aba com dados isolados para gestão e auditoria

## v52 — Correções Formulário Novo Colaborador + Equipamentos 3 abas
- [x] Cargo Comissionado: trocar checkbox para radio Sim/Não exclusivo
- [x] Dados Profissionais: corrigir layout campos que se sobrepõem com textos grandes
- [x] Período de Experiência: opção 1 ou 2 períodos, dias editáveis (sugestão 90 ou 2x45), cálculo automático data fim a partir da admissão
- [x] Período de Experiência: refletir no workflow de renovação de contratos
- [x] Finalizar reestruturação Equipamentos com 3 abas separadas (Equipamentos, E-mails Corporativos, Senhas & Acessos)

## v53 — Integração Colaboradores ↔ Módulos + Equipamentos Export + Histórico Senhas + Notificações

### Auto-preenchimento Cargo/Setor/Salário no formulário de colaborador
- [x] Ao selecionar cargo no formulário, puxar automaticamente setor e salário base de Cargos e Salários
- [x] Ao selecionar setor, filtrar cargos disponíveis daquele setor
- [x] Salário base preenchido automaticamente a partir do cadastro de Cargos e Salários

### Reflexo dos dados de colaboradores nos módulos correlatos
- [x] Cargos e Salários: refletir quantidade de colaboradores por cargo/setor (organograma hierárquico automático)
- [ ] Benefícios: refletir dados de colaboradores ativos para cálculo de benefícios
- [ ] Comissões: vincular colaboradores comissionados automaticamente
- [ ] Projeção Financeira: usar dados reais de colaboradores para projeção da folha
- [ ] Demais módulos: garantir que dados de colaboradores reflitam onde necessário

### Exportação Excel/PDF por aba em Equipamentos & Comunicações
- [x] Exportação Excel na aba Equipamentos
- [x] Exportação Excel na aba E-mails Corporativos
- [x] Exportação Excel na aba Senhas & Acessos
- [x] Exportação PDF em cada aba

### Histórico de alterações em Senhas & Acessos
- [x] Tabela de log de alterações (criação, revogação, transferência)
- [x] Exibir histórico na interface com timeline

### Notificação automática de vencimento de período de experiência
- [x] Detectar colaboradores com período de experiência próximo do fim
- [x] Gerar notificação/alerta para o RH
- [x] Campo de senha real mascarada em Nova Senha/Acesso com botão ver/ocultar para gestor
- [x] Organograma hierárquico automático em Cargos e Salários a partir dos colaboradores cadastrados por setor
- [x] Reestruturar Férias & Folgas: painel informativo com KPIs, alertas de férias vencidas/próximas, filtro por período
- [x] Condensar Férias & Folgas em aba única com informações gerais, colaboradores e solicitações (sem visão calendário)

## v54 — Correções Relatórios, PDFs Reais, Excel, Integração Módulos, Paginação, Dados Teste

### Relatórios BI vs Visão Analítica
- [ ] Corrigir exportação BI para trazer dados específicos (turnover, absenteísmo, custo, metas)
- [ ] Corrigir exportação Visão Analítica para trazer dados específicos (distribuição, tendências, comparativos)
- [ ] Garantir que cada relatório contenha informações distintas do seu campo

### PDFs Reais
- [ ] Converter todas as exportações PDF de HTML para formato PDF real (jsPDF)
- [ ] Garantir formatação profissional nos PDFs gerados

### Exportação Excel
- [ ] Adicionar exportação Excel em todos os campos com dados em lista que ainda não possuem

### Integração Módulos com Colaboradores
- [ ] Benefícios: vincular dados de colaboradores ativos para cálculos em tempo real
- [ ] Comissões: vincular colaboradores comissionados automaticamente
- [ ] Projeção Financeira: usar dados reais de salários e benefícios para projeção da folha

### Paginação Férias
- [ ] Adicionar paginação na lista de colaboradores em Férias & Folgas

### Dados de Teste
- [ ] Reduzir para 20 registros de teste em GEG refletindo em todos os campos
- [ ] Dashboard Headcount: mostrar apenas por setor (remover opção Por Local)
- [ ] BI Custos: corrigir agrupamento por setor (estava por local de trabalho)
- [ ] BI Custos: adicionar duas visões separadas na mesma tela (Por Setor e Por Local)
- [ ] Formação Acadêmica: autocomplete com cursos superiores do Brasil
- [ ] Formação Acadêmica: possibilidade de inserir múltiplas formações superiores
- [ ] Formação Acadêmica: possibilidade de inserir formações de nível técnico (uma ou mais)
- [ ] Formação Acadêmica: possibilidade de inserir experiências/habilidades adicionais sem certificação
- [ ] Corrigir sobreposição do texto "Preencha a data de admissão" no campo Início do período de experiência

## v55 — Módulo CCT (Convenção Coletiva de Trabalho)
- [ ] Schema: tabela ccts com campos para vigência, sindicato, regras extraídas, arquivo PDF, status
- [ ] Schema: tabela cct_regras para regras individuais extraídas da CCT
- [ ] Upload de PDF da CCT com armazenamento S3
- [ ] Leitura e interpretação automática da CCT via LLM
- [ ] Extração de regras (piso salarial, reajuste, benefícios, jornada, etc.)
- [ ] Histórico de CCTs com download dos anexos
- [ ] Alerta de vencimento da CCT (quando expirada ou próxima de expirar)
- [ ] Aplicação das regras CCT junto com CLT dentro de GEG
- [ ] Página CCT no hub de GEG com gestão completa

## v55b — Workflow de Férias com Aprovação + Validações CLT/CCT 2026
- [x] Workflow de aprovação: botões "Salvar Rascunho" e "Salvar e Enviar para Aprovação"
- [x] Férias só tem validade para gozo se salva, enviada e aprovada
- [x] Rascunho salvo sem envio não tem validade para gozo
- [x] Quem criou a programação pode editar ou excluir (mesmo após envio)
- [x] Validação automática: proibido iniciar férias 2 dias antes de feriado ou final de semana (CLT art. 134 §3º)
- [x] Alerta automático de conflito: verificar se outro colaborador do mesmo setor tem férias no mesmo período
- [x] Aplicar regras CCT 2026 para férias (cláusula 14 - cálculo comissionista, data-base retroativa)
- [x] Feriados nacionais 2026 cadastrados para validação automática
- [x] Painel de aprovação para gestor/diretoria com aprovar/rejeitar

## v55c — Melhorias E-mails Corporativos e Senhas & Acessos
- [x] E-mails: Tipos simplificados para "Principal" e "Secundário" (remover Alias, Compartilhado, Grupo)
- [x] E-mails: Campo de uso "Individual" ou "Compartilhado"
- [x] E-mails: Se compartilhado, opção de vincular a outros colaboradores
- [x] Senhas: Campo de uso "Individual", "Comum" ou "Compartilhado"
- [x] Senhas: Se "Comum", entende-se que é acesso/uso de todos
- [x] Senhas: Se "Compartilhado", opção de vincular a colaboradores específicos
- [x] Atualizar schema do banco para novos campos
- [x] Atualizar backend (routers) para novos campos
- [x] Atualizar frontend (formulários e listagem) para novos campos

## v55d — Renomear tela Cargos e Salários
- [x] Renomear título de "Cargos e Salários" para "Custo Salarial"
- [x] Alterar subtítulo para "Visão analítica da estrutura de custo com pessoal"

## v56 — Controle de Entrega/Devolução de Equipamentos + Relatório de Ativos
- [x] Schema: tabela termos_responsabilidade (equipamentoId, colaboradorId, tipo entrega/devolução, dataEvento, assinaturaDigital, observações, status)
- [x] Backend: CRUD de termos de responsabilidade com upload de assinatura digital
- [x] Frontend: Dialog de entrega com termo de responsabilidade e campo de assinatura digital (canvas)
- [x] Frontend: Dialog de devolução com termo e assinatura digital
- [x] Vincular entrega/devolução ao fluxo de admissão e desligamento
- [x] Gerar PDF do termo de responsabilidade com assinatura
- [x] Relatório consolidado de ativos por colaborador (equipamentos + e-mails + senhas/acessos)
- [x] Exportar relatório de ativos em formato adequado para auditoria
- [x] Histórico de entregas/devoluções por equipamento

## v57 — Correções Formulário Novo Colaborador
- [x] Bug: campos perdem foco ao digitar (só permite 1 caractere por vez)
- [x] Bug: menus suspensos sobrepõem campos laterais quando texto é maior que o campo
- [x] Bug: campos pequenos demais para informação desejada (ex: nome em dependentes)
- [x] Redimensionar campos para tamanho compatível com informação; se necessário criar linha abaixo
- [x] Formação acadêmica: menu suspenso com autocomplete de cursos superiores brasileiros
- [x] Formação acadêmica: possibilidade de inserir mais de uma formação superior
- [x] Formação acadêmica: possibilidade de inserir formações de nível técnico (uma ou mais)
- [x] Formação acadêmica: possibilidade de inserir demais experiências/habilidades sem certificação
- [x] Bug: mensagem "preencha a data de admissão" sobrepondo campo de início em período de experiência

## v58 — Formação Acadêmica Layout + Módulo CCT + Validação + Importação
- [x] Formação Acadêmica: empilhar campos e aumentar largura para melhor preenchimento
- [x] Formação Acadêmica: corrigir campo "Ano" que não aceita digitação
- [x] Módulo CCT: schema e tabela no banco para CCTs
- [x] Módulo CCT: backend com upload PDF, leitura LLM, CRUD e histórico
- [x] Módulo CCT: frontend com página completa em Gestão RH
- [x] Módulo CCT: alerta de vencimento da CCT
- [x] Validação de campos obrigatórios: indicadores visuais (asterisco) nos campos obrigatórios
- [x] Validação de campos obrigatórios: validação antes de salvar colaborador
- [x] Importação em lote: upload de planilha Excel/CSV
- [x] Importação em lote: mapeamento de colunas e preview antes de importar
- [x] Importação em lote: processamento e inserção dos dados

## v59 — Ajustes Formação Acadêmica
- [x] Remover campo "Formação / Curso (principal)" do formulário de novo colaborador
- [x] Corrigir dropdown de Curso em Formações Superiores: rolagem A-Z com suporte a scroll do mouse

## v60 — CCT Alertas, Exportação, Badges, Validação Duplicidade
- [x] Notificações automáticas de CCT: alertas por e-mail quando CCT vencida (5, 15 e 30 dias)
- [x] Exportação de relatório de colaboradores: gerar PDF/Excel com filtros aplicados da listagem
- [x] Busca por letra inicial no dropdown de cursos: índice alfabético lateral (A, B, C...)
- [x] Indicador de formação na listagem de colaboradores: badge/ícone do grau de instrução na tabela
- [x] Validação de duplicidade de formações: alertar ao adicionar mesmo curso duas vezes

## v61 — CCT Descrição, Voltar Administração, Cargos e Salários Unificado
- [x] Atualizar descrição da CCT no hub Administração: "Gestão de convenções coletivas com análise automática por IA"
- [x] Corrigir botão Voltar nos submenus de Administração para retornar ao menu anterior (não ao Dashboard)
- [x] Unificar Custo Salarial + Cargos e Níveis em "Cargos e Salários" com descrição atualizada
- [x] Cadastro base de cargos, salários, funções e níveis por setor
- [x] Organograma por setor
- [x] Análise salarial atual por setor com custo salarial baseado em colaboradores
- [x] Memória de cálculo ao clicar em valores com exportação PDF e Excel

## v62 — Reestruturação Cargos e Salários
- [x] Remover aba "Níveis e Funções" da página Cargos e Salários
- [x] Aba Cadastro: CRUD completo de cargos com nome, função, setor (dropdown), grau instrução mínimo, salário base, comissionado (sim/não), cargo de confiança (sim/não), requisitos de formação
- [x] Criar/atualizar tabela cargos_salarios no banco de dados
- [x] Backend: rotas CRUD para cargos_salarios
- [x] Integrar auto-fill de cargo/salário no cadastro de colaboradores

## v63 — Correções Cargos e Salários + Input Monetário Global
- [x] Corrigir layout dos campos Comissionado e Cargo de Confiança (saindo do quadrante)
- [x] Requisito de Formação: dropdown com níveis de formação (incluindo Sem Formação)
- [x] Remover campos Salário Mínimo e Máximo, manter apenas Salário Base
- [x] Criar componente CurrencyInput global com auto-formatação BRL (R$ 1.234,56)
- [x] Aplicar CurrencyInput em todos os campos monetários do sistema

## v64 — Simulador de Reajuste Salarial + Relatório de Cargos Vagos
- [x] Nova aba "Simulador de Reajuste" em Cargos e Salários
- [x] Simulação por percentual de reajuste (global, por setor ou por cargo)
- [x] Cálculo de impacto financeiro: custo atual vs custo projetado
- [x] Exportação do resultado da simulação para PDF e Excel
- [x] Nova aba "Cargos Vagos" em Cargos e Salários
- [x] Comparação: cargos cadastrados vs colaboradores ativos por setor
- [x] Indicadores: total de vagas, vagas preenchidas, vagas em aberto
- [x] Detecção de cargos sem registro na base (colaboradores com cargos não cadastrados)
- [x] Rota backend para exportação PDF do simulador de reajuste
- [x] Correção de colunas PDF (key-based) para compatibilidade com pdfGenerator

## v65 — Correção de inconsistência salarial no Simulador e demais campos
- [x] Investigar e corrigir bug de salário multiplicado por 100 no Simulador de Reajuste (ex: R$ 8.500 aparece como R$ 850.000)
- [x] Garantir que todos os campos do sistema leiam o salário exato do cadastro pai (colaboradores)
- [x] Verificar parsing de salário (formatação BRL vs centavos) em toda a cadeia de dados
- [x] Testar consistência de dados em todas as abas de Cargos e Salários
- [x] Corrigir parseSalario em CargosSalarios.tsx para distinguir decimal DB ("8500.00") de BRL ("R$ 8.500,00")
- [x] Corrigir parseSal no servidor (index.ts) para memória de cálculo PDF
- [x] Adicionar testes vitest para parsing de decimais do banco (v65 fix)

## v66 — Correção de parsing salarial em todas as páginas + Simulador com encargos CLT
- [x] Verificar parseFloat(salarioBase) em ProjecaoFinanceiraGEG.tsx — OK (parseFloat lida corretamente com decimais do DB)
- [x] Verificar parseFloat(salarioBase) em SimuladorFeriasGEG.tsx — OK
- [x] Verificar parseFloat(salarioBase) em ReajustesGEG.tsx — OK
- [x] Verificar Number(salarioBase) em RelatoriosRH.tsx — OK (Number() lida corretamente com decimais do DB)
- [x] Verificar ColaboradoresGEG.tsx — OK (usa parseFloat corretamente)
- [x] Adicionar modo "Por Colaborador" no Simulador de Reajuste
- [x] Calcular encargos trabalhistas CLT no custo projetado (INSS patronal, FGTS, 13º, férias+1/3, etc.)
- [x] Considerar dados da CCT no cálculo de encargos quando disponíveis
- [x] Atualizar testes vitest para cobrir novos cenários (28 testes passando)
- [x] KPIs com breakdown Sal + Enc abaixo do valor principal
- [x] Toggle "Incluir encargos" com painel expansível de detalhamento
- [x] Badge "CCT Vigente Aplicada" quando CCT está cadastrada
- [x] Dropdown searchable de colaboradores com nome + cargo
- [x] Tipo CLT/PJ por colaborador na tabela de detalhamento

## v67 — Refatoração do fluxo de Rescisão: resultado inline + Salvar/Descartar + alerta de saída
- [x] Substituir modal de cálculo por resultado inline na página
- [x] Ao clicar "Calcular Rescisão", exibir resultado diretamente na tela/aba
- [x] Adicionar botões "Salvar Cálculo" e "Descartar" no resultado
- [x] Alerta de confirmação ao tentar sair da aba ou clicar fora sem salvar
- [x] Manter fluxo de preenchimento (colaborador, data, tipo) antes do cálculo
- [x] Rota backend "preview" (calcula sem salvar) separada da rota "calcular" (salva)
- [x] Resultado inline com dados do colaborador, verbas rescisórias, FGTS, totais
- [x] 13 testes vitest passando para fluxo de rescisão

## v68 — Coluna Salário Líquido no Simulador + Correção Excel Export
- [x] Adicionar colunas "Líquido Atual" e "Líquido Novo" na tabela do Simulador de Reajuste
- [x] Calcular descontos CLT do empregado: INSS (faixa progressiva 2025), IRRF (faixa progressiva 2025)
- [x] Considerar tipo de contratação (CLT vs PJ) — PJ sem descontos CLT
- [x] Corrigir erro na exportação Excel (document.body.appendChild + delayed revokeObjectURL)
- [x] Incluir colunas Líquido no CSV exportado
- [x] 16 testes vitest passando para cálculo de salário líquido

## v69 — Melhorias na Rescisão: Export PDF/Excel, Edição de Verbas, Histórico de Auditoria
- [x] Exportação PDF do resultado da rescisão diretamente na tela de resultado (antes de salvar)
- [x] Exportação Excel/CSV do resultado da rescisão (antes de salvar)
- [x] Edição manual de verbas no resultado (ajustar dias de aviso prévio, adicionar descontos)
- [x] Recálculo automático dos totais ao editar verbas
- [x] Criar tabela rescisao_auditoria para histórico de simulações
- [x] Registrar quem simulou, quando, dados do colaborador e resultado da simulação
- [x] Exibir aba "Auditoria" na página de Rescisão com histórico completo
- [x] Badges coloridos: Simulado (azul), Salvo (verde), Descartado (vermelho)
- [x] Rota backend /api/rescisao-pdf para exportação PDF
- [x] 17 testes vitest passando para auditoria, verbas editáveis, CSV e navegação

## v70 — Ocorrências e Plano de Reversão
- [x] Criar submenu "Ocorrências e Plano de Reversão" no menu Gestão RH
- [x] Criar tabelas no banco: ocorrencias, plano_reversao, plano_reversao_etapas, plano_reversao_feedbacks
- [x] Tipos de ocorrência: falta injustificada, atraso frequente, falta leve/média/grave, erro no trabalho, conduta inapropriada, conflito interno
- [x] Classificação automática: reversível vs irreversível com indicador de ação (reversão ou desligamento)
- [x] Registro no histórico do colaborador com data, descrição, evidências
- [x] Programa de Plano de Reversão estruturado com boas práticas de RH
- [x] Etapas do plano: feedback inicial, metas, acompanhamento periódico, avaliação final
- [x] Prazo definido para o plano de revers com acompanhamento
- [x] Indicador automático de recomendação (reversão vs desligamento) baseado no cenário
- [x] Rota e navegação no App.tsx
- [x] Testes vitest para as novas funcionalidades (19 testes passando)
- [x] Corrigir colunas do banco (snake_case → camelCase) para compatibilidade com schema Drizzle

## v71 — Integração Ocorrências + Perfil Colaborador, Notificações Automáticas, Dashboard RH
- [x] Integração com cadastro de colaboradores: vincular ocorrências ao perfil do colaborador
- [x] Exibir aba "Histórico Disciplinar" na ficha individual do colaborador
- [x] Backend: rota para buscar ocorrências e planos por colaboradorId
- [x] Notificações automáticas: alertar gestores quando plano de reversão próximo do vencimento
- [x] Notificações automáticas: alertar quando colaborador atingir limite de reincidências
- [x] Backend: lógica de verificação de prazos e reincidências com notificação
- [x] Relatórios e dashboards de RH: visualizações consolidadas
- [x] Dashboard: ocorrências por setor (gráfico)
- [x] Dashboard: ocorrências por tipo (gráfico)
- [x] Dashboard: taxa de sucesso dos planos de reversão
- [x] Dashboard: evolução temporal de ocorrências
- [x] Nova página/aba de Dashboard RH com gráficos Recharts
- [x] Testes vitest para as novas funcionalidades (20 testes passando)

## v72 — Melhorias Formulários Ocorrências/Plano, PDF Export, Workflow Aprovação, Projeção Financeira
- [x] Alerta de sair sem salvar ao cancelar ou clicar fora do dialog de Nova Ocorrência
- [x] Campo colaborador com largura fixa (não autoajustável) no dialog de Nova Ocorrência
- [x] Auto-preencher cargo e setor ao selecionar colaborador no dialog de Nova Ocorrência
- [x] Auto-selecionar gravidade ao selecionar tipo de ocorrência
- [x] Criar tipo "Falta Gravíssima" com gravidade gravíssima
- [x] Medidas Tomadas como menu suspenso com opções (advertência verbal, escrita, suspensão, desligamento, etc.)
- [x] Alerta de sair sem salvar ao cancelar ou clicar fora do dialog de Criar Plano de Reversão
- [x] Campo colaborador com largura fixa no dialog de Criar Plano de Reversão
- [x] Auto-preencher cargo, gestor imediato do setor como responsável e setor ao selecionar colaborador no Plano
- [x] Gestor de RH como co-responsável em todos os planos de reversão
- [x] Manter Matriz de Classificação Automática como balizadora e indicadora de medidas
- [x] Exportação de relatórios em PDF (dashboard e histórico disciplinar)
- [x] Workflow de aprovação para ocorrência grave ou desligamento (requer aprovação da diretoria)
- [x] Integração com projeção financeira (custos de rescisão estimados quando recomendação é desligamento)
- [x] Testes vitest para as novas funcionalidades (15 testes passando)

## v73 — Timeline Visual, Assinatura Digital, Relatório Mensal Consolidado
- [x] Timeline visual no detalhe de cada ocorrência (registro, aprovação, plano criado, feedbacks)
- [x] Tabela ocorrencia_timeline no banco para registrar eventos cronológicos
- [x] Backend: rota para buscar timeline de uma ocorrência
- [x] Componente visual de timeline com ícones e cores por tipo de evento
- [x] Assinatura digital do colaborador nas ocorrências (ciência com data/hora)
- [x] Assinatura digital do colaborador nos planos de reversão (ciência com data/hora)
- [x] Campos de assinatura no banco (assinaturaColaborador, dataAssinatura, assinaturaGestor)
- [x] Backend: rotas para registrar assinaturas
- [x] Relatório consolidado mensal com resumo de ocorrências, planos e indicadores
- [x] Backend: rota para gerar dados do relatório mensal
- [x] Exportação do relatório mensal em PDF
- [x] Testes vitest para as novas funcionalidades (24 testes passando)

## v74 — Redesign Organograma em Cargos e Salários
- [x] Setores recolhidos por padrão, expandir ao clicar
- [x] Visual de organograma real (hierárquico com cards e conexões)
- [x] Total de colaboradores por setor visível no card do setor
- [x] Autoajuste ao cadastrar/desligar colaborador (dados dinâmicos do backend)
- [x] Testes vitest para a nova funcionalidade (15 testes passando)

## v75 — Reverter Organograma para Formato Lista
- [x] Reverter visual do organograma para formato lista (anterior)
- [x] Setores recolhidos por padrão, expandir ao clicar
- [x] Total de custo salarial e colaboradores por setor visível
- [x] Autoajuste ao cadastrar/desligar colaborador
- [x] Testes vitest existentes continuam passando (24 testes de ocorrências + organograma)

## v76 — Correção de Filtros e Melhorias em Colaboradores
- [x] Corrigir filtro de Vale Transporte (sim/não não retorna resultados)
- [x] Revisar e corrigir todos os filtros existentes na página de Colaboradores (VT corrigido: !!c.valeTransporte em vez de === true)
- [x] Adicionar filtro por benefício Academia (sim/não)
- [x] Adicionar filtro por Cargo de Confiança (sim/não)
- [x] Adicionar filtro por Cargo Comissionado (sim/não)
- [x] Exportação PDF em orientação paisagem com 15 colunas (Nome, CPF, Cargo, Setor, Nível, Salário, Status, Contrato, Local, Formação, Admissão, VT, Acad., Conf., Comis.)

## v77 — Biblioteca Evox (Módulo Completo)
- [x] Schema: 9 tabelas (bib_livros, bib_exemplares, bib_emprestimos, bib_reservas, bib_ocorrencias, bib_fornecedores_doadores, bib_politicas, bib_auditoria) + 27 índices
- [x] Backend: dbBiblioteca.ts com helpers para CRUD de livros, exemplares, empréstimos, reservas, ocorrências, fornecedores, políticas, auditoria
- [x] Backend: routersBiblioteca.ts com tRPC procedures (livros, exemplares, empréstimos com devolver/renovar, reservas com cancelar, ocorrências, fornecedores, políticas upsert, auditoria, dashboard)
- [x] Backend: regras de negócio (empréstimo com data retirada/previsão, renovação com nova data, devolução com data efetiva, fila de reservas)
- [x] Sidebar: submenu Biblioteca Evox dentro de Gente & Gestão com 10 itens
- [x] Dashboard Biblioteca: 6 KPIs + 3 gráficos (empréstimos/mês, status exemplares, livros/categoria) + ações rápidas
- [x] Acervo: catálogo com busca, filtro por categoria/status, CRUD completo com todos os campos
- [x] Exemplares e Patrimônio: gestão com código patrimonial, condição, localização, origem, fornecedor
- [x] Empréstimos: workflow completo (selecionar exemplar/colaborador, checklist, prazo, renovação +14 dias, devolução)
- [x] Reservas: fila de reservas com criação, cancelamento e filtro por status
- [x] Devoluções e Ocorrências: tabs pendentes/ocorrências, registro de devolução, abertura de ocorrências (5 tipos)
- [x] Fornecedores e Doadores: cadastro com tipo (fornecedor/doador/ambos), contato, email, telefone
- [x] Políticas e Regras: cards com ícones, upsert, carregar políticas padrão
- [x] Relatórios: 4 KPIs + exportação CSV (acervo/empréstimos) + top livros/colaboradores + distribuição por categoria
- [x] Auditoria: log com busca, filtro por ação, tabela com data/hora/usuário/ação/entidade/descrição
- [ ] Notificações: lembrete antes do vencimento, aviso de atraso, reserva disponível, expiração de reserva (próxima iteração)
- [ ] Autoatendimento do colaborador: buscar catálogo, ver disponibilidade, reservar, renovar, ver meus empréstimos (próxima iteração)
- [x] Testes vitest: 34 arquivos passando (683 testes), apenas falhas pré-existentes em chat (19 testes)

## v78 — Biblioteca Evox: Consolidar em tela única dentro de Gestão RH
- [x] Mover Biblioteca Evox para dentro do menu Gestão RH (card na hub Gestão RH com ícone e descrição)
- [x] Consolidar todas as 10 seções em uma única tela com abas horizontais (Dashboard, Acervo, Exemplares, Empréstimos, Reservas, Devoluções, Fornecedores, Políticas, Auditoria, Relatórios)
- [x] Remover 11 rotas individuais e hub page separada, substituir por rota única /rh/biblioteca
- [x] Remover submenu separado "Biblioteca Evox" do sidebar GEG, manter apenas dentro de Gestão RH

## v79 — Biblioteca Evox: Livros de teste, Notificações e Upload de Capa
- [x] Seed: 12 livros, 17 exemplares, 5 empréstimos (2 atrasados), 1 reserva, 2 fornecedores, 6 políticas padrão
- [x] Notificações automáticas: scheduler diário (8h) com notifyOwner para empréstimos vencendo amanhã e atrasados
- [x] Notificações automáticas: notificações in-app (tipo biblioteca_vencimento) para todos os usuários + aviso de atraso
- [x] Upload de capa: procedure uploadCapa com storagePut para S3 (base64 → Buffer → S3)
- [x] Upload de capa: frontend com preview de imagem, drag-and-drop, ou URL manual no form de cadastro/edição
- [x] Upload de capa: coluna Capa na tabela do Acervo com thumbnail 36x48px e placeholder BookOpen
