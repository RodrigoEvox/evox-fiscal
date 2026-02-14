import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new Error('Permissão negada: apenas administradores podem realizar esta ação');
  }
  return next({ ctx });
});

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
    updateRole: adminProcedure
      .input(z.object({ id: z.number(), role: z.string(), nivelAcesso: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.id, input.role, input.nivelAcesso);
        return { success: true };
      }),
    toggleActive: adminProcedure
      .input(z.object({ id: z.number(), ativo: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.toggleUserActive(input.id, input.ativo);
        return { success: true };
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
        telefone: z.string().optional(),
        email: z.string().optional(),
        endereco: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createParceiro(input as any);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeCompleto: z.string().optional(),
        cpfCnpj: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().optional(),
        endereco: z.string().optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateParceiro(id, data as any);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteParceiro(input.id);
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
      .mutation(async ({ input }) => {
        const id = await db.createCliente(input as any);
        if (id) {
          await db.createFilaItem({ clienteId: id, status: 'a_fazer' } as any);
        }
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => {
        await db.updateCliente(input.id, input.data as any);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCliente(input.id);
        return { success: true };
      }),
    runAnalise: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const cliente = await db.getClienteById(input.id);
        if (!cliente) throw new Error('Cliente não encontrado');
        const allTeses = await db.listTeses();
        const activeTeses = allTeses.filter(t => t.ativa);

        // Generate RED FLAGS
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

        // Check missing info alerts
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

        // Match teses
        const tesesAplicaveis: any[] = [];
        const tesesDescartadas: any[] = [];
        for (const tese of activeTeses) {
          let aplicavel = true;
          const motivos: string[] = [];
          // Regime check
          if (cliente.regimeTributario === 'lucro_real' && !tese.aplicavelLucroReal) { aplicavel = false; motivos.push('Não aplicável a Lucro Real'); }
          if (cliente.regimeTributario === 'lucro_presumido' && !tese.aplicavelLucroPresumido) { aplicavel = false; motivos.push('Não aplicável a Lucro Presumido'); }
          if (cliente.regimeTributario === 'simples_nacional' && !tese.aplicavelSimplesNacional) { aplicavel = false; motivos.push('Não aplicável a Simples Nacional'); }
          // Activity check
          if (tese.aplicavelComercio && !tese.aplicavelIndustria && !tese.aplicavelServico && !cliente.comercializa) { aplicavel = false; motivos.push('Empresa não comercializa'); }
          if (!tese.aplicavelComercio && tese.aplicavelIndustria && !tese.aplicavelServico && !cliente.industrializa) { aplicavel = false; motivos.push('Empresa não industrializa'); }
          if (!tese.aplicavelComercio && !tese.aplicavelIndustria && tese.aplicavelServico && !cliente.prestaServicos) { aplicavel = false; motivos.push('Empresa não presta serviços'); }
          // ICMS/IPI check
          if (tese.aplicavelContribuinteICMS && !cliente.contribuinteICMS && tese.tributoEnvolvido.includes('ICMS')) { aplicavel = false; motivos.push('Não é contribuinte de ICMS'); }
          if (tese.aplicavelContribuinteIPI && !cliente.contribuinteIPI && tese.tributoEnvolvido.includes('IPI')) { aplicavel = false; motivos.push('Não é contribuinte de IPI'); }
          // Impeditivos
          const impeditivos = Array.isArray(tese.requisitosImpeditivos) ? tese.requisitosImpeditivos : [];
          for (const imp of impeditivos) {
            const impLower = imp.toLowerCase();
            if (impLower.includes('simples') && cliente.regimeTributario === 'simples_nacional') { aplicavel = false; motivos.push(imp); }
            if (impLower.includes('isent') && !cliente.contribuinteICMS) { aplicavel = false; motivos.push(imp); }
          }
          // Estimate value
          const base = Number(cliente.valorMedioGuias || 0);
          const mult = tese.potencialFinanceiro === 'muito_alto' ? 0.15 : tese.potencialFinanceiro === 'alto' ? 0.10 : tese.potencialFinanceiro === 'medio' ? 0.05 : 0.02;
          const valorEstimado = Math.round(base * mult * 100) / 100;
          if (aplicavel) {
            tesesAplicaveis.push({ teseId: tese.id, teseNome: tese.nome, valorEstimado, classificacao: tese.classificacao, tipo: tese.tipo, potencialFinanceiro: tese.potencialFinanceiro, fundamentacao: tese.fundamentacaoLegal?.substring(0, 200) });
          } else {
            tesesDescartadas.push({ teseId: tese.id, teseNome: tese.nome, motivo: motivos.join('; ') });
          }
        }

        // Determine priority
        const hasHighPotentialTeses = tesesAplicaveis.some((t: any) => ['muito_alto', 'alto'].includes(t.potencialFinanceiro));
        const hasNonPriorityFlags = redFlags.some((r: any) => r.impacto === 'nao_prioritario');
        let prioridade: 'alta' | 'media' | 'baixa' = 'media';
        if (hasHighPotentialTeses && !hasNonPriorityFlags) prioridade = 'alta';
        else if (hasNonPriorityFlags && !hasHighPotentialTeses) prioridade = 'baixa';

        const totalValor = tesesAplicaveis.reduce((s: number, t: any) => s + (t.valorEstimado || 0), 0);
        const score = Math.min(100, Math.round((tesesAplicaveis.length / Math.max(activeTeses.length, 1)) * 50 + (totalValor > 50000 ? 50 : (totalValor / 50000) * 50)));

        // Update client
        await db.updateCliente(input.id, { redFlags, alertasInformacao: alertas, prioridade, scoreOportunidade: score });

        // Create report
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
      .mutation(async ({ input }) => {
        const id = await db.createTese(input as any);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => {
        await db.updateTese(input.id, input.data as any);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTese(input.id);
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
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
        const id = await db.createRelatorio(input as any);
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
        tipo: z.enum(["procuracao_vencendo", "procuracao_vencida", "analise_concluida", "nova_tese", "geral"]),
        titulo: z.string(),
        mensagem: z.string(),
        usuarioId: z.number().optional(),
        clienteId: z.number().optional(),
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

  // ---- DASHBOARD ----
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
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
