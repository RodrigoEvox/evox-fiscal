# 📋 Plano de Qualidade - Evox Fiscal

**Data de Criação:** 25 de Março de 2026  
**Versão:** 1.0  
**Status:** Em Implementação

---

## 1. DIAGNÓSTICO ATUAL

### 1.1 Estado do Projeto
- **Arquitetura**: Sólida (tRPC + Drizzle + React 19)
- **Banco de Dados**: 720 colaboradores de teste (EXCESSIVO)
- **Erros TypeScript**: 3 erros críticos não resolvidos
- **Rotas**: Múltiplas inconsistências entre menu e implementação
- **Funcionalidades**: ~60% implementadas, 40% com problemas

### 1.2 Problemas Identificados
1. **Dados de Teste Inflados**: 720 colaboradores em vez de 5-10
2. **Erros TypeScript Não Resolvidos**:
   - `prestaServicos` não existe em tipo de cliente
   - Type mismatch em `financeiro.ts` (number vs string)
3. **Rotas Quebradas**: Múltiplas páginas retornam 404
4. **Falta de Testes Automatizados**: Nenhum teste vitest em execução
5. **Inconsistência de Menu**: Rotas no banco não correspondem ao App.tsx
6. **Confirmações Falsas**: Mudanças relatadas como "corrigidas" sem validação

---

## 2. OBJETIVOS DE QUALIDADE

### 2.1 Curto Prazo (Semana 1)
- [ ] Corrigir todos os 3 erros TypeScript
- [ ] Reduzir colaboradores de 720 para 5
- [ ] Validar todas as rotas principais
- [ ] Criar suite de testes básicos

### 2.2 Médio Prazo (Semanas 2-3)
- [ ] 100% de cobertura de testes para routers críticos
- [ ] Documentação completa de cada módulo
- [ ] Validação de todos os 50+ submenus
- [ ] Performance: < 2s para carregar qualquer página

### 2.3 Longo Prazo (Mês 1)
- [ ] Zero erros TypeScript
- [ ] Testes E2E para fluxos críticos
- [ ] CI/CD pipeline funcional
- [ ] Documentação de API completa

---

## 3. ESTRATÉGIA DE CORREÇÃO

### 3.1 Fase 1: Limpeza de Dados (Dia 1)
```sql
-- Backup
CREATE TABLE colaboradores_backup AS SELECT * FROM colaboradores;

-- Deletar tudo exceto 5 de teste
DELETE FROM colaboradores WHERE id NOT IN (
  SELECT id FROM (
    SELECT id FROM colaboradores LIMIT 5
  ) AS temp
);
```

**Impacto**: Reduz tamanho do banco de 720 para 5 registros

### 3.2 Fase 2: Correção de Erros TypeScript (Dia 2)
```typescript
// Erro 1: prestaServicos não existe
// Solução: Remover referência ou adicionar ao schema

// Erro 2: Type mismatch em financeiro.ts
// Solução: Converter number para string ou vice-versa
```

### 3.3 Fase 3: Auditoria de Rotas (Dia 3)
- [ ] Mapear todas as rotas no banco (setor_config)
- [ ] Comparar com App.tsx
- [ ] Listar discrepâncias
- [ ] Corrigir uma por uma

### 3.4 Fase 4: Testes Automatizados (Dias 4-5)
- [ ] Criar teste para cada router crítico
- [ ] Validar fluxos de autenticação
- [ ] Testar CRUD de clientes
- [ ] Testar criação de tarefas

---

## 4. PROTOCOLO DE VALIDAÇÃO

### 4.1 Antes de Cada Mudança
1. **Ler o código** - Entender completamente antes de modificar
2. **Criar teste** - Escrever teste que valida a mudança
3. **Implementar** - Fazer a mudança
4. **Executar teste** - Confirmar que passa
5. **Testar no navegador** - Validar visualmente

### 4.2 Checklist de Correção
```
Para cada página/rota que não abre:
- [ ] Rota existe em App.tsx?
- [ ] Componente existe no caminho correto?
- [ ] Componente está exportado corretamente?
- [ ] Teste automatizado passa?
- [ ] Página carrega sem erros no navegador?
- [ ] Todos os botões funcionam?
- [ ] Dados aparecem corretamente?
```

### 4.3 Critérios de Aceitação
- ✅ Sem erros TypeScript
- ✅ Sem 404s
- ✅ Sem console errors
- ✅ Testes passando
- ✅ Validado no navegador

---

## 5. ESTRUTURA DE TESTES

### 5.1 Testes Obrigatórios por Módulo

#### Módulo Crédito
```typescript
// server/routers/credito.test.ts
describe('Crédito Router', () => {
  test('cases.list retorna casos', async () => {})
  test('cases.create cria novo caso', async () => {})
  test('cases.getById retorna caso específico', async () => {})
})
```

