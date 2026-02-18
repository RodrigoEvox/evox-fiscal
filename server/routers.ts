import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import crypto from "crypto";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new Error('Permissão negada: apenas administradores podem realizar esta ação');
  }
  return next({ ctx });
});

// Helper to log audit entries
async function logAudit(acao: string, entidadeTipo: string, entidadeId: number | null, entidadeNome: string | null, ctx: any, detalhes?: any) {
  try {
    await db.createAuditEntry({
      acao: acao as any,
      entidadeTipo,
      entidadeId,
      entidadeNome,
      detalhes,
      usuarioId: ctx.user?.id,
      usuarioNome: ctx.user?.name || 'Sistema',
      ip: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for'] || null,
    });
  } catch (e) { /* silent */ }
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ---- USERS ----
  users: router({
    list: protectedProcedure.query(async () => {
      return db.listUsers();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const allUsers = await db.listUsers();
        return allUsers.find((u: any) => u.id === input.id) || null;
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1, 'Nome completo é obrigatório'),
        apelido: z.string().min(1, 'Apelido é obrigatório'),
        email: z.string().email('Email inválido'),
        cpf: z.string().optional(),
        telefone: z.string().optional(),
        cargo: z.string().optional(),
        role: z.enum(['user', 'admin']).default('user'),
        nivelAcesso: z.enum(['diretor', 'gerente', 'coordenador', 'analista_fiscal', 'suporte_comercial']).default('analista_fiscal'),
        setorPrincipalId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const openId = `manual_${crypto.randomBytes(12).toString('hex')}`;
        const id = await db.createUser({
          openId,
          name: input.name,
          apelido: input.apelido,
          email: input.email,
          cpf: input.cpf || null,
          telefone: input.telefone || null,
          cargo: input.cargo || null,
          role: input.role,
          nivelAcesso: input.nivelAcesso,
          setorPrincipalId: input.setorPrincipalId || null,
          loginMethod: 'manual',
        } as any);
        await logAudit('criar', 'usuario', id, input.name, ctx, { email: input.email, apelido: input.apelido });
        return { id };
      }),
    updateRole: adminProcedure
      .input(z.object({ id: z.number(), role: z.string(), nivelAcesso: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.id, input.role, input.nivelAcesso);
        await logAudit('editar', 'usuario', input.id, null, ctx, { role: input.role, nivelAcesso: input.nivelAcesso });
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        apelido: z.string().optional(),
        email: z.string().optional(),
        cpf: z.string().optional(),
        cargo: z.string().optional(),
        telefone: z.string().optional(),
        role: z.string().optional(),
        nivelAcesso: z.string().optional(),
        setorPrincipalId: z.number().nullable().optional(),
        supervisorId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateUser(id, data as any);
        await logAudit('editar', 'usuario', id, null, ctx, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Soft delete — just deactivate
        await db.toggleUserActive(input.id, false);
        await logAudit('excluir', 'usuario', input.id, null, ctx);
        return { success: true };
      }),
    toggleActive: adminProcedure
      .input(z.object({ id: z.number(), ativo: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await db.toggleUserActive(input.id, input.ativo);
        await logAudit(input.ativo ? 'ativar' : 'inativar', 'usuario', input.id, null, ctx);
        return { success: true };
      }),
  }),

  // ---- SETORES ----
  setores: router({
    list: protectedProcedure.query(async () => {
      return db.listSetores();
    }),
    create: adminProcedure
      .input(z.object({
        nome: z.string().min(1),
        descricao: z.string().optional(),
        cor: z.string().optional(),
        icone: z.string().optional(),
        setorPaiId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createSetor(input as any);
        await logAudit('criar', 'setor', id, input.nome, ctx);
        return { id };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateSetor(input.id, input.data as any);
        await logAudit('editar', 'setor', input.id, null, ctx, input.data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteSetor(input.id);
        await logAudit('excluir', 'setor', input.id, null, ctx);
        return { success: true };
      }),
    addMembro: adminProcedure
      .input(z.object({ userId: z.number(), setorId: z.number(), papelNoSetor: z.enum(["responsavel", "membro", "observador"]).optional() }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.addUsuarioSetor({ userId: input.userId, setorId: input.setorId, papelNoSetor: input.papelNoSetor || 'membro' } as any);
        await logAudit('atribuir', 'setor', input.setorId, null, ctx, { userId: input.userId });
        return { id };
      }),
    removeMembro: adminProcedure
      .input(z.object({ userId: z.number(), setorId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.removeUsuarioSetor(input.userId, input.setorId);
        return { success: true };
      }),
    membros: protectedProcedure
      .input(z.object({ setorId: z.number().optional() }))
      .query(async ({ input }) => {
        const all = await db.listUsuarioSetores();
        if (input.setorId) return all.filter(us => us.setorId === input.setorId);
        return all;
      }),
  }),

  // ---- PARCEIROS ----
  parceiros: router({
    list: protectedProcedure.query(async () => {
      return db.listParceiros();
    }),
    create: protectedProcedure
      .input(z.object({
        nomeCompleto: z.string().min(1),
        cpfCnpj: z.string().optional(),
        tipo: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().optional(),
        endereco: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().optional(),
        comissaoPercentual: z.number().optional(),
        modeloParceriaId: z.number().nullable().optional(),
        observacoes: z.string().optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createParceiro(input as any);
        await logAudit('criar', 'parceiro', id, input.nomeCompleto, ctx);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeCompleto: z.string().optional(),
        cpfCnpj: z.string().optional(),
        tipo: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().optional(),
        endereco: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().optional(),
        comissaoPercentual: z.number().optional(),
        modeloParceriaId: z.number().nullable().optional(),
        observacoes: z.string().optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateParceiro(id, data as any);
        await logAudit('editar', 'parceiro', id, null, ctx, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteParceiro(input.id);
        await logAudit('excluir', 'parceiro', input.id, null, ctx);
        return { success: true };
      }),
    toggleActive: adminProcedure
      .input(z.object({ id: z.number(), ativo: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await db.updateParceiro(input.id, { ativo: input.ativo } as any);
        await logAudit(input.ativo ? 'ativar' : 'inativar', 'parceiro', input.id, null, ctx);
        return { success: true };
      }),
  }),

  // ---- CLIENTES ----
  clientes: router({
    list: protectedProcedure.query(async () => {
      return db.listClientes();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getClienteById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        cnpj: z.string().min(1),
        razaoSocial: z.string().min(1),
        nomeFantasia: z.string().optional(),
        dataAbertura: z.string().optional(),
        regimeTributario: z.enum(["simples_nacional", "lucro_presumido", "lucro_real"]),
        situacaoCadastral: z.enum(["ativa", "baixada", "inapta", "suspensa", "nula"]).optional(),
        cnaePrincipal: z.string().optional(),
        cnaePrincipalDescricao: z.string().optional(),
        cnaesSecundarios: z.array(z.string()).optional(),
        segmentoEconomico: z.string().optional(),
        naturezaJuridica: z.string().optional(),
        endereco: z.string().optional(),
        estado: z.string().optional(),
        industrializa: z.boolean().optional(),
        comercializa: z.boolean().optional(),
        prestaServicos: z.boolean().optional(),
        contribuinteICMS: z.boolean().optional(),
        contribuinteIPI: z.boolean().optional(),
        regimeMonofasico: z.boolean().optional(),
        folhaPagamentoMedia: z.string().optional(),
        faturamentoMedioMensal: z.string().optional(),
        valorMedioGuias: z.string().optional(),
        processosJudiciaisAtivos: z.boolean().optional(),
        parcelamentosAtivos: z.boolean().optional(),
        atividadePrincipalDescritivo: z.string().optional(),
        parceiroId: z.number().nullable().optional(),
        procuracaoHabilitada: z.boolean().optional(),
        procuracaoCertificado: z.string().optional(),
        procuracaoValidade: z.string().optional(),
        excecoesEspecificidades: z.string().optional(),
        prioridade: z.enum(["alta", "media", "baixa"]).optional(),
        scoreOportunidade: z.number().optional(),
        redFlags: z.any().optional(),
        alertasInformacao: z.any().optional(),
        usuarioCadastroId: z.number().optional(),
        usuarioCadastroNome: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createCliente(input as any);
        if (id) {
          await db.createFilaItem({ clienteId: id, status: 'a_fazer' } as any);
        }
        await logAudit('criar', 'cliente', id, input.razaoSocial, ctx);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateCliente(input.id, input.data as any);
        await logAudit('editar', 'cliente', input.id, null, ctx, input.data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteCliente(input.id);
        await logAudit('excluir', 'cliente', input.id, null, ctx);
        return { success: true };
      }),
    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), ativo: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await db.updateCliente(input.id, { situacaoCadastral: input.ativo ? 'ativa' : 'suspensa' } as any);
        await logAudit(input.ativo ? 'ativar' : 'inativar', 'cliente', input.id, null, ctx);
        return { success: true };
      }),
    runAnalise: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const cliente = await db.getClienteById(input.id);
        if (!cliente) throw new Error('Cliente não encontrado');
        const allTeses = await db.listTeses();
        const activeTeses = allTeses.filter(t => t.ativa);

        const redFlags: any[] = [];
        if (cliente.dataAbertura) {
          const parts = cliente.dataAbertura.split('/');
          const d = parts.length === 3 ? new Date(+parts[2], +parts[1]-1, +parts[0]) : new Date(cliente.dataAbertura);
          const years = (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          if (years < 2) redFlags.push({ tipo: 'Empresa recente', descricao: `Aberta há menos de 2 anos (${years.toFixed(1)} anos)`, impacto: 'nao_prioritario' });
        }
        if (Number(cliente.valorMedioGuias || 0) < 20000 && Number(cliente.valorMedioGuias || 0) > 0) {
          redFlags.push({ tipo: 'Guias abaixo do mínimo', descricao: `Valor médio R$ ${Number(cliente.valorMedioGuias).toLocaleString('pt-BR')} (< R$ 20.000)`, impacto: 'nao_prioritario' });
        }
        if (['baixada', 'inapta', 'suspensa', 'nula'].includes(cliente.situacaoCadastral)) {
          redFlags.push({ tipo: 'Situação cadastral irregular', descricao: `Status: ${cliente.situacaoCadastral}`, impacto: 'nao_prioritario' });
        }
        if (cliente.processosJudiciaisAtivos) {
          redFlags.push({ tipo: 'Processos judiciais ativos', descricao: 'Empresa possui processos judiciais em andamento', impacto: 'atencao' });
        }
        if (cliente.parcelamentosAtivos) {
          redFlags.push({ tipo: 'Parcelamentos ativos', descricao: 'Empresa possui parcelamentos tributários ativos', impacto: 'atencao' });
        }

        const alertas: any[] = [];
        const camposObrigatorios = [
          { campo: 'dataAbertura', label: 'Data de Abertura' },
          { campo: 'cnaePrincipal', label: 'CNAE Principal' },
          { campo: 'estado', label: 'Estado' },
          { campo: 'faturamentoMedioMensal', label: 'Faturamento Médio' },
          { campo: 'valorMedioGuias', label: 'Valor Médio das Guias' },
        ];
        for (const c of camposObrigatorios) {
          const val = (cliente as any)[c.campo];
          if (!val || val === '0' || val === '0.00') {
            alertas.push({ campo: c.label, status: 'faltante' });
          }
        }

        const tesesAplicaveis: any[] = [];
        const tesesDescartadas: any[] = [];
        for (const tese of activeTeses) {
          let aplicavel = true;
          const motivos: string[] = [];
          if (cliente.regimeTributario === 'lucro_real' && !tese.aplicavelLucroReal) { aplicavel = false; motivos.push('Não aplicável a Lucro Real'); }
          if (cliente.regimeTributario === 'lucro_presumido' && !tese.aplicavelLucroPresumido) { aplicavel = false; motivos.push('Não aplicável a Lucro Presumido'); }
          if (cliente.regimeTributario === 'simples_nacional' && !tese.aplicavelSimplesNacional) { aplicavel = false; motivos.push('Não aplicável a Simples Nacional'); }
          if (tese.aplicavelComercio && !tese.aplicavelIndustria && !tese.aplicavelServico && !cliente.comercializa) { aplicavel = false; motivos.push('Empresa não comercializa'); }
          if (!tese.aplicavelComercio && tese.aplicavelIndustria && !tese.aplicavelServico && !cliente.industrializa) { aplicavel = false; motivos.push('Empresa não industrializa'); }
          if (!tese.aplicavelComercio && !tese.aplicavelIndustria && tese.aplicavelServico && !cliente.prestaServicos) { aplicavel = false; motivos.push('Empresa não presta serviços'); }
          if (tese.aplicavelContribuinteICMS && !cliente.contribuinteICMS && tese.tributoEnvolvido.includes('ICMS')) { aplicavel = false; motivos.push('Não é contribuinte de ICMS'); }
          if (tese.aplicavelContribuinteIPI && !cliente.contribuinteIPI && tese.tributoEnvolvido.includes('IPI')) { aplicavel = false; motivos.push('Não é contribuinte de IPI'); }
          const impeditivos = Array.isArray(tese.requisitosImpeditivos) ? tese.requisitosImpeditivos : [];
          for (const imp of impeditivos) {
            const impLower = imp.toLowerCase();
            if (impLower.includes('simples') && cliente.regimeTributario === 'simples_nacional') { aplicavel = false; motivos.push(imp); }
            if (impLower.includes('isent') && !cliente.contribuinteICMS) { aplicavel = false; motivos.push(imp); }
          }
          const base = Number(cliente.valorMedioGuias || 0);
          const mult = tese.potencialFinanceiro === 'muito_alto' ? 0.15 : tese.potencialFinanceiro === 'alto' ? 0.10 : tese.potencialFinanceiro === 'medio' ? 0.05 : 0.02;
          const valorEstimado = Math.round(base * mult * 100) / 100;
          if (aplicavel) {
            tesesAplicaveis.push({ teseId: tese.id, teseNome: tese.nome, valorEstimado, classificacao: tese.classificacao, tipo: tese.tipo, potencialFinanceiro: tese.potencialFinanceiro, fundamentacao: tese.fundamentacaoLegal?.substring(0, 200) });
          } else {
            tesesDescartadas.push({ teseId: tese.id, teseNome: tese.nome, motivo: motivos.join('; ') });
          }
        }

        const hasHighPotentialTeses = tesesAplicaveis.some((t: any) => ['muito_alto', 'alto'].includes(t.potencialFinanceiro));
        const hasNonPriorityFlags = redFlags.some((r: any) => r.impacto === 'nao_prioritario');
        let prioridade: 'alta' | 'media' | 'baixa' = 'media';
        if (hasHighPotentialTeses && !hasNonPriorityFlags) prioridade = 'alta';
        else if (hasNonPriorityFlags && !hasHighPotentialTeses) prioridade = 'baixa';

        const totalValor = tesesAplicaveis.reduce((s: number, t: any) => s + (t.valorEstimado || 0), 0);
        const score = Math.min(100, Math.round((tesesAplicaveis.length / Math.max(activeTeses.length, 1)) * 50 + (totalValor > 50000 ? 50 : (totalValor / 50000) * 50)));

        await db.updateCliente(input.id, { redFlags, alertasInformacao: alertas, prioridade, scoreOportunidade: score });

        const reportId = await db.createRelatorio({
          clienteId: input.id,
          clienteNome: cliente.razaoSocial,
          diagnosticoTributario: `Análise automática: ${tesesAplicaveis.length} teses aplicáveis de ${activeTeses.length} disponíveis. Score: ${score}/100.`,
          tesesAplicaveis,
          tesesDescartadas,
          scoreOportunidade: score,
          recomendacaoGeral: prioridade === 'alta' ? 'Cliente com alto potencial. Priorizar atendimento.' : prioridade === 'baixa' ? 'Cliente com indicadores de não-prioridade. Avaliar viabilidade.' : 'Cliente com potencial moderado. Avaliar caso a caso.',
          redFlags,
          prioridade,
        } as any);

        await logAudit('criar', 'relatorio', reportId, `Análise ${cliente.razaoSocial}`, ctx);
        return { reportId, prioridade, score, tesesAplicaveis: tesesAplicaveis.length, tesesDescartadas: tesesDescartadas.length, totalValor, redFlags: redFlags.length };
      }),
    importCsv: protectedProcedure
      .input(z.object({ clientes: z.array(z.record(z.string(), z.any())) }))
      .mutation(async ({ input, ctx }) => {
        const results = { success: 0, errors: 0 };
        for (const row of input.clientes) {
          try {
            const data: any = {
              cnpj: row.cnpj || row.CNPJ || '',
              razaoSocial: row.razaoSocial || row.razao_social || row['Razão Social'] || row['RAZAO SOCIAL'] || '',
              nomeFantasia: row.nomeFantasia || row.nome_fantasia || row['Nome Fantasia'] || null,
              regimeTributario: (row.regimeTributario || row.regime_tributario || row['Regime Tributário'] || 'lucro_presumido').toLowerCase().replace(/ /g, '_'),
              dataAbertura: row.dataAbertura || row.data_abertura || row['Data Abertura'] || null,
              estado: row.estado || row.uf || row.UF || null,
              cnaePrincipal: row.cnaePrincipal || row.cnae || row.CNAE || null,
              valorMedioGuias: row.valorMedioGuias || row.valor_medio_guias || row['Valor Médio Guias'] || '0',
              faturamentoMedioMensal: row.faturamentoMedioMensal || row.faturamento || row['Faturamento'] || '0',
              usuarioCadastroId: ctx.user.id,
              usuarioCadastroNome: ctx.user.name || 'Importação CSV',
            };
            if (!data.cnpj || !data.razaoSocial) { results.errors++; continue; }
            if (!['simples_nacional', 'lucro_presumido', 'lucro_real'].includes(data.regimeTributario)) data.regimeTributario = 'lucro_presumido';
            const id = await db.createCliente(data);
            if (id) {
              await db.createFilaItem({ clienteId: id, status: 'a_fazer' } as any);
              results.success++;
            } else { results.errors++; }
          } catch { results.errors++; }
        }
        await logAudit('criar', 'importacao', null, `CSV Import: ${results.success} ok, ${results.errors} erros`, ctx);
        return results;
      }),
  }),

  // ---- TESES ----
  teses: router({
    list: protectedProcedure.query(async () => {
      return db.listTeses();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTeseById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        tributoEnvolvido: z.string().min(1),
        tipo: z.enum(["exclusao_base", "credito_presumido", "recuperacao_indebito", "tese_judicial", "tese_administrativa"]),
        classificacao: z.enum(["pacificada", "judicial", "administrativa", "controversa"]),
        potencialFinanceiro: z.enum(["muito_alto", "alto", "medio", "baixo"]),
        potencialMercadologico: z.enum(["muito_alto", "alto", "medio", "baixo"]),
        requisitosObjetivos: z.array(z.string()).optional(),
        requisitosImpeditivos: z.array(z.string()).optional(),
        fundamentacaoLegal: z.string().optional(),
        jurisprudenciaRelevante: z.string().optional(),
        parecerTecnicoJuridico: z.string().optional(),
        prazoPrescricional: z.string().optional(),
        necessidadeAcaoJudicial: z.boolean().optional(),
        viaAdministrativa: z.boolean().optional(),
        grauRisco: z.enum(["baixo", "medio", "alto"]),
        documentosNecessarios: z.array(z.string()).optional(),
        formulaEstimativaCredito: z.string().optional(),
        aplicavelComercio: z.boolean().optional(),
        aplicavelIndustria: z.boolean().optional(),
        aplicavelServico: z.boolean().optional(),
        aplicavelContribuinteICMS: z.boolean().optional(),
        aplicavelContribuinteIPI: z.boolean().optional(),
        aplicavelLucroReal: z.boolean().optional(),
        aplicavelLucroPresumido: z.boolean().optional(),
        aplicavelSimplesNacional: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createTese(input as any);
        await logAudit('criar', 'tese', id, input.nome, ctx);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateTese(input.id, input.data as any);
        await logAudit('editar', 'tese', input.id, null, ctx, input.data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteTese(input.id);
        await logAudit('excluir', 'tese', input.id, null, ctx);
        return { success: true };
      }),
    checkCarteira: protectedProcedure
      .input(z.object({ teseId: z.number() }))
      .query(async ({ input }) => {
        const tese = await db.getTeseById(input.teseId);
        if (!tese) return [];
        const allClientes = await db.listClientes();
        return allClientes.filter(c => {
          if (tese.aplicavelLucroReal && c.regimeTributario === 'lucro_real') return true;
          if (tese.aplicavelLucroPresumido && c.regimeTributario === 'lucro_presumido') return true;
          if (tese.aplicavelSimplesNacional && c.regimeTributario === 'simples_nacional') return true;
          if (tese.aplicavelComercio && c.comercializa) return true;
          if (tese.aplicavelIndustria && c.industrializa) return true;
          if (tese.aplicavelServico && c.prestaServicos) return true;
          return false;
        });
      }),
  }),

  // ---- FILA DE APURAÇÃO ----
  fila: router({
    list: protectedProcedure.query(async () => {
      const items = await db.listFilaApuracao();
      const allClientes = await db.listClientes();
      const clienteMap = new Map(allClientes.map(c => [c.id, c]));
      return items.map(item => {
        const cliente = clienteMap.get(item.clienteId);
        return {
          ...item,
          clienteNome: cliente?.razaoSocial || 'N/A',
          clienteCnpj: cliente?.cnpj || 'N/A',
          clientePrioridade: cliente?.prioridade || 'media',
          procuracaoHabilitada: cliente?.procuracaoHabilitada || false,
          procuracaoValidade: cliente?.procuracaoValidade || null,
          redFlags: cliente?.redFlags || [],
        };
      });
    }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.string(),
        analistaId: z.number().optional(),
        analistaNome: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const updateData: any = { status: input.status };
        if (input.status === 'fazendo') {
          updateData.analistaId = input.analistaId;
          updateData.analistaNome = input.analistaNome;
          updateData.dataInicioApuracao = new Date();
        }
        if (input.status === 'concluido') {
          updateData.dataConclusao = new Date();
        }
        await db.updateFilaItem(input.id, updateData);
        await logAudit('editar', 'fila', input.id, null, ctx, { status: input.status });
        return { success: true };
      }),
    updateTime: protectedProcedure
      .input(z.object({ id: z.number(), tempoGastoMs: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateFilaItem(input.id, { tempoGastoMs: input.tempoGastoMs });
        return { success: true };
      }),
  }),

  // ---- RELATÓRIOS ----
  relatorios: router({
    list: protectedProcedure.query(async () => {
      return db.listRelatorios();
    }),
    getByCliente: protectedProcedure
      .input(z.object({ clienteId: z.number() }))
      .query(async ({ input }) => {
        return db.getRelatoriosByClienteId(input.clienteId);
      }),
    create: protectedProcedure
      .input(z.object({
        clienteId: z.number(),
        clienteNome: z.string(),
        diagnosticoTributario: z.string().optional(),
        tesesAplicaveis: z.any().optional(),
        tesesDescartadas: z.any().optional(),
        scoreOportunidade: z.number().optional(),
        recomendacaoGeral: z.string().optional(),
        redFlags: z.any().optional(),
        prioridade: z.enum(["alta", "media", "baixa"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createRelatorio(input as any);
        await logAudit('criar', 'relatorio', id, input.clienteNome, ctx);
        return { id };
      }),
  }),

  // ---- NOTIFICAÇÕES ----
  notificacoes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listNotificacoes(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        tipo: z.enum(["procuracao_vencendo", "procuracao_vencida", "analise_concluida", "nova_tese", "tarefa_atribuida", "tarefa_sla_vencendo", "tarefa_comentario", "geral"]),
        titulo: z.string(),
        mensagem: z.string(),
        usuarioId: z.number().optional(),
        clienteId: z.number().optional(),
        tarefaId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNotificacao(input as any);
        return { id };
      }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificacaoLida(input.id);
        return { success: true };
      }),
    markAllRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.markAllNotificacoesLidas(ctx.user.id);
        return { success: true };
      }),
  }),

  // ---- TAREFAS ----
  tarefas: router({
    list: protectedProcedure
      .input(z.object({
        setorId: z.number().optional(),
        responsavelId: z.number().optional(),
        status: z.string().optional(),
        clienteId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listTarefas(input || {});
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const tarefa = await db.getTarefaById(input.id);
        if (!tarefa) return null;
        const subtarefas = await db.getSubtarefas(input.id);
        const comentarios = await db.listComentarios(input.id);
        const files = await db.listArquivos('tarefa', input.id);
        return { ...tarefa, subtarefas, comentarios, arquivos: files };
      }),
    create: protectedProcedure
      .input(z.object({
        titulo: z.string().min(1),
        descricao: z.string().optional(),
        tipo: z.enum(["tarefa", "bug", "melhoria", "reuniao", "documento", "outro"]).optional(),
        status: z.enum(["backlog", "a_fazer", "em_andamento", "revisao", "concluido", "cancelado"]).optional(),
        prioridade: z.enum(["urgente", "alta", "media", "baixa"]).optional(),
        setorId: z.number().nullable().optional(),
        responsavelId: z.number().nullable().optional(),
        clienteId: z.number().nullable().optional(),
        tarefaPaiId: z.number().nullable().optional(),
        dataVencimento: z.string().nullable().optional(),
        slaHoras: z.number().nullable().optional(),
        tags: z.array(z.string()).optional(),
        setoresEnvolvidos: z.array(z.number()).optional(),
        estimativaHoras: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const codigo = await db.getNextTarefaCodigo();
        const data: any = {
          ...input,
          codigo,
          criadorId: ctx.user.id,
          dataInicio: new Date(),
          dataVencimento: input.dataVencimento ? new Date(input.dataVencimento) : null,
        };
        const id = await db.createTarefa(data);
        await logAudit('criar', 'tarefa', id, input.titulo, ctx);

        // Notify responsible user
        if (input.responsavelId && input.responsavelId !== ctx.user.id) {
          await db.createNotificacao({
            tipo: 'tarefa_atribuida',
            titulo: `Nova tarefa atribuída: ${input.titulo}`,
            mensagem: `A tarefa ${codigo} - "${input.titulo}" foi atribuída a você por ${ctx.user.name}.`,
            usuarioId: input.responsavelId,
            tarefaId: id,
          } as any);
        }
        return { id, codigo };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input, ctx }) => {
        if (input.data.dataVencimento && typeof input.data.dataVencimento === 'string') {
          input.data.dataVencimento = new Date(input.data.dataVencimento);
        }
        if (input.data.status === 'concluido') {
          input.data.dataConclusao = new Date();
          input.data.progresso = 100;
        }
        await db.updateTarefa(input.id, input.data as any);
        await logAudit('editar', 'tarefa', input.id, null, ctx, input.data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteTarefa(input.id);
        await logAudit('excluir', 'tarefa', input.id, null, ctx);
        return { success: true };
      }),
    addComment: protectedProcedure
      .input(z.object({
        tarefaId: z.number(),
        conteudo: z.string().min(1),
        mencoes: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createComentario({
          tarefaId: input.tarefaId,
          autorId: ctx.user.id,
          autorNome: ctx.user.name || 'Usuário',
          conteudo: input.conteudo,
          mencoes: input.mencoes || [],
        } as any);
        await logAudit('comentar', 'tarefa', input.tarefaId, null, ctx);

        // Notify mentioned users
        if (input.mencoes && input.mencoes.length > 0) {
          for (const userId of input.mencoes) {
            if (userId !== ctx.user.id) {
              await db.createNotificacao({
                tipo: 'tarefa_comentario',
                titulo: `Você foi mencionado em um comentário`,
                mensagem: `${ctx.user.name} mencionou você em um comentário na tarefa.`,
                usuarioId: userId,
                tarefaId: input.tarefaId,
              } as any);
            }
          }
        }
        return { id };
      }),
  }),

  // ---- ARQUIVOS ----
  arquivos: router({
    list: protectedProcedure
      .input(z.object({
        entidadeTipo: z.string().optional(),
        entidadeId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listArquivos(input?.entidadeTipo, input?.entidadeId);
      }),
    upload: protectedProcedure
      .input(z.object({
        nome: z.string(),
        nomeOriginal: z.string(),
        mimeType: z.string(),
        tamanhoBytes: z.number(),
        base64Data: z.string(),
        entidadeTipo: z.enum(["cliente", "tarefa", "tese", "parceiro", "relatorio", "geral"]),
        entidadeId: z.number().nullable().optional(),
        descricao: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.base64Data, 'base64');
        const suffix = crypto.randomBytes(4).toString('hex');
        const key = `evox-fiscal/files/${input.entidadeTipo}/${input.entidadeId || 'geral'}/${suffix}-${input.nome}`;

        const { url } = await storagePut(key, buffer, input.mimeType);

        const id = await db.createArquivo({
          nome: input.nome,
          nomeOriginal: input.nomeOriginal,
          mimeType: input.mimeType,
          tamanhoBytes: input.tamanhoBytes,
          storageKey: key,
          storageUrl: url,
          entidadeTipo: input.entidadeTipo,
          entidadeId: input.entidadeId,
          descricao: input.descricao,
          tags: input.tags,
          uploadPorId: ctx.user.id,
          uploadPorNome: ctx.user.name || 'Usuário',
        } as any);

        await logAudit('upload', input.entidadeTipo, input.entidadeId ?? null, input.nomeOriginal, ctx);
        return { id, url, key };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteArquivo(input.id);
        await logAudit('excluir', 'arquivo', input.id, null, ctx);
        return { success: true };
      }),
  }),

  // ---- AUDIT LOG ----
  audit: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        entidadeTipo: z.string().optional(),
        entidadeId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listAuditLog(input?.limit || 100, input?.entidadeTipo, input?.entidadeId);
      }),
  }),

  // ---- API KEYS ----
  apiKeys: router({
    list: adminProcedure.query(async () => {
      return db.listApiKeys();
    }),
    create: adminProcedure
      .input(z.object({
        nome: z.string().min(1),
        descricao: z.string().optional(),
        permissoes: z.array(z.string()).optional(),
        expiresAt: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const chave = `evx_${crypto.randomBytes(24).toString('hex')}`;
        const id = await db.createApiKey({
          nome: input.nome,
          chave,
          descricao: input.descricao,
          permissoes: input.permissoes || ['clientes:read', 'tarefas:read'],
          criadoPorId: ctx.user.id,
          criadoPorNome: ctx.user.name || 'Admin',
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        } as any);
        await logAudit('criar', 'api_key', id, input.nome, ctx);
        return { id, chave };
      }),
    toggleActive: adminProcedure
      .input(z.object({ id: z.number(), ativo: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await db.updateApiKey(input.id, { ativo: input.ativo });
        await logAudit(input.ativo ? 'ativar' : 'inativar', 'api_key', input.id, null, ctx);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteApiKey(input.id);
        await logAudit('excluir', 'api_key', input.id, null, ctx);
        return { success: true };
      }),
  }),

  // ---- DASHBOARD ----
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
  }),

  // ---- SERVIÇOS POR SETOR ----
  servicos: router({
    list: protectedProcedure
      .input(z.object({ setorId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listServicos(input?.setorId);
      }),
    create: adminProcedure
      .input(z.object({
        nome: z.string().min(1),
        descricao: z.string().optional(),
        setorId: z.number(),
        percentualHonorariosComercial: z.string().optional(),
        percentualHonorariosCliente: z.string().optional(),
        formaCobrancaHonorarios: z.enum([
          'percentual_credito', 'valor_fixo', 'mensalidade', 'exito', 'hibrido',
          'entrada_exito', 'valor_fixo_parcelado'
        ]).optional(),
        valorFixo: z.string().optional(),
        valorEntrada: z.string().optional(),
        percentualExito: z.string().optional(),
        quantidadeParcelas: z.number().optional(),
        valorParcela: z.string().optional(),
        comissaoPadraoDiamante: z.string().optional(),
        comissaoPadraoOuro: z.string().optional(),
        comissaoPadraoPrata: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const cleanStr = (v?: string) => v && v.trim() !== '' ? v : null;
        const cleanInput = {
          ...input,
          valorFixo: cleanStr(input.valorFixo),
          valorEntrada: cleanStr(input.valorEntrada),
          percentualExito: cleanStr(input.percentualExito),
          valorParcela: cleanStr(input.valorParcela),
          percentualHonorariosComercial: cleanStr(input.percentualHonorariosComercial) || '0',
          percentualHonorariosCliente: cleanStr(input.percentualHonorariosCliente) || '0',
          comissaoPadraoDiamante: cleanStr(input.comissaoPadraoDiamante),
          comissaoPadraoOuro: cleanStr(input.comissaoPadraoOuro),
          comissaoPadraoPrata: cleanStr(input.comissaoPadraoPrata),
        };
        const id = await db.createServico(cleanInput as any) as number;
        if (!id) throw new Error('Erro ao criar serviço');
        // Sincronizar comissões com tabela comissoes_servico
        const modelos = await db.listModelosParceria();
        for (const modelo of modelos) {
          const modeloId = modelo.id as number;
          if (!modeloId) continue;
          const nomeNorm = modelo.nome?.toLowerCase();
          let pct = '0';
          if (nomeNorm?.includes('diamante') && cleanInput.comissaoPadraoDiamante) pct = cleanInput.comissaoPadraoDiamante;
          else if (nomeNorm?.includes('ouro') && cleanInput.comissaoPadraoOuro) pct = cleanInput.comissaoPadraoOuro;
          else if (nomeNorm?.includes('prata') && cleanInput.comissaoPadraoPrata) pct = cleanInput.comissaoPadraoPrata;
          if (pct !== '0') {
            await db.upsertComissaoServico(id, modeloId, pct);
          }
        }
        await logAudit('criar', 'servico', id, input.nome, ctx);
        return { id };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateServico(input.id, input.data as any);
        // Sincronizar comissões se campos de comissão foram alterados
        const d = input.data;
        if (d.comissaoPadraoDiamante !== undefined || d.comissaoPadraoOuro !== undefined || d.comissaoPadraoPrata !== undefined) {
          const modelos = await db.listModelosParceria();
          for (const modelo of modelos) {
            const modeloId = modelo.id as number;
            if (!modeloId) continue;
            const nomeNorm = modelo.nome?.toLowerCase();
            let pct: string | null = null;
            if (nomeNorm?.includes('diamante') && d.comissaoPadraoDiamante) pct = d.comissaoPadraoDiamante;
            else if (nomeNorm?.includes('ouro') && d.comissaoPadraoOuro) pct = d.comissaoPadraoOuro;
            else if (nomeNorm?.includes('prata') && d.comissaoPadraoPrata) pct = d.comissaoPadraoPrata;
            if (pct) {
              await db.upsertComissaoServico(input.id, modeloId, pct);
            }
          }
        }
        await logAudit('editar', 'servico', input.id, null, ctx, input.data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteServico(input.id);
        await logAudit('excluir', 'servico', input.id, null, ctx);
        return { success: true };
      }),
    toggleActive: adminProcedure
      .input(z.object({ id: z.number(), ativo: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await db.updateServico(input.id, { ativo: input.ativo } as any);
        await logAudit(input.ativo ? 'ativar' : 'inativar', 'servico', input.id, null, ctx);
        return { success: true };
      }),
  }),

  // ---- SETOR CONFIG ----
  setorConfig: router({
    list: protectedProcedure.query(async () => {
      return db.listSetorConfigs();
    }),
    getBySetorId: protectedProcedure
      .input(z.object({ setorId: z.number() }))
      .query(async ({ input }) => {
        return db.getSetorConfigBySetorId(input.setorId);
      }),
    getBySigla: protectedProcedure
      .input(z.object({ sigla: z.string() }))
      .query(async ({ input }) => {
        return db.getSetorConfigBySigla(input.sigla);
      }),
  }),

  // ---- BUSCA GLOBAL ----
  busca: router({
    global: protectedProcedure
      .input(z.object({ termo: z.string().min(2) }))
      .query(async ({ input }) => {
        return db.buscaGlobal(input.termo);
      }),
  }),

  // ---- PERFIL DE USUÁRIO ----
  perfil: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return ctx.user;
    }),
    update: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        apelido: z.string().optional(),
        cpf: z.string().optional(),
        cargo: z.string().optional(),
        telefone: z.string().optional(),
        avatar: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUser(ctx.user.id, input as any);
        await logAudit('editar', 'usuario', ctx.user.id, ctx.user.name, ctx, { campo: 'perfil' });
        return { success: true };
      }),
    uploadAvatar: protectedProcedure
      .input(z.object({ base64Data: z.string(), mimeType: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.base64Data, 'base64');
        const suffix = crypto.randomBytes(4).toString('hex');
        const key = `evox-fiscal/avatars/${ctx.user.id}-${suffix}.jpg`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await db.updateUser(ctx.user.id, { avatar: url });
        return { url };
      }),
  }),

  // ---- MODELOS DE PARCERIA ----
  modelosParceria: router({
    list: protectedProcedure.query(async () => {
      return db.listModelosParceria();
    }),
    create: adminProcedure
      .input(z.object({
        nome: z.string().min(1),
        descricao: z.string().optional(),
        cor: z.string().optional(),
        percentualComissaoPadrao: z.string().optional(),
        beneficios: z.any().optional(),
        ordem: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createModeloParceria(input as any);
        await logAudit('criar', 'modelo_parceria', id, input.nome, ctx);
        return { id };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateModeloParceria(input.id, input.data as any);
        await logAudit('editar', 'modelo_parceria', input.id, null, ctx, input.data);
        return { success: true };
      }),
  }),

  // ---- COMISSÕES POR SERVIÇO ----
  comissoes: router({
    byServico: protectedProcedure
      .input(z.object({ servicoId: z.number() }))
      .query(async ({ input }) => {
        return db.listComissoesByServico(input.servicoId);
      }),
    byModelo: protectedProcedure
      .input(z.object({ modeloParceriaId: z.number() }))
      .query(async ({ input }) => {
        return db.listComissoesByModelo(input.modeloParceriaId);
      }),
    upsert: adminProcedure
      .input(z.object({
        servicoId: z.number(),
        modeloParceriaId: z.number(),
        percentualComissao: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertComissaoServico(input.servicoId, input.modeloParceriaId, input.percentualComissao);
        await logAudit('editar', 'comissao', null, null, ctx, input);
        return { success: true };
      }),
  }),

  // ---- PARCEIRO-SERVIÇO ----
  parceiroServicos: router({
    list: protectedProcedure
      .input(z.object({ parceiroId: z.number() }))
      .query(async ({ input }) => {
        return db.listParceiroServicos(input.parceiroId);
      }),
    add: protectedProcedure
      .input(z.object({
        parceiroId: z.number(),
        servicoId: z.number(),
        clienteId: z.number().nullable().optional(),
        valorContrato: z.string().optional(),
        percentualComissao: z.string().optional(),
        status: z.enum(['ativo', 'concluido', 'cancelado']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.addParceiroServico(input as any);
        await logAudit('criar', 'parceiro_servico', id, null, ctx);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateParceiroServico(input.id, input.data as any);
        await logAudit('editar', 'parceiro_servico', input.id, null, ctx);
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.removeParceiroServico(input.id);
        await logAudit('excluir', 'parceiro_servico', input.id, null, ctx);
        return { success: true };
      }),
  }),

  // ---- SLA CONFIGURAÇÕES ----
  slaConfig: router({
    list: protectedProcedure
      .input(z.object({ setorId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listSlaConfiguracoes(input?.setorId);
      }),
    create: adminProcedure
      .input(z.object({
        nome: z.string().min(1),
        setorId: z.number().nullable().optional(),
        servicoId: z.number().nullable().optional(),
        prioridadePadrao: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
        slaHorasPadrao: z.number(),
        slaHorasAlerta: z.number().optional(),
        autoAtribuir: z.boolean().optional(),
        responsavelPadraoId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createSlaConfiguracao(input as any);
        await logAudit('criar', 'sla_config', id, input.nome, ctx);
        return { id };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateSlaConfiguracao(input.id, input.data as any);
        await logAudit('editar', 'sla_config', input.id, null, ctx);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteSlaConfiguracao(input.id);
        await logAudit('excluir', 'sla_config', input.id, null, ctx);
        return { success: true };
      }),
  }),

  // ---- ETAPAS DE SERVIÇO ----
  servicoEtapas: router({
    list: protectedProcedure
      .input(z.object({ servicoId: z.number() }))
      .query(async ({ input }) => {
        return db.listServicoEtapas(input.servicoId);
      }),
    create: adminProcedure
      .input(z.object({
        servicoId: z.number(),
        nome: z.string().min(1),
        descricao: z.string().optional(),
        ordem: z.number(),
        setorResponsavelId: z.number().nullable().optional(),
        slaHoras: z.number().nullable().optional(),
        obrigatoria: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createServicoEtapa(input as any);
        await logAudit('criar', 'servico_etapa', id, input.nome, ctx);
        return { id };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateServicoEtapa(input.id, input.data as any);
        await logAudit('editar', 'servico_etapa', input.id, null, ctx);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteServicoEtapa(input.id);
        await logAudit('excluir', 'servico_etapa', input.id, null, ctx);
        return { success: true };
      }),
  }),

  // ---- CLIENTE-SERVIÇO ----
  clienteServicos: router({
    list: protectedProcedure
      .input(z.object({ clienteId: z.number() }))
      .query(async ({ input }) => {
        return db.listClienteServicos(input.clienteId);
      }),
    add: protectedProcedure
      .input(z.object({
        clienteId: z.number(),
        servicoId: z.number(),
        parceiroId: z.number().nullable().optional(),
        valorContrato: z.string().optional(),
        percentualHonorarios: z.string().optional(),
        formaCobranca: z.string().optional(),
        dataInicio: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.addClienteServico(input as any);
        await logAudit('criar', 'cliente_servico', id, null, ctx);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input, ctx }) => {
        await db.updateClienteServico(input.id, input.data as any);
        await logAudit('editar', 'cliente_servico', input.id, null, ctx);
        return { success: true };
      }),
  }),

  // ---- SUBPARCEIROS ----
  subparceiros: router({
    list: protectedProcedure
      .input(z.object({ parceiroPaiId: z.number() }))
      .query(async ({ input }) => {
        return db.listSubparceiros(input.parceiroPaiId);
      }),
  }),

  // ---- SEED ----
  seed: router({
    teses: protectedProcedure.mutation(async () => {
      const existingTeses = await db.listTeses();
      if (existingTeses.length > 0) return { message: 'Teses já existem', count: existingTeses.length };
      const teseSeedData = getTeseSeedData();
      for (const tese of teseSeedData) {
        await db.createTese(tese as any);
      }
      return { message: 'Teses criadas com sucesso', count: teseSeedData.length };
    }),
    setoresEvox: adminProcedure.mutation(async () => {
      await db.seedSetoresEvox();
      return { message: 'Setores da Evox criados/atualizados com sucesso' };
    }),
    testData: adminProcedure.mutation(async ({ ctx }) => {
      // Seed 6 setores
      const setorData = [
        { nome: 'Diretoria', descricao: 'Diretoria Executiva', cor: '#0A2540', icone: 'Crown' },
        { nome: 'Fiscal/Tributário', descricao: 'Análise e consultoria tributária', cor: '#3B82F6', icone: 'Scale' },
        { nome: 'Comercial', descricao: 'Vendas e parcerias', cor: '#10B981', icone: 'Handshake' },
        { nome: 'Jurídico', descricao: 'Departamento jurídico', cor: '#8B5CF6', icone: 'Gavel' },
        { nome: 'Suporte', descricao: 'Suporte ao cliente', cor: '#F59E0B', icone: 'HeadphonesIcon' },
        { nome: 'Tecnologia', descricao: 'TI e desenvolvimento', cor: '#EC4899', icone: 'Code' },
      ];
      const setorIds: number[] = [];
      for (const s of setorData) {
        const id = await db.createSetor(s as any);
        if (id) setorIds.push(id);
      }

      // Seed 5 parceiros
      const parceiroData = [
        { nomeCompleto: 'Carlos Alberto Mendes', cpfCnpj: '123.456.789-00', telefone: '(11) 99876-5432', email: 'carlos.mendes@parceiro.com.br' },
        { nomeCompleto: 'Escritório Contábil Progresso LTDA', cpfCnpj: '12.345.678/0001-90', telefone: '(21) 3456-7890', email: 'contato@progresso.com.br' },
        { nomeCompleto: 'Ana Paula Ferreira', cpfCnpj: '987.654.321-00', telefone: '(31) 98765-4321', email: 'ana.ferreira@parceiro.com.br' },
        { nomeCompleto: 'Consultoria Tributária Nacional S/A', cpfCnpj: '98.765.432/0001-10', telefone: '(41) 3210-9876', email: 'contato@ctn.com.br' },
        { nomeCompleto: 'Roberto Silva Advogados', cpfCnpj: '45.678.901/0001-23', telefone: '(51) 3333-4444', email: 'roberto@silvaadvogados.com.br' },
      ];
      const parceiroIds: number[] = [];
      for (const p of parceiroData) {
        const id = await db.createParceiro(p as any);
        if (id) parceiroIds.push(id);
      }

      // Seed 5 clientes
      const clienteData = [
        {
          cnpj: '12.345.678/0001-95', razaoSocial: 'Indústria Metalúrgica São Paulo LTDA', nomeFantasia: 'MetalSP',
          regimeTributario: 'lucro_real' as const, situacaoCadastral: 'ativa' as const, estado: 'SP', cnaePrincipal: '2599-3/99',
          cnaePrincipalDescricao: 'Fabricação de produtos de metal', dataAbertura: '2015-03-15',
          industrializa: true, comercializa: true, contribuinteICMS: true, contribuinteIPI: true,
          faturamentoMedioMensal: '850000', valorMedioGuias: '120000', folhaPagamentoMedia: '280000',
          parceiroId: parceiroIds[0] || null, procuracaoHabilitada: true, procuracaoCertificado: 'e-CNPJ A3',
          procuracaoValidade: '2027-06-30', usuarioCadastroId: ctx.user.id, usuarioCadastroNome: ctx.user.name || 'Admin',
        },
        {
          cnpj: '23.456.789/0001-01', razaoSocial: 'Comércio Varejista Digital LTDA', nomeFantasia: 'DigiStore',
          regimeTributario: 'lucro_presumido' as const, situacaoCadastral: 'ativa' as const, estado: 'RJ', cnaePrincipal: '4751-2/01',
          cnaePrincipalDescricao: 'Comércio varejista de equipamentos de informática', dataAbertura: '2019-08-20',
          comercializa: true, contribuinteICMS: true, prestaServicos: true,
          faturamentoMedioMensal: '420000', valorMedioGuias: '55000', folhaPagamentoMedia: '95000',
          parceiroId: parceiroIds[1] || null, procuracaoHabilitada: true, procuracaoCertificado: 'e-CNPJ A1',
          procuracaoValidade: '2026-12-31', usuarioCadastroId: ctx.user.id, usuarioCadastroNome: ctx.user.name || 'Admin',
        },
        {
          cnpj: '34.567.890/0001-12', razaoSocial: 'Tech Solutions Consultoria em TI S/A', nomeFantasia: 'TechSol',
          regimeTributario: 'lucro_real' as const, situacaoCadastral: 'ativa' as const, estado: 'MG', cnaePrincipal: '6201-5/01',
          cnaePrincipalDescricao: 'Desenvolvimento de programas de computador sob encomenda', dataAbertura: '2012-01-10',
          prestaServicos: true, contribuinteICMS: false,
          faturamentoMedioMensal: '1200000', valorMedioGuias: '180000', folhaPagamentoMedia: '520000',
          parceiroId: parceiroIds[2] || null, procuracaoHabilitada: true, procuracaoCertificado: 'e-CNPJ A3',
          procuracaoValidade: '2027-03-15', usuarioCadastroId: ctx.user.id, usuarioCadastroNome: ctx.user.name || 'Admin',
        },
        {
          cnpj: '45.678.901/0001-23', razaoSocial: 'Farmácia Popular Saúde LTDA', nomeFantasia: 'FarmaPopular',
          regimeTributario: 'simples_nacional' as const, situacaoCadastral: 'ativa' as const, estado: 'BA', cnaePrincipal: '4771-7/01',
          cnaePrincipalDescricao: 'Comércio varejista de produtos farmacêuticos', dataAbertura: '2020-06-01',
          comercializa: true, regimeMonofasico: true,
          faturamentoMedioMensal: '180000', valorMedioGuias: '15000', folhaPagamentoMedia: '45000',
          parceiroId: parceiroIds[3] || null, procuracaoHabilitada: false,
          usuarioCadastroId: ctx.user.id, usuarioCadastroNome: ctx.user.name || 'Admin',
        },
        {
          cnpj: '56.789.012/0001-34', razaoSocial: 'Transportadora Rápida Express LTDA', nomeFantasia: 'RápidaExpress',
          regimeTributario: 'lucro_presumido' as const, situacaoCadastral: 'ativa' as const, estado: 'PR', cnaePrincipal: '4930-2/02',
          cnaePrincipalDescricao: 'Transporte rodoviário de carga', dataAbertura: '2018-11-05',
          prestaServicos: true, contribuinteICMS: true,
          faturamentoMedioMensal: '650000', valorMedioGuias: '85000', folhaPagamentoMedia: '210000',
          processosJudiciaisAtivos: true,
          parceiroId: parceiroIds[4] || null, procuracaoHabilitada: true, procuracaoCertificado: 'e-CNPJ A1',
          procuracaoValidade: '2025-09-30', usuarioCadastroId: ctx.user.id, usuarioCadastroNome: ctx.user.name || 'Admin',
        },
      ];
      const clienteIds: number[] = [];
      for (const c of clienteData) {
        const id = await db.createCliente(c as any);
        if (id) {
          clienteIds.push(id);
          await db.createFilaItem({ clienteId: id, status: 'a_fazer' } as any);
        }
      }

      // Seed some tarefas
      const tarefaData = [
        { titulo: 'Análise tributária completa - MetalSP', descricao: 'Realizar análise completa de oportunidades tributárias para Indústria Metalúrgica São Paulo', tipo: 'tarefa' as const, prioridade: 'alta' as const, setorId: setorIds[1] || null, clienteId: clienteIds[0] || null, slaHoras: 48, tags: ['análise', 'urgente'] },
        { titulo: 'Revisão de procuração - RápidaExpress', descricao: 'Procuração vencida. Solicitar renovação ao cliente.', tipo: 'tarefa' as const, prioridade: 'urgente' as const, setorId: setorIds[1] || null, clienteId: clienteIds[4] || null, slaHoras: 24, tags: ['procuração', 'vencida'] },
        { titulo: 'Proposta comercial - TechSol', descricao: 'Elaborar proposta comercial para consultoria tributária', tipo: 'documento' as const, prioridade: 'media' as const, setorId: setorIds[2] || null, clienteId: clienteIds[2] || null, slaHoras: 72, tags: ['comercial', 'proposta'] },
        { titulo: 'Reunião de alinhamento semanal', descricao: 'Reunião semanal da equipe fiscal para alinhamento de demandas', tipo: 'reuniao' as const, prioridade: 'media' as const, setorId: setorIds[1] || null, slaHoras: 168, tags: ['reunião', 'semanal'] },
        { titulo: 'Implementar dashboard de métricas', descricao: 'Criar dashboard com KPIs de performance da equipe', tipo: 'melhoria' as const, prioridade: 'baixa' as const, setorId: setorIds[5] || null, slaHoras: 120, tags: ['tech', 'dashboard'] },
      ];
      for (const t of tarefaData) {
        const codigo = await db.getNextTarefaCodigo();
        await db.createTarefa({ ...t, codigo, criadorId: ctx.user.id, dataInicio: new Date() } as any);
      }

      // Also seed Evox setores
      await db.seedSetoresEvox();

      return {
        message: 'Dados de teste criados com sucesso',
        setores: setorIds.length,
        parceiros: parceiroIds.length,
        clientes: clienteIds.length,
        tarefas: tarefaData.length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

function getTeseSeedData() {
  return [
    { nome: "Exclusão do ICMS da Base de Cálculo do PIS/COFINS", tributoEnvolvido: "PIS/COFINS", tipo: "exclusao_base" as const, classificacao: "pacificada" as const, potencialFinanceiro: "muito_alto" as const, potencialMercadologico: "muito_alto" as const, requisitosObjetivos: ["Contribuinte de ICMS", "Apuração de PIS/COFINS com ICMS na base"], requisitosImpeditivos: ["Simples Nacional", "Empresa isenta de ICMS"], fundamentacaoLegal: "RE 574.706/PR — STF (Tema 69). O ICMS não compõe a base de cálculo do PIS e da COFINS.", jurisprudenciaRelevante: "STF, RE 574.706/PR, Tema 69 de Repercussão Geral. Modulação: efeitos a partir de 15/03/2017.", parecerTecnicoJuridico: "Tese pacificada pelo STF com repercussão geral. O ICMS destacado na nota fiscal não integra o faturamento da empresa, sendo mero repasse ao Estado. Aplicável a todos os contribuintes de ICMS que apuram PIS/COFINS pelo regime não-cumulativo ou cumulativo. Risco jurídico baixo após modulação. Recomenda-se ação judicial para recuperação dos últimos 5 anos.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: true, viaAdministrativa: false, grauRisco: "baixo" as const, documentosNecessarios: ["SPED Fiscal", "EFD Contribuições", "DCTF", "Notas Fiscais"], formulaEstimativaCredito: "ICMS destacado × alíquota PIS/COFINS × meses", aplicavelComercio: true, aplicavelIndustria: true, aplicavelServico: false, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: false, aplicavelLucroReal: true, aplicavelLucroPresumido: true, aplicavelSimplesNacional: false },
    { nome: "Exclusão do ISS da Base de Cálculo do PIS/COFINS", tributoEnvolvido: "PIS/COFINS", tipo: "exclusao_base" as const, classificacao: "judicial" as const, potencialFinanceiro: "alto" as const, potencialMercadologico: "alto" as const, requisitosObjetivos: ["Prestador de serviços", "Contribuinte de ISS"], requisitosImpeditivos: ["Simples Nacional"], fundamentacaoLegal: "RE 592.616 — STF (Tema 118). Analogia com a tese do ICMS (RE 574.706).", jurisprudenciaRelevante: "STF reconheceu repercussão geral. Decisões favoráveis em TRFs.", parecerTecnicoJuridico: "Tese em fase judicial avançada. Segue a mesma lógica da exclusão do ICMS da base do PIS/COFINS. O ISS, assim como o ICMS, não constitui receita ou faturamento da empresa. Risco médio — aguarda julgamento definitivo pelo STF.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: true, viaAdministrativa: false, grauRisco: "medio" as const, documentosNecessarios: ["EFD Contribuições", "Notas Fiscais de Serviço", "Guias ISS"], formulaEstimativaCredito: "ISS recolhido × alíquota PIS/COFINS × meses", aplicavelComercio: false, aplicavelIndustria: false, aplicavelServico: true, aplicavelContribuinteICMS: false, aplicavelContribuinteIPI: false, aplicavelLucroReal: true, aplicavelLucroPresumido: true, aplicavelSimplesNacional: false },
    { nome: "Recuperação de PIS/COFINS Monofásico", tributoEnvolvido: "PIS/COFINS", tipo: "recuperacao_indebito" as const, classificacao: "pacificada" as const, potencialFinanceiro: "alto" as const, potencialMercadologico: "muito_alto" as const, requisitosObjetivos: ["Revenda de produtos monofásicos", "Regime Simples Nacional ou Lucro Presumido"], requisitosImpeditivos: ["Empresa industrial do produto monofásico"], fundamentacaoLegal: "Lei 10.147/2000, Lei 10.485/2002. ADI 4.254 — STF.", jurisprudenciaRelevante: "Tema 1.093 STJ. Pacificado que revendedores não devem pagar PIS/COFINS sobre produtos monofásicos.", parecerTecnicoJuridico: "Tese pacificada. Empresas do Simples Nacional e Lucro Presumido que revendem produtos sujeitos ao regime monofásico (combustíveis, farmacêuticos, autopeças, bebidas) têm direito à exclusão dessas receitas da base de cálculo. Via administrativa disponível.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: false, viaAdministrativa: true, grauRisco: "baixo" as const, documentosNecessarios: ["Notas Fiscais de Entrada", "Notas Fiscais de Saída", "PGDAS-D", "Classificação NCM"], formulaEstimativaCredito: "Receita monofásica × alíquota PIS/COFINS indevida × meses", aplicavelComercio: true, aplicavelIndustria: false, aplicavelServico: false, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: false, aplicavelLucroReal: false, aplicavelLucroPresumido: true, aplicavelSimplesNacional: true },
    { nome: "Exclusão do ICMS-ST da Base de Cálculo do PIS/COFINS", tributoEnvolvido: "PIS/COFINS", tipo: "exclusao_base" as const, classificacao: "judicial" as const, potencialFinanceiro: "alto" as const, potencialMercadologico: "alto" as const, requisitosObjetivos: ["Contribuinte substituído de ICMS-ST", "Apuração PIS/COFINS"], requisitosImpeditivos: ["Simples Nacional", "Não sujeito a ICMS-ST"], fundamentacaoLegal: "RE 574.706 (extensão). Tema 69 do STF aplicado ao ICMS-ST.", jurisprudenciaRelevante: "TRFs têm aplicado a lógica do RE 574.706 ao ICMS-ST. STJ em análise.", parecerTecnicoJuridico: "Extensão da tese do ICMS na base do PIS/COFINS para o ICMS-ST. O contribuinte substituído suporta o ônus do ICMS-ST sem que este integre seu faturamento. Risco médio — jurisprudência favorável nos TRFs, mas sem decisão definitiva do STF/STJ.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: true, viaAdministrativa: false, grauRisco: "medio" as const, documentosNecessarios: ["SPED Fiscal", "XMLs NFe", "Demonstrativo ICMS-ST"], formulaEstimativaCredito: "ICMS-ST suportado × alíquota PIS/COFINS × meses", aplicavelComercio: true, aplicavelIndustria: true, aplicavelServico: false, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: false, aplicavelLucroReal: true, aplicavelLucroPresumido: true, aplicavelSimplesNacional: false },
    { nome: "IRPJ/CSLL sobre Benefícios Fiscais de ICMS", tributoEnvolvido: "IRPJ/CSLL", tipo: "exclusao_base" as const, classificacao: "pacificada" as const, potencialFinanceiro: "muito_alto" as const, potencialMercadologico: "alto" as const, requisitosObjetivos: ["Benefício fiscal de ICMS", "Lucro Real"], requisitosImpeditivos: ["Simples Nacional", "Lucro Presumido", "Sem benefício fiscal de ICMS"], fundamentacaoLegal: "LC 160/2017, Art. 30 da Lei 12.973/2014. EREsp 1.517.492/PR — STJ.", jurisprudenciaRelevante: "STJ pacificou que benefícios fiscais de ICMS não integram a base do IRPJ/CSLL.", parecerTecnicoJuridico: "Tese pacificada pelo STJ. Benefícios fiscais de ICMS concedidos pelos estados não devem compor a base de cálculo do IRPJ e da CSLL, desde que cumpridos os requisitos da LC 160/2017. Risco baixo.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: false, viaAdministrativa: true, grauRisco: "baixo" as const, documentosNecessarios: ["ECF", "Demonstrativo benefícios ICMS", "Decreto estadual do benefício"], formulaEstimativaCredito: "Valor benefício ICMS × alíquota IRPJ/CSLL × meses", aplicavelComercio: true, aplicavelIndustria: true, aplicavelServico: false, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: false, aplicavelLucroReal: true, aplicavelLucroPresumido: false, aplicavelSimplesNacional: false },
    { nome: "Contribuições Previdenciárias sobre Verbas Indenizatórias", tributoEnvolvido: "INSS Patronal", tipo: "recuperacao_indebito" as const, classificacao: "pacificada" as const, potencialFinanceiro: "alto" as const, potencialMercadologico: "muito_alto" as const, requisitosObjetivos: ["Folha de pagamento com verbas indenizatórias", "Pagamento de INSS patronal"], requisitosImpeditivos: ["Sem empregados"], fundamentacaoLegal: "RE 576.967 (STF, Tema 20). Verbas indenizatórias não integram a base do INSS.", jurisprudenciaRelevante: "STF e STJ pacificaram que terço de férias, aviso prévio indenizado e outras verbas indenizatórias não compõem a base do INSS patronal.", parecerTecnicoJuridico: "Tese pacificada. Verbas de natureza indenizatória (1/3 constitucional de férias, aviso prévio indenizado, primeiros 15 dias de afastamento por doença) não integram a base de cálculo das contribuições previdenciárias patronais. Aplicável a todas as empresas com folha de pagamento.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: false, viaAdministrativa: true, grauRisco: "baixo" as const, documentosNecessarios: ["Folha de Pagamento", "GFIP/eSocial", "Recibos de férias", "Termos de rescisão"], formulaEstimativaCredito: "Verbas indenizatórias × 20% (patronal) × meses", aplicavelComercio: true, aplicavelIndustria: true, aplicavelServico: true, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: true, aplicavelLucroReal: true, aplicavelLucroPresumido: true, aplicavelSimplesNacional: false },
    { nome: "Exclusão do PIS/COFINS da Própria Base de Cálculo", tributoEnvolvido: "PIS/COFINS", tipo: "exclusao_base" as const, classificacao: "controversa" as const, potencialFinanceiro: "muito_alto" as const, potencialMercadologico: "medio" as const, requisitosObjetivos: ["Apuração de PIS/COFINS"], requisitosImpeditivos: ["Simples Nacional"], fundamentacaoLegal: "Extensão da tese do ICMS (RE 574.706). O PIS/COFINS não é receita da empresa.", jurisprudenciaRelevante: "Tese em discussão nos TRFs. Decisões divergentes.", parecerTecnicoJuridico: "Tese controversa baseada na mesma lógica do RE 574.706. Argumenta que o PIS e a COFINS incluídos no preço não constituem faturamento. Alto potencial financeiro mas risco elevado. Recomendada apenas para clientes com perfil agressivo.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: true, viaAdministrativa: false, grauRisco: "alto" as const, documentosNecessarios: ["EFD Contribuições", "DCTF", "Demonstrativo de cálculo"], formulaEstimativaCredito: "PIS/COFINS recolhido × alíquota efetiva × meses", aplicavelComercio: true, aplicavelIndustria: true, aplicavelServico: true, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: true, aplicavelLucroReal: true, aplicavelLucroPresumido: true, aplicavelSimplesNacional: false },
    { nome: "Créditos de PIS/COFINS sobre Insumos (Conceito Amplo)", tributoEnvolvido: "PIS/COFINS", tipo: "credito_presumido" as const, classificacao: "pacificada" as const, potencialFinanceiro: "alto" as const, potencialMercadologico: "alto" as const, requisitosObjetivos: ["Lucro Real", "Regime não-cumulativo", "Gastos com insumos"], requisitosImpeditivos: ["Simples Nacional", "Lucro Presumido"], fundamentacaoLegal: "REsp 1.221.170/PR — STJ (Tema 779). Conceito amplo de insumo.", jurisprudenciaRelevante: "STJ definiu que insumo é tudo essencial ou relevante para a atividade da empresa.", parecerTecnicoJuridico: "Tese pacificada pelo STJ. O conceito de insumo para fins de crédito de PIS/COFINS deve ser aferido à luz dos critérios de essencialidade ou relevância para a atividade econômica. Inclui EPIs, materiais de limpeza em indústrias alimentícias, fretes, entre outros.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: false, viaAdministrativa: true, grauRisco: "baixo" as const, documentosNecessarios: ["EFD Contribuições", "Notas Fiscais de entrada", "Demonstrativo de créditos"], formulaEstimativaCredito: "Insumos não creditados × alíquota PIS/COFINS × meses", aplicavelComercio: false, aplicavelIndustria: true, aplicavelServico: true, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: true, aplicavelLucroReal: true, aplicavelLucroPresumido: false, aplicavelSimplesNacional: false },
    { nome: "Limite de 20 Salários para Contribuições ao Sistema S", tributoEnvolvido: "Contribuições Terceiros", tipo: "tese_judicial" as const, classificacao: "judicial" as const, potencialFinanceiro: "alto" as const, potencialMercadologico: "alto" as const, requisitosObjetivos: ["Folha de pagamento acima de 20 salários mínimos", "Pagamento de contribuições ao Sistema S"], requisitosImpeditivos: ["Simples Nacional"], fundamentacaoLegal: "Art. 4º, parágrafo único, da Lei 6.950/81. Tema 1.079 — STJ.", jurisprudenciaRelevante: "STJ analisando o tema. TRFs com decisões divergentes.", parecerTecnicoJuridico: "Tese judicial em análise pelo STJ. Defende que a base de cálculo das contribuições ao Sistema S está limitada a 20 salários mínimos, conforme Lei 6.950/81. Alto potencial para empresas com folha elevada.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: true, viaAdministrativa: false, grauRisco: "medio" as const, documentosNecessarios: ["Folha de Pagamento", "GFIP/eSocial", "GPS/DARF"], formulaEstimativaCredito: "(Folha total - 20 SM) × alíquotas Sistema S × meses", aplicavelComercio: true, aplicavelIndustria: true, aplicavelServico: true, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: true, aplicavelLucroReal: true, aplicavelLucroPresumido: true, aplicavelSimplesNacional: false },
    { nome: "Recuperação de ICMS Pago a Maior na Substituição Tributária", tributoEnvolvido: "ICMS", tipo: "recuperacao_indebito" as const, classificacao: "pacificada" as const, potencialFinanceiro: "alto" as const, potencialMercadologico: "alto" as const, requisitosObjetivos: ["Contribuinte substituído", "Venda efetiva abaixo da base presumida"], requisitosImpeditivos: ["Não sujeito a ICMS-ST"], fundamentacaoLegal: "RE 593.849 — STF (Tema 201). Direito à restituição do ICMS-ST pago a maior.", jurisprudenciaRelevante: "STF decidiu que é devida a restituição da diferença do ICMS-ST quando a base de cálculo efetiva é inferior à presumida.", parecerTecnicoJuridico: "Tese pacificada pelo STF. Contribuintes substituídos que vendem mercadorias por valor inferior à base presumida da substituição tributária têm direito à restituição da diferença. Aplicável via administrativa na maioria dos estados.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: false, viaAdministrativa: true, grauRisco: "baixo" as const, documentosNecessarios: ["SPED Fiscal", "XMLs NFe", "Demonstrativo base presumida vs efetiva"], formulaEstimativaCredito: "(Base presumida - Base efetiva) × alíquota ICMS × operações", aplicavelComercio: true, aplicavelIndustria: true, aplicavelServico: false, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: false, aplicavelLucroReal: true, aplicavelLucroPresumido: true, aplicavelSimplesNacional: true },
    { nome: "Exclusão do DIFAL da Base de Cálculo do PIS/COFINS", tributoEnvolvido: "PIS/COFINS", tipo: "exclusao_base" as const, classificacao: "judicial" as const, potencialFinanceiro: "medio" as const, potencialMercadologico: "medio" as const, requisitosObjetivos: ["Operações interestaduais com DIFAL", "E-commerce ou vendas interestaduais"], requisitosImpeditivos: ["Simples Nacional", "Sem operações interestaduais"], fundamentacaoLegal: "EC 87/2015. Extensão da lógica do RE 574.706.", jurisprudenciaRelevante: "Tese em construção nos TRFs. Poucas decisões.", parecerTecnicoJuridico: "Tese em fase inicial. Argumenta que o DIFAL nas operações interestaduais não constitui receita e deve ser excluído da base do PIS/COFINS. Risco alto — jurisprudência incipiente.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: true, viaAdministrativa: false, grauRisco: "alto" as const, documentosNecessarios: ["SPED Fiscal", "Demonstrativo DIFAL", "NFe interestaduais"], formulaEstimativaCredito: "DIFAL recolhido × alíquota PIS/COFINS × meses", aplicavelComercio: true, aplicavelIndustria: true, aplicavelServico: false, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: false, aplicavelLucroReal: true, aplicavelLucroPresumido: true, aplicavelSimplesNacional: false },
    { nome: "Recuperação de IPI sobre Revenda de Importados", tributoEnvolvido: "IPI", tipo: "recuperacao_indebito" as const, classificacao: "judicial" as const, potencialFinanceiro: "medio" as const, potencialMercadologico: "medio" as const, requisitosObjetivos: ["Importador que revende produtos", "Pagamento de IPI na importação e na saída"], requisitosImpeditivos: ["Não importador", "Simples Nacional"], fundamentacaoLegal: "RE 946.648 — STF (Tema 906). Discussão sobre dupla incidência do IPI.", jurisprudenciaRelevante: "STF decidiu pela incidência, mas há discussão sobre créditos.", parecerTecnicoJuridico: "Tese judicial em evolução. Embora o STF tenha decidido pela incidência do IPI na saída de importados, há discussão sobre a possibilidade de creditamento integral do IPI pago na importação. Risco médio.", prazoPrescricional: "5 anos", necessidadeAcaoJudicial: true, viaAdministrativa: false, grauRisco: "medio" as const, documentosNecessarios: ["DI/DUIMP", "Notas Fiscais", "SPED Fiscal", "Livro de IPI"], formulaEstimativaCredito: "IPI importação creditável × operações × meses", aplicavelComercio: true, aplicavelIndustria: true, aplicavelServico: false, aplicavelContribuinteICMS: true, aplicavelContribuinteIPI: true, aplicavelLucroReal: true, aplicavelLucroPresumido: true, aplicavelSimplesNacional: false },
  ];
}
