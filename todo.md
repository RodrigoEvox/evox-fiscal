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