#### Módulo Clientes
```typescript
// server/db.test.ts
describe('Cliente Functions', () => {
  test('listClientes retorna lista', async () => {})
  test('getClienteById retorna cliente', async () => {})
  test('createCliente insere novo', async () => {})
})
```

### 5.2 Cobertura Mínima
- Routers críticos: 80%
- Funções de banco: 90%
- Hooks customizados: 70%

---

## 6. PROCESSO DE DESENVOLVIMENTO

### 6.1 Workflow Padrão
```
1. Receber requisição
   ↓
2. Criar item em todo.md
   ↓
3. Escrever teste que falha
   ↓
4. Implementar funcionalidade
   ↓
5. Teste passa
   ↓
6. Validar no navegador
   ↓
7. Marcar como [x] em todo.md
   ↓
8. Fazer checkpoint
```

### 6.2 Comunicação
- **Antes de corrigir**: "Vou corrigir X. Teste será Y. Validação será Z."
- **Depois de corrigir**: "Corrigido. Teste passou. Validado no navegador em [URL]."
- **Nunca dizer**: "Corrigido" sem evidência

---

## 7. MÉTRICAS DE QUALIDADE

### 7.1 Indicadores Principais
| Métrica | Atual | Meta | Prazo |
|---------|-------|------|-------|
| Erros TypeScript | 3 | 0 | Dia 2 |
| Colaboradores Teste | 720 | 5 | Dia 1 |
| Rotas Quebradas | 12+ | 0 | Dia 3 |
| Cobertura Testes | 0% | 70% | Semana 1 |
| Tempo Carregamento | 3-5s | <2s | Semana 2 |

### 7.2 Dashboard de Qualidade
```
Status Geral: 🔴 CRÍTICO
├─ TypeScript Errors: 3 ❌
├─ Rotas Funcionais: 38/50 (76%) ⚠️
├─ Testes Automatizados: 0/20 ❌
├─ Dados Limpos: Não ⚠️
└─ Documentação: 20% ⚠️
```

---

## 8. CRONOGRAMA

### Semana 1: Estabilização
- **Dia 1**: Limpeza de dados + Correção TypeScript
- **Dia 2**: Auditoria de rotas
- **Dia 3**: Correção de rotas quebradas
- **Dia 4-5**: Testes automatizados básicos

### Semana 2: Consolidação
- Testes para todos os routers
- Documentação de APIs
- Performance optimization

### Semana 3: Validação
- Testes E2E
- Validação de fluxos críticos
- Preparação para produção

---

## 9. RESPONSABILIDADES

### 9.1 Manus (IA)
- ✅ Implementar mudanças
- ✅ Escrever testes
- ✅ Validar no navegador
- ✅ Documentar decisões
- ✅ Reportar status honestamente

### 9.2 Rodrigo (Usuário)
- ✅ Revisar mudanças
- ✅ Validar requisitos
- ✅ Testar fluxos críticos
- ✅ Aprovar antes de deploy
- ✅ Reportar problemas

---

## 10. ESCALAÇÃO E SUPORTE

### 10.1 Quando Pedir Ajuda
- Erro TypeScript que não consigo resolver
- Problema de performance que não é óbvio
- Decisão arquitetural importante
- Conflito entre requisitos

### 10.2 Processo de Rollback
```
Se algo quebrar:
1. Identificar o checkpoint anterior estável
2. Fazer rollback imediato
3. Investigar causa
4. Corrigir e testar antes de reimplementar
```

---

## 11. PRÓXIMOS PASSOS IMEDIATOS

### Ação 1: Confirmar Checkpoint Estável
**Pergunta**: Qual foi o último checkpoint onde você se sentiu confiante?
- Opção A: Usar o mais recente (bf5d9d91)
- Opção B: Fazer rollback para checkpoint anterior
- Opção C: Começar do zero

### Ação 2: Iniciar Limpeza de Dados
```sql
-- Reduzir colaboradores para 5
DELETE FROM colaboradores WHERE id > 5;
```

### Ação 3: Criar Suite de Testes
- Teste para cada rota principal
- Teste para cada função de banco
- Teste para fluxos críticos

---

## 12. ASSINATURA E APROVAÇÃO

**Plano Criado Por**: Manus AI  
**Data**: 25 de Março de 2026  
**Status**: Aguardando aprovação de Rodrigo  

**Aprovação de Rodrigo**: _______________  
**Data**: _______________

---

## Notas Finais

Este plano é **vivo e iterativo**. Será atualizado conforme:
- Novos problemas forem descobertos
- Prioridades mudarem
- Progresso for feito

**Objetivo**: Retomar o projeto com confiança e qualidade, não velocidade.

**Filosofia**: "Lento e estável é melhor que rápido e quebrado."
