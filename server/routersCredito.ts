import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import * as credDb from "./dbCredito";
import * as db from "./db";
import { createNotificacao } from "./db";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import crypto from "crypto";

function getUser(ctx: any): { id: number; name: string } {
  return { id: ctx.user.id, name: ctx.user.name };
}

// ===== SUPORTE COMERCIAL / BACKOFFICE =====
const suporteRouter = router({
  // --- Demand Requests ---
  demandRequests: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        parceiroId: z.number().optional(),
        clienteId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.listDemandRequests(input || {});
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return credDb.getDemandRequestById(input.id);
      }),

    stats: protectedProcedure.query(async () => {
      return credDb.getDemandRequestStats();
    }),

    create: protectedProcedure
      .input(z.object({
        origem: z.enum(['parceiro', 'suporte', 'interno']).default('suporte'),
        parceiroId: z.number().nullable().optional(),
        clienteId: z.number().nullable().optional(),
        clienteCnpj: z.string().optional(),
        tipoDemanda: z.enum(['apuracao', 'retificacao', 'compensacao', 'onboarding', 'chamado', 'outro']),
        descricao: z.string().optional(),
        anexos: z.any().optional(),
        urgencia: z.enum(['normal', 'alta', 'urgente']).default('normal'),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        // Calculate SLA deadline (8 business hours = next business day)
        const now = new Date();
        const slaVence = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const result = await credDb.createDemandRequest({
          ...input,
          status: 'triagem',
          slaTriagemHoras: 8,
          slaTriagemVenceEm: slaVence.toISOString().slice(0, 19).replace('T', ' '),
          criadoPorId: user.id,
          criadoPorNome: user.name,
        } as any);
        if (result) {
          await credDb.logCreditAudit({
            entidade: 'demand_request',
            entidadeId: result.id,
            acao: 'criacao',
            descricao: `Demand Request ${result.numero} criada`,
            dadosNovos: input as any,
            usuarioId: user.id,
            usuarioNome: user.name,
          });
        }
        return result;
      }),

    classificar: protectedProcedure
      .input(z.object({
        id: z.number(),
        tipoDemanda: z.enum(['apuracao', 'retificacao', 'compensacao', 'onboarding', 'chamado', 'outro']),
        urgencia: z.enum(['normal', 'alta', 'urgente']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const dr = await credDb.getDemandRequestById(input.id);
        await credDb.updateDemandRequest(input.id, {
          status: 'classificada',
          tipoDemanda: input.tipoDemanda,
          urgencia: input.urgencia || dr?.urgencia,
          classificadoPorId: user.id,
          classificadoEm: new Date().toISOString().slice(0, 19).replace('T', ' '),
        } as any);
        await credDb.logCreditAudit({
          entidade: 'demand_request',
          entidadeId: input.id,
          acao: 'classificacao',
          descricao: `DR classificada como ${input.tipoDemanda}`,
          dadosAnteriores: { status: dr?.status, tipoDemanda: dr?.tipoDemanda } as any,
          dadosNovos: { status: 'classificada', tipoDemanda: input.tipoDemanda } as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),

    rotear: protectedProcedure
      .input(z.object({
        id: z.number(),
        filaDestino: z.enum(['apuracao', 'retificacao', 'compensacao', 'onboarding', 'chamados']),
        criarCase: z.boolean().default(false),
        criarTarefa: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const dr = await credDb.getDemandRequestById(input.id);
        if (!dr) throw new Error('Demand Request não encontrada');

        let caseCriadoId: number | null = null;
        let tarefaCriadaId: number | null = null;

        // Create case if requested
        if (input.criarCase && dr.clienteId) {
          const caseResult = await credDb.createCreditCase({
            clienteId: dr.clienteId,
            parceiroId: dr.parceiroId || undefined,
            fase: 'oportunidade',
            status: 'nda_pendente',
            demandRequestId: dr.id,
          } as any);
          if (caseResult) {
            caseCriadoId = caseResult.id;
            await credDb.logCreditAudit({
              entidade: 'case',
              entidadeId: caseResult.id,
              acao: 'criacao',
              descricao: `Case ${caseResult.numero} criado a partir da DR ${dr.numero}`,
              usuarioId: user.id,
              usuarioNome: user.name,
            });
          }
        }

        // Create task in the destination queue
        if (input.criarTarefa) {
          const taskResult = await credDb.createCreditTask({
            fila: input.filaDestino,
            caseId: caseCriadoId,
            clienteId: dr.clienteId,
            demandRequestId: dr.id,
            titulo: `[${dr.numero}] ${dr.descricao?.slice(0, 100) || dr.tipoDemanda}`,
            descricao: dr.descricao,
            prioridade: dr.urgencia === 'urgente' ? 'urgente' : dr.urgencia === 'alta' ? 'alta' : 'media',
          } as any);
          if (taskResult) tarefaCriadaId = taskResult.id;
        }

        await credDb.updateDemandRequest(input.id, {
          status: 'roteada',
          filaDestino: input.filaDestino,
          roteadoPorId: user.id,
          roteadoEm: new Date().toISOString().slice(0, 19).replace('T', ' '),
          caseCriadoId,
          tarefaCriadaId,
        } as any);

        await credDb.logCreditAudit({
          entidade: 'demand_request',
          entidadeId: input.id,
          acao: 'roteamento',
          descricao: `DR roteada para fila ${input.filaDestino}`,
          dadosNovos: { filaDestino: input.filaDestino, caseCriadoId, tarefaCriadaId } as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });

        return { success: true, caseCriadoId, tarefaCriadaId };
      }),

    cancelar: protectedProcedure
      .input(z.object({
        id: z.number(),
        motivo: z.string().min(1, 'Motivo é obrigatório'),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        await credDb.updateDemandRequest(input.id, {
          status: 'cancelada',
          motivoCancelamento: input.motivo,
          canceladoPorId: user.id,
          canceladoEm: new Date().toISOString().slice(0, 19).replace('T', ' '),
        } as any);
        await credDb.logCreditAudit({
          entidade: 'demand_request',
          entidadeId: input.id,
          acao: 'cancelamento',
          descricao: `DR cancelada: ${input.motivo}`,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),
  }),

  // --- Portfolio Migration (Conflito de Carteira) ---
  portfolioMigration: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return credDb.listPortfolioMigrations(input || {});
      }),

    create: protectedProcedure
      .input(z.object({
        solicitanteParceiroId: z.number(),
        cnpj: z.string(),
        clienteId: z.number().nullable().optional(),
        parceiroAtualId: z.number().nullable().optional(),
        motivo: z.string().min(1),
        evidencias: z.any().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const result = await credDb.createPortfolioMigration({
          ...input,
          criadoPorId: user.id,
        } as any);
        if (result) {
          await credDb.logCreditAudit({
            entidade: 'migration',
            entidadeId: result.id,
            acao: 'criacao',
            descricao: `Solicitação de migração de carteira para CNPJ ${input.cnpj}`,
            usuarioId: user.id,
            usuarioNome: user.name,
          });
          await notifyOwner({ title: 'Conflito de Carteira', content: `Nova solicitação de migração de carteira para CNPJ ${input.cnpj}` });
        }
        return result;
      }),

    aprovar: protectedProcedure
      .input(z.object({
        id: z.number(),
        aprovado: z.boolean(),
        observacao: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        await credDb.updatePortfolioMigration(input.id, {
          status: input.aprovado ? 'aprovada' : 'rejeitada',
          aprovadorId: user.id,
          aprovadoEm: new Date().toISOString().slice(0, 19).replace('T', ' '),
          observacaoAprovador: input.observacao,
        } as any);
        await credDb.logCreditAudit({
          entidade: 'migration',
          entidadeId: input.id,
          acao: input.aprovado ? 'aprovacao' : 'rejeicao',
          descricao: `Migração ${input.aprovado ? 'aprovada' : 'rejeitada'}`,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),
  }),
});

// ===== SETOR CRÉDITO TRIBUTÁRIO =====
const creditoRouter = router({
  // --- Dashboard ---
  dashboard: protectedProcedure.query(async () => {
    return credDb.getCreditDashboardStats();
  }),

  // --- Cases ---
  cases: router({
    list: protectedProcedure
      .input(z.object({
        fase: z.string().optional(),
        status: z.string().optional(),
        clienteId: z.number().optional(),
        parceiroId: z.number().optional(),
        responsavelId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.listCreditCases(input || {});
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const caseData = await credDb.getCreditCaseById(input.id);
        if (!caseData) return null;
        // Enrich with related data
        const [rtis, tasks, tickets, ledger, events, audit] = await Promise.all([
          credDb.listRtiReports({ caseId: input.id }),
          credDb.listCreditTasks({ caseId: input.id }),
          credDb.listCreditTickets({ caseId: input.id }),
          credDb.listCreditLedger({ caseId: input.id }),
          credDb.listSuccessEvents({ caseId: input.id }),
          credDb.listCreditAuditLog({ entidade: 'case', entidadeId: input.id, limit: 50 }),
        ]);
        return { ...caseData, rtis, tasks, tickets, ledger, events, audit };
      }),

    create: protectedProcedure
      .input(z.object({
        clienteId: z.number(),
        parceiroId: z.number().nullable().optional(),
        tesesIds: z.array(z.number()).optional(),
        fase: z.enum(['oportunidade', 'contratado']).default('oportunidade'),
        status: z.string().default('nda_pendente'),
        responsavelId: z.number().nullable().optional(),
        responsavelNome: z.string().optional(),
        valorEstimado: z.string().optional(),
        observacoes: z.string().optional(),
        demandRequestId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const result = await credDb.createCreditCase(input as any);
        if (result) {
          await credDb.logCreditAudit({
            entidade: 'case',
            entidadeId: result.id,
            acao: 'criacao',
            descricao: `Case ${result.numero} criado`,
            dadosNovos: input as any,
            usuarioId: user.id,
            usuarioNome: user.name,
          });
        }
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        fase: z.enum(['oportunidade', 'contratado']).optional(),
        status: z.string().optional(),
        responsavelId: z.number().nullable().optional(),
        responsavelNome: z.string().optional(),
        valorEstimado: z.string().optional(),
        valorContratado: z.string().optional(),
        observacoes: z.string().optional(),
        tesesIds: z.array(z.number()).optional(),
        ndaUrl: z.string().optional(),
        contratoUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const { id, ...data } = input;
        const old = await credDb.getCreditCaseById(id);
        
        // Auto-set timestamps
        const updates: any = { ...data };
        if (data.status === 'nda_assinado' && !old?.ndaAssinadoEm) {
          updates.ndaAssinadoEm = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
        if (data.fase === 'contratado' && old?.fase === 'oportunidade') {
          updates.contratoAssinadoEm = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
        if (data.status === 'onboarding_concluido' && !old?.onboardingConcluidoEm) {
          updates.onboardingConcluidoEm = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }

        await credDb.updateCreditCase(id, updates);
        await credDb.logCreditAudit({
          entidade: 'case',
          entidadeId: id,
          acao: 'atualizacao',
          descricao: `Case atualizado`,
          dadosAnteriores: { fase: old?.fase, status: old?.status } as any,
          dadosNovos: updates as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),

    stats: protectedProcedure.query(async () => {
      return credDb.getCreditCaseStats();
    }),
  }),

  // --- RTI Reports ---
  rti: router({
    list: protectedProcedure
      .input(z.object({
        caseId: z.number().optional(),
        clienteId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.listRtiReports(input || {});
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return credDb.getRtiReportById(input.id);
      }),

    listByTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return credDb.listRtiByTaskId(input.taskId);
      }),

    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        clienteId: z.number(),
        taskId: z.number().optional(),
        tesesAnalisadas: z.any().optional(),
        valorTotalEstimado: z.string().optional(),
        periodoAnalise: z.string().optional(),
        resumoExecutivo: z.string().optional(),
        metodologia: z.string().optional(),
        conclusao: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        // If taskId is provided, use versioning
        if (input.taskId) {
          const result = await credDb.createRtiVersion(
            input.taskId, input.caseId, input.clienteId,
            input, user.id, user.name
          );
          if (result) {
            await credDb.logCreditAudit({
              entidade: 'rti',
              entidadeId: result.id,
              acao: 'criacao',
              descricao: `RTI ${result.numero} v${result.versao} criado para tarefa #${input.taskId}`,
              usuarioId: user.id,
              usuarioNome: user.name,
            });
          }
          return result;
        }
        const result = await credDb.createRtiReport({
          ...input,
          status: 'rascunho',
          emitidoPorId: user.id,
          emitidoPorNome: user.name,
        } as any);
        if (result) {
          await credDb.logCreditAudit({
            entidade: 'rti',
            entidadeId: result.id,
            acao: 'criacao',
            descricao: `RTI ${result.numero} criado para case`,
            usuarioId: user.id,
            usuarioNome: user.name,
          });
        }
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        tesesAnalisadas: z.any().optional(),
        valorTotalEstimado: z.string().optional(),
        periodoAnalise: z.string().optional(),
        resumoExecutivo: z.string().optional(),
        metodologia: z.string().optional(),
        conclusao: z.string().optional(),
        observacoes: z.string().optional(),
        pdfUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const { id, ...data } = input;
        await credDb.updateRtiReport(id, data as any);
        return { success: true };
      }),

    emitir: protectedProcedure
      .input(z.object({
        id: z.number(),
        slaDevolutivaDias: z.number().default(7),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const rti = await credDb.getRtiReportById(input.id);
        if (!rti) throw new Error('RTI não encontrado');
        
        const now = new Date();
        const venceEm = new Date(now.getTime() + input.slaDevolutivaDias * 24 * 60 * 60 * 1000);
        
        await credDb.updateRtiReport(input.id, {
          status: 'emitido',
          emitidoPorId: user.id,
          emitidoPorNome: user.name,
          emitidoEm: now.toISOString().slice(0, 19).replace('T', ' '),
          slaDevolutivaDias: input.slaDevolutivaDias,
          slaDevolutivaVenceEm: venceEm.toISOString().slice(0, 19).replace('T', ' '),
          devolutivaStatus: 'pendente',
        } as any);

        // Update case status
        if (rti.caseId) {
          await credDb.updateCreditCase(rti.caseId, { status: 'rti_emitido' } as any);
        }

        await credDb.logCreditAudit({
          entidade: 'rti',
          entidadeId: input.id,
          acao: 'emissao',
          descricao: `RTI ${rti.numero} emitido. Devolutiva em ${input.slaDevolutivaDias} dias.`,
          usuarioId: user.id,
          usuarioNome: user.name,
        });

        // Workflow: Ao emitir RTI ao parceiro, marcar tarefa como concluída e mover para próxima fila
        if (rti.taskId) {
          const task = await credDb.getCreditTaskById(rti.taskId);
          if (task && (task.status === 'feito' || task.status === 'fazendo')) {
            // Mark as concluido
            await credDb.updateCreditTask(rti.taskId, { status: 'concluido' } as any);

            // Define fila flow
            const FILA_FLOW: Record<string, string | null> = {
              onboarding: 'apuracao', apuracao: 'compensacao',
              compensacao: null, retificacao: null, ressarcimento: null,
              restituicao: null, revisao: null, chamados: null,
            };
            const nextFila = FILA_FLOW[task.fila];

            if (nextFila) {
              const nextTask = await credDb.createCreditTask({
                fila: nextFila,
                caseId: task.caseId,
                clienteId: task.clienteId,
                demandRequestId: task.demandRequestId,
                titulo: task.titulo,
                descricao: `Continuação da tarefa ${task.codigo} (${task.fila}). RTI emitido.`,
                prioridade: task.prioridade,
                criadoPorId: user.id,
                criadoPorNome: user.name,
              } as any);

              if (nextTask) {
                // Copy teses to the new task
                const taskTeses = await credDb.listTaskTeses(rti.taskId);
                for (const tese of taskTeses) {
                  await credDb.createTaskTese({
                    taskId: nextTask.id,
                    teseId: tese.teseId,
                    teseNome: tese.teseNome,
                    aderente: tese.aderente,
                    valorEstimado: tese.valorEstimado,
                    status: 'selecionada',
                  });
                }

                const filaLabels: Record<string, string> = {
                  apuracao: 'Apuração', compensacao: 'Compensação', retificacao: 'Retificação',
                  ressarcimento: 'Ressarcimento', restituicao: 'Restituição', onboarding: 'Onboarding',
                  revisao: 'Revisão', chamados: 'Chamados',
                };
                await notifyOwner({
                  title: `Tarefa movida para ${filaLabels[nextFila] || nextFila}`,
                  content: `RTI ${rti.numero} emitido. Tarefa ${task.codigo} concluída na fila ${filaLabels[task.fila] || task.fila}. Nova tarefa ${nextTask.codigo} criada na fila ${filaLabels[nextFila] || nextFila}.`,
                });

                await credDb.logCreditAudit({
                  entidade: 'task',
                  entidadeId: nextTask.id,
                  acao: 'workflow_auto_move',
                  descricao: `Tarefa ${nextTask.codigo} criada automaticamente após emissão do RTI ${rti.numero}`,
                  usuarioId: user.id,
                  usuarioNome: user.name,
                });
              }
            }

            await credDb.logCreditAudit({
              entidade: 'task',
              entidadeId: rti.taskId,
              acao: 'workflow_auto_complete',
              descricao: `Tarefa ${task.codigo} concluída automaticamente após emissão do RTI ${rti.numero}`,
              usuarioId: user.id,
              usuarioNome: user.name,
            });
          }
        }

        return { success: true };
      }),

    registrarDevolutiva: protectedProcedure
      .input(z.object({
        id: z.number(),
        observacao: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        await credDb.updateRtiReport(input.id, {
          devolutivaStatus: 'recebida',
          devolutivaRecebidaEm: new Date().toISOString().slice(0, 19).replace('T', ' '),
          devolutivaObservacao: input.observacao,
        } as any);

        const rti = await credDb.getRtiReportById(input.id);
        if (rti?.caseId) {
          await credDb.updateCreditCase(rti.caseId, { status: 'aguardando_devolutiva' } as any);
        }

        await credDb.logCreditAudit({
          entidade: 'rti',
          entidadeId: input.id,
          acao: 'devolutiva_recebida',
          descricao: `Devolutiva recebida para RTI`,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),
  }),

  // --- Credit Tasks (Filas) ---
  tasks: router({
    list: protectedProcedure
      .input(z.object({
        fila: z.string().optional(),
        status: z.string().optional(),
        caseId: z.number().optional(),
        clienteId: z.number().optional(),
        responsavelId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.listCreditTasks(input || {});
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return credDb.getCreditTaskById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        fila: z.enum(['apuracao', 'retificacao', 'compensacao', 'ressarcimento', 'restituicao', 'revisao', 'onboarding', 'chamados']),
        caseId: z.number().nullable().optional(),
        clienteId: z.number().nullable().optional(),
        demandRequestId: z.number().nullable().optional(),
        titulo: z.string().min(1),
        descricao: z.string().optional(),
        prioridade: z.enum(['urgente', 'alta', 'media', 'baixa']).default('media'),
        responsavelId: z.number().nullable().optional(),
        responsavelNome: z.string().optional(),
        dataVencimento: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const result = await credDb.createCreditTask({
          ...input,
          criadoPorId: user.id,
          criadoPorNome: user.name,
        } as any);
        if (result) {
          await credDb.logCreditAudit({
            entidade: 'task',
            entidadeId: result.id,
            acao: 'criacao',
            descricao: `Tarefa ${result.codigo} criada na fila ${input.fila}`,
            usuarioId: user.id,
            usuarioNome: user.name,
          });
        }
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['a_fazer', 'fazendo', 'feito', 'concluido']).optional(),
        prioridade: z.enum(['urgente', 'alta', 'media', 'baixa']).optional(),
        responsavelId: z.number().nullable().optional(),
        responsavelNome: z.string().optional(),
        observacoes: z.string().optional(),
        ordem: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const { id, ...data } = input;
        const old = await credDb.getCreditTaskById(id);
        const updates: any = { ...data };
        if (data.status === 'feito' && old?.status !== 'feito') {
          updates.dataConclusao = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
        await credDb.updateCreditTask(id, updates);
        await credDb.logCreditAudit({
          entidade: 'task',
          entidadeId: id,
          acao: 'atualizacao',
          descricao: `Tarefa atualizada`,
          dadosAnteriores: { status: old?.status } as any,
          dadosNovos: updates as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),

    // Workflow: Analista pega tarefa (a_fazer → fazendo, associa responsável)
    assumeTask: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const task = await credDb.getCreditTaskById(input.id);
        if (!task) throw new Error('Tarefa não encontrada');
        if (task.status !== 'a_fazer') throw new Error('Tarefa já está em andamento ou concluída');
        // FIFO enforcement: non-admin users can only pick the first a_fazer task in the queue
        if ((user as any).role !== 'admin') {
          const firstTask = await credDb.getFirstAFazerTask(task.fila);
          if (firstTask && firstTask.id !== input.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Esta tarefa não é a primeira da fila. Você só pode pegar a primeira tarefa disponível. Para pegar esta tarefa, solicite autorização ao gestor.' });
          }
        }
        await credDb.updateCreditTask(input.id, {
          status: 'fazendo',
          responsavelId: user.id,
          responsavelNome: user.name,
        } as any);
        await credDb.logCreditAudit({
          entidade: 'task',
          entidadeId: input.id,
          acao: 'workflow_assume',
          descricao: `${user.name} assumiu a tarefa ${task.codigo} na fila ${task.fila}`,
          dadosAnteriores: { status: 'a_fazer', responsavelId: task.responsavelId } as any,
          dadosNovos: { status: 'fazendo', responsavelId: user.id } as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),

    // Workflow: Analista finaliza análise (fazendo → feito)
    finishTask: protectedProcedure
      .input(z.object({
        id: z.number(),
        observacoes: z.string().optional(),
        anexos: z.array(z.object({
          nome: z.string(),
          url: z.string(),
          tipo: z.string().optional(),
        })).optional(),
        viabilidade: z.enum(['viavel', 'inviavel']).optional(),
        valorGlobalApurado: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const task = await credDb.getCreditTaskById(input.id);
        if (!task) throw new Error('Tarefa não encontrada');
        if (task.status !== 'fazendo') throw new Error('Tarefa precisa estar com status "Fazendo" para ser finalizada');
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const existingAnexos = (task.anexos && typeof task.anexos === 'string' ? JSON.parse(task.anexos) : task.anexos) || [];
        const allAnexos = [...existingAnexos, ...(input.anexos || [])];

        // Calculate viabilidade based on RTI value (valor real apurado)
        let viabilidade = input.viabilidade;
        let valorGlobal = input.valorGlobalApurado;
        
        // If no value provided, try to get from RTI oportunidades (valor real apurado)
        if (valorGlobal === undefined || valorGlobal === null) {
          const rtis = await credDb.listRtisByTask(input.id);
          if (rtis && rtis.length > 0) {
            valorGlobal = rtis.reduce((sum: number, r: any) => sum + Number((r as any).valorTotalApurado || r.valorTotalEstimado || 0), 0);
          } else {
            valorGlobal = 0;
          }
        }
        
        // Auto-calculate viabilidade if not manually set: >= R$20.000 = viavel, < R$20.000 = inviavel
        if (!viabilidade) {
          viabilidade = valorGlobal >= 20000 ? 'viavel' : 'inviavel';
        }

        await credDb.updateCreditTask(input.id, {
          status: 'feito',
          dataConclusao: now,
          observacoes: input.observacoes || task.observacoes,
          anexos: JSON.stringify(allAnexos),
          viabilidade,
          valorGlobalApurado: String(valorGlobal),
        } as any);
        await credDb.logCreditAudit({
          entidade: 'task',
          entidadeId: input.id,
          acao: 'workflow_finish',
          descricao: `${user.name} finalizou a análise da tarefa ${task.codigo}. Viabilidade: ${viabilidade === 'viavel' ? 'Viável' : 'Inviável'} (R$ ${valorGlobal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). ${(input.anexos || []).length} anexo(s) adicionado(s).`,
          dadosAnteriores: { status: 'fazendo' } as any,
          dadosNovos: { status: 'feito', dataConclusao: now, viabilidade, valorGlobalApurado: valorGlobal } as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true, viabilidade, valorGlobalApurado: valorGlobal };
      }),

    // Workflow: Concluir tarefa (feito → concluido) + mover para próxima fila
    completeAndMoveToNextFila: protectedProcedure
      .input(z.object({
        id: z.number(),
        rtiId: z.number().optional(),
        parceiroId: z.number().optional(),
        parceiroNome: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const task = await credDb.getCreditTaskById(input.id);
        if (!task) throw new Error('Tarefa não encontrada');
        if (task.status !== 'feito') throw new Error('Tarefa precisa estar com status "Feito" para ser concluída');

        // Mark current task as concluido
        await credDb.updateCreditTask(input.id, { status: 'concluido' } as any);

        // Define fila flow: apuracao → compensacao → restituicao/ressarcimento
        const FILA_FLOW: Record<string, string | null> = {
          onboarding: 'apuracao',
          apuracao: 'compensacao',
          compensacao: null, // end of flow (or could go to restituicao/ressarcimento)
          retificacao: null,
          ressarcimento: null,
          restituicao: null,
          revisao: null,
          chamados: null,
        };
        const nextFila = FILA_FLOW[task.fila];
        let nextTaskId: number | null = null;

        if (nextFila) {
          // Create task in next fila
          const nextTask = await credDb.createCreditTask({
            fila: nextFila,
            caseId: task.caseId,
            clienteId: task.clienteId,
            demandRequestId: task.demandRequestId,
            titulo: task.titulo,
            descricao: `Continuação da tarefa ${task.codigo} (${task.fila}). ${task.descricao || ''}`,
            prioridade: task.prioridade,
            criadoPorId: user.id,
            criadoPorNome: user.name,
          } as any);

          if (nextTask) {
            nextTaskId = nextTask.id;
            // Copy teses to the new task
            const taskTeses = await credDb.listTaskTeses(input.id);
            for (const tese of taskTeses) {
              await credDb.createTaskTese({
                taskId: nextTask.id,
                teseId: tese.teseId,
                teseNome: tese.teseNome,
                aderente: tese.aderente,
                valorEstimado: tese.valorEstimado,
                status: 'selecionada',
              });
            }

            await credDb.logCreditAudit({
              entidade: 'task',
              entidadeId: nextTask.id,
              acao: 'workflow_move',
              descricao: `Tarefa ${nextTask.codigo} criada automaticamente na fila ${nextFila} a partir de ${task.codigo}`,
              usuarioId: user.id,
              usuarioNome: user.name,
            });

            // Notify owner about the new task in the next fila
            const filaLabels: Record<string, string> = {
              apuracao: 'Apuração', compensacao: 'Compensação', retificacao: 'Retificação',
              ressarcimento: 'Ressarcimento', restituicao: 'Restituição', onboarding: 'Onboarding',
              revisao: 'Revisão', chamados: 'Chamados',
            };
            await notifyOwner({
              title: `Nova tarefa na fila ${filaLabels[nextFila] || nextFila}`,
              content: `A tarefa ${task.codigo} (${task.titulo}) foi concluída na fila ${filaLabels[task.fila] || task.fila} e uma nova tarefa ${nextTask.codigo} foi criada automaticamente na fila ${filaLabels[nextFila] || nextFila}.`,
            });
          }
        }

        await credDb.logCreditAudit({
          entidade: 'task',
          entidadeId: input.id,
          acao: 'workflow_complete',
          descricao: `Tarefa ${task.codigo} concluída na fila ${task.fila}${nextFila ? `. Movida para ${nextFila}` : ''}`,
          dadosAnteriores: { status: 'feito' } as any,
          dadosNovos: { status: 'concluido', nextFila, nextTaskId } as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });

        // ===== NOTIFICAÇÃO AUTOMÁTICA AO PARCEIRO =====
        // Notify parceiro when apuração is concluded with viabilidade result
        if (task.fila === 'apuracao' && task.viabilidade) {
          try {
            // Get client info to find parceiro
            const clienteInfo = task.clienteId ? await db.getClienteById(task.clienteId) : null;
            const parceiroId = clienteInfo?.parceiroId;
            if (parceiroId) {
              const parceiro = await db.getParceiroById(parceiroId);
              if (parceiro) {
                const viabLabel = task.viabilidade === 'viavel' ? 'VIÁVEL' : 'INVIÁVEL';
                const valorFormatado = task.valorGlobalApurado
                  ? Number(task.valorGlobalApurado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : 'N/A';
                const clienteNome = clienteInfo?.razaoSocial || clienteInfo?.nomeFantasia || 'Cliente';
                const clienteCodigo = clienteInfo?.codigo || '';

                // Create internal notification for the owner
                await notifyOwner({
                  title: `Apuração Concluída - ${viabLabel}`,
                  content: `A apuração do cliente ${clienteNome} (Cód: ${clienteCodigo}) foi concluída como ${viabLabel}. Valor global apurado: ${valorFormatado}. Parceiro: ${parceiro.nomeCompleto || parceiro.nomeFantasia || 'N/A'}.`,
                });

                // Create notification record in the system
                await db.createNotificacao({
                  tipo: 'analise_concluida' as any,
                  titulo: `Apuração Concluída - ${clienteNome}`,
                  mensagem: `A análise do cliente ${clienteNome} (Código: ${clienteCodigo}) foi concluída com resultado ${viabLabel}. Valor global apurado: ${valorFormatado}. Parceiro vinculado: ${parceiro.nomeCompleto || parceiro.nomeFantasia || 'N/A'} (${parceiro.email || 'sem e-mail'}).`,
                  lida: false,
                  clienteId: task.clienteId,
                  tarefaId: task.id,
                });

                // Log the notification in audit
                await credDb.logCreditAudit({
                  entidade: 'task',
                  entidadeId: input.id,
                  acao: 'notificacao_parceiro',
                  descricao: `Notificação enviada ao parceiro ${parceiro.nomeCompleto || parceiro.nomeFantasia} sobre conclusão da apuração (${viabLabel}) do cliente ${clienteNome}`,
                  usuarioId: user.id,
                  usuarioNome: user.name,
                });
              }
            }
          } catch (notifErr) {
            console.error('[Notificação Parceiro] Erro ao enviar notificação:', notifErr);
          }
        }

        return { success: true, nextFila, nextTaskId };
      }),

    stats: protectedProcedure
      .input(z.object({
        responsavelId: z.number().optional(),
        parceiroId: z.number().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.getCreditTaskStats(input || undefined);
      }),

    // Reopen task (admin only) - allows editing a completed task
    reopenTask: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        justificativa: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),
        targetStatus: z.enum(['a_fazer', 'fazendo']).default('fazendo'),
      }))
      .mutation(async ({ ctx, input }) => {
        const { user } = ctx;
        if (user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas gestores podem reabrir tarefas' });
        const task = await credDb.getCreditTaskById(input.taskId);
        if (!task) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tarefa não encontrada' });
        const prevLog = task.reaberturaMotivoLog ? (typeof task.reaberturaMotivoLog === 'string' ? JSON.parse(task.reaberturaMotivoLog) : task.reaberturaMotivoLog) : [];
        const newLog = [...(Array.isArray(prevLog) ? prevLog : []), { data: new Date().toISOString(), usuario: user.name, usuarioId: user.id, motivo: input.justificativa, statusAnterior: task.status }];
        await credDb.updateCreditTask(input.taskId, { status: input.targetStatus as any, reaberta: true, reaberturaMotivoLog: JSON.stringify(newLog) } as any);
        await credDb.logCreditAudit({ entidade: 'task', entidadeId: input.taskId, acao: 'reabertura', descricao: `Tarefa ${task.codigo} reaberta por ${user.name}. Motivo: ${input.justificativa}`, dadosAnteriores: { status: task.status } as any, dadosNovos: { status: input.targetStatus, reaberta: true } as any, usuarioId: user.id, usuarioNome: user.name });
        // Notificar analista responsável sobre reabertura
        if (task.responsavelId) {
          try {
            await createNotificacao({
              tipo: 'tarefa_atribuida',
              titulo: `Tarefa ${task.codigo} reaberta`,
              mensagem: `A tarefa "${task.titulo}" foi reaberta pelo gestor ${user.name}. Motivo: ${input.justificativa}`,
              usuarioId: task.responsavelId,
              tarefaId: input.taskId,
              lida: 0,
            });
          } catch (e) { console.error('[Notif] Erro ao notificar analista sobre reabertura', e); }
        }
        return { success: true };
      }),

    // Queue exception (admin only) - move task to first in queue or assign directly
    queueException: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        justificativa: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),
        action: z.enum(['move_to_first', 'assign_to_analyst']),
        analystId: z.number().optional(),
        analystName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { user } = ctx;
        if (user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas gestores podem aplicar exceções de fila' });
        const task = await credDb.getCreditTaskById(input.taskId);
        if (!task) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tarefa não encontrada' });
        if (input.action === 'move_to_first') {
          await credDb.updateCreditTask(input.taskId, { ordem: -1 } as any);
        } else if (input.action === 'assign_to_analyst' && input.analystId) {
          await credDb.updateCreditTask(input.taskId, { responsavelId: input.analystId, responsavelNome: input.analystName || '', status: 'fazendo' } as any);
        }
        await credDb.logCreditAudit({ entidade: 'task', entidadeId: input.taskId, acao: 'queue_exception', descricao: `Exceção de fila aplicada por ${user.name}. Ação: ${input.action}. Motivo: ${input.justificativa}`, dadosAnteriores: { ordem: task.ordem, status: task.status } as any, dadosNovos: { action: input.action } as any, usuarioId: user.id, usuarioNome: user.name });
        // Notificar analista sobre exceção de fila
        const notifUserId = input.action === 'assign_to_analyst' && input.analystId ? input.analystId : task.responsavelId;
        if (notifUserId) {
          try {
            const acaoLabel = input.action === 'assign_to_analyst' ? 'atribuída diretamente a você' : 'movida para o topo da fila';
            await createNotificacao({
              tipo: 'tarefa_atribuida',
              titulo: `Exceção de fila — ${task.codigo}`,
              mensagem: `A tarefa "${task.titulo}" foi ${acaoLabel} pelo gestor ${user.name}. Motivo: ${input.justificativa}`,
              usuarioId: notifUserId,
              tarefaId: input.taskId,
              lida: 0,
            });
          } catch (e) { console.error('[Notif] Erro ao notificar analista sobre exceção de fila', e); }
        }
        return { success: true };
      }),

    // Analyst requests exception to pick a non-first task
    requestException: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        justificativa: z.string().min(10, 'Justificativa deve ter pelo menos 10 caracteres'),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = getUser(ctx);
        const task = await credDb.getCreditTaskById(input.taskId);
        if (!task) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tarefa n\u00e3o encontrada' });
        const result = await credDb.createQueueExceptionRequest({
          taskId: input.taskId,
          taskCodigo: task.codigo,
          fila: task.fila,
          solicitanteId: String(user.id),
          solicitanteNome: user.name,
          justificativa: input.justificativa,
        });
        // Notify all admins about the request
        try {
          const { listUsers } = await import('./db');
          const allUsers = await listUsers();
          const admins = (allUsers || []).filter((u: any) => u.role === 'admin');
          for (const admin of admins) {
            await createNotificacao({
              tipo: 'tarefa_atribuida',
              titulo: `Solicita\u00e7\u00e3o de exce\u00e7\u00e3o de fila`,
              mensagem: `${user.name} solicita autoriza\u00e7\u00e3o para pegar a tarefa ${task.codigo} (${task.clienteNome || task.titulo}). Motivo: ${input.justificativa}`,
              usuarioId: admin.id,
              tarefaId: input.taskId,
              lida: 0,
            });
          }
        } catch (e) { console.error('[Notif] Erro ao notificar gestores sobre solicita\u00e7\u00e3o de exce\u00e7\u00e3o', e); }
        return { success: true, requestId: result.id };
      }),

    // List exception requests (admin)
    listExceptionRequests: protectedProcedure
      .input(z.object({ status: z.string().optional(), fila: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const user = getUser(ctx);
        if ((user as any).role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas gestores podem ver solicita\u00e7\u00f5es de exce\u00e7\u00e3o' });
        return credDb.listQueueExceptionRequests(input || {});
      }),

    // Count pending exception requests (admin)
    countPendingExceptions: protectedProcedure
      .query(async ({ ctx }) => {
        const user = getUser(ctx);
        if ((user as any).role !== 'admin') return 0;
        return credDb.countPendingExceptionRequests();
      }),

    // Respond to exception request (admin approves/denies)
    respondException: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        status: z.enum(['aprovado', 'negado']),
        resposta: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = getUser(ctx);
        if ((user as any).role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas gestores podem responder solicita\u00e7\u00f5es' });
        const request = await credDb.getQueueExceptionRequestById(input.requestId);
        if (!request) throw new TRPCError({ code: 'NOT_FOUND', message: 'Solicita\u00e7\u00e3o n\u00e3o encontrada' });
        if (request.status !== 'pendente') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Solicita\u00e7\u00e3o j\u00e1 foi respondida' });
        await credDb.respondQueueExceptionRequest(input.requestId, {
          status: input.status,
          gestorId: String(user.id),
          gestorNome: user.name,
          gestorResposta: input.resposta,
        });
        // If approved, assign the task to the analyst
        if (input.status === 'aprovado') {
          await credDb.updateCreditTask(request.taskId, {
            status: 'fazendo',
            responsavelId: Number(request.solicitanteId),
            responsavelNome: request.solicitanteNome,
          } as any);
          await credDb.logCreditAudit({
            entidade: 'task', entidadeId: request.taskId, acao: 'queue_exception',
            descricao: `Exce\u00e7\u00e3o de fila aprovada por ${user.name} para ${request.solicitanteNome}. Motivo: ${request.justificativa}`,
            dadosAnteriores: {} as any, dadosNovos: { action: 'exception_approved' } as any,
            usuarioId: user.id, usuarioNome: user.name,
          });
        }
        // Notify the analyst about the decision
        try {
          const statusLabel = input.status === 'aprovado' ? 'APROVADA' : 'NEGADA';
          const msg = input.status === 'aprovado'
            ? `Sua solicita\u00e7\u00e3o para pegar a tarefa ${request.taskCodigo} foi ${statusLabel} por ${user.name}. A tarefa j\u00e1 foi atribu\u00edda a voc\u00ea.`
            : `Sua solicita\u00e7\u00e3o para pegar a tarefa ${request.taskCodigo} foi ${statusLabel} por ${user.name}.${input.resposta ? ' Motivo: ' + input.resposta : ''}`;
          await createNotificacao({
            tipo: 'tarefa_atribuida',
            titulo: `Solicita\u00e7\u00e3o de exce\u00e7\u00e3o ${statusLabel}`,
            mensagem: msg,
            usuarioId: Number(request.solicitanteId),
            tarefaId: request.taskId,
            lida: 0,
          });
        } catch (e) { console.error('[Notif] Erro ao notificar analista sobre resposta de exce\u00e7\u00e3o', e); }
        return { success: true };
      }),
  }),
  // --- Flow Overview (Vis\u00e3o Geral do Fluxo por Empresa) ----
  flowOverview: protectedProcedure.query(async () => {
    return credDb.getClienteFlowOverview();
  }),

  // --- Tickets ---
  tickets: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        caseId: z.number().optional(),
        clienteId: z.number().optional(),
        parceiroId: z.number().optional(),
        tipo: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.listCreditTickets(input || {});
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const ticket = await credDb.getCreditTicketById(input.id);
        if (!ticket) return null;
        const messages = await credDb.listTicketMessages(input.id);
        return { ...ticket, messages };
      }),

    create: protectedProcedure
      .input(z.object({
        caseId: z.number().nullable().optional(),
        clienteId: z.number(),
        parceiroId: z.number().nullable().optional(),
        tipo: z.enum(['pendencia_cliente', 'exigencia_rfb', 'contestacao_saldo', 'solicitacao_contencioso', 'solicitacao_financeiro', 'outros']),
        titulo: z.string().min(1),
        descricao: z.string().optional(),
        prioridade: z.enum(['urgente', 'alta', 'media', 'baixa']).default('media'),
        responsavelId: z.number().nullable().optional(),
        responsavelNome: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const result = await credDb.createCreditTicket({
          ...input,
          criadoPorId: user.id,
          criadoPorNome: user.name,
        } as any);
        if (result) {
          await credDb.logCreditAudit({
            entidade: 'ticket',
            entidadeId: result.id,
            acao: 'criacao',
            descricao: `Ticket criado: ${input.titulo}`,
            usuarioId: user.id,
            usuarioNome: user.name,
          });
        }
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'cancelado']).optional(),
        responsavelId: z.number().nullable().optional(),
        responsavelNome: z.string().optional(),
        resolucao: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const { id, ...data } = input;
        const updates: any = { ...data };
        if (data.status === 'resolvido') {
          updates.dataResolucao = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
        await credDb.updateCreditTicket(id, updates);
        await credDb.logCreditAudit({
          entidade: 'ticket',
          entidadeId: id,
          acao: 'atualizacao',
          descricao: `Ticket atualizado`,
          dadosNovos: updates as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),

    addMessage: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        mensagem: z.string().min(1),
        anexos: z.any().optional(),
        interno: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        return credDb.createTicketMessage({
          ticketId: input.ticketId,
          mensagem: input.mensagem,
          anexos: input.anexos,
          autorId: user.id,
          autorNome: user.name,
          interno: input.interno ? 1 : 0,
        } as any);
      }),
  }),

  // --- Credit Ledger ---
  ledger: router({
    list: protectedProcedure
      .input(z.object({
        caseId: z.number().optional(),
        clienteId: z.number().optional(),
        status: z.string().optional(),
        compensationGroupId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.listCreditLedger(input || {});
      }),

    summary: protectedProcedure
      .input(z.object({ clienteId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return credDb.getCreditLedgerSummary(input?.clienteId);
      }),

    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        clienteId: z.number(),
        teseId: z.number().nullable().optional(),
        teseNome: z.string().optional(),
        compensationGroupId: z.number().nullable().optional(),
        compensationGroupNome: z.string().optional(),
        periodoInicio: z.string().optional(),
        periodoFim: z.string().optional(),
        valorEstimado: z.string().optional(),
        valorValidado: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const result = await credDb.createCreditLedgerEntry({
          ...input,
          status: 'estimado',
          atualizadoPorId: user.id,
        } as any);
        if (result) {
          await credDb.logCreditAudit({
            entidade: 'ledger',
            entidadeId: result.id,
            acao: 'criacao',
            descricao: `Entrada de ledger criada`,
            usuarioId: user.id,
            usuarioNome: user.name,
          });
        }
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        valorValidado: z.string().optional(),
        valorProtocolado: z.string().optional(),
        valorEfetivado: z.string().optional(),
        saldoResidual: z.string().optional(),
        tipoEfetivacao: z.enum(['compensacao', 'restituicao', 'ressarcimento']).optional(),
        status: z.enum(['estimado', 'validado', 'protocolado', 'efetivado', 'parcial', 'cancelado']).optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const { id, ...data } = input;
        await credDb.updateCreditLedgerEntry(id, { ...data, atualizadoPorId: user.id } as any);
        await credDb.logCreditAudit({
          entidade: 'ledger',
          entidadeId: id,
          acao: 'atualizacao',
          descricao: `Ledger atualizado`,
          dadosNovos: data as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),

    compensationGroups: protectedProcedure.query(async () => {
      return credDb.listCompensationGroups();
    }),
  }),

  // --- Success Events (Êxito) ---
  exito: router({
    list: protectedProcedure
      .input(z.object({
        caseId: z.number().optional(),
        clienteId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.listSuccessEvents(input || {});
      }),

    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        clienteId: z.number(),
        ledgerEntryId: z.number().nullable().optional(),
        tipo: z.enum(['compensacao', 'restituicao', 'ressarcimento']),
        valor: z.string(),
        dataEfetivacao: z.string(),
        descricao: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const result = await credDb.createSuccessEvent({
          ...input,
          registradoPorId: user.id,
          registradoPorNome: user.name,
        } as any);

        // Update case
        await credDb.updateCreditCase(input.caseId, {
          status: 'exito_registrado',
          exitoRegistradoEm: new Date().toISOString().slice(0, 19).replace('T', ' '),
        } as any);

        if (result) {
          await credDb.logCreditAudit({
            entidade: 'case',
            entidadeId: input.caseId,
            acao: 'exito_registrado',
            descricao: `Êxito de R$ ${input.valor} registrado (${input.tipo})`,
            dadosNovos: input as any,
            usuarioId: user.id,
            usuarioNome: user.name,
          });
          await notifyOwner({
            title: 'Êxito Registrado',
            content: `Êxito de R$ ${input.valor} (${input.tipo}) registrado no case #${input.caseId}`,
          });
        }
        return result;
      }),
    confirm: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        await credDb.updateSuccessEvent(input.id, { status: 'confirmado', confirmadoPorId: user.id, confirmadoEm: new Date().toISOString().slice(0, 19).replace('T', ' ') } as any);
        await credDb.logCreditAudit({
          entidade: 'exito',
          entidadeId: input.id,
          acao: 'confirmacao',
          descricao: `\u00caxito #${input.id} confirmado`,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),
  }),
  // --- Due Schedule Policies ---
  policies: router({
    list: protectedProcedure.query(async () => {
      return credDb.listDueSchedulePolicies();
    }),

    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        compensationGroupId: z.number().nullable().optional(),
        compensationGroupNome: z.string().optional(),
        frequencia: z.enum(['mensal', 'trimestral', 'anual']),
        diaVencimento: z.number().nullable().optional(),
        mesesVencimento: z.any().optional(),
        antecedenciaInternaDiasUteis: z.number().default(5),
        antecedenciaCriacaoTarefaDias: z.number().default(10),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const result = await credDb.createDueSchedulePolicy({ ...input, criadoPorId: user.id });
        if (result) {
          await credDb.logCreditAudit({
            entidade: 'policy',
            entidadeId: result.id,
            acao: 'criacao',
            descricao: `Política de vencimento "${input.nome}" criada`,
            usuarioId: user.id,
            usuarioNome: user.name,
          });
        }
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        frequencia: z.enum(['mensal', 'trimestral', 'anual']).optional(),
        diaVencimento: z.number().nullable().optional(),
        mesesVencimento: z.any().optional(),
        antecedenciaInternaDiasUteis: z.number().optional(),
        antecedenciaCriacaoTarefaDias: z.number().optional(),
        ativo: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const { id, ...data } = input;
        await credDb.updateDueSchedulePolicy(id, data);
        await credDb.logCreditAudit({
          entidade: 'policy',
          entidadeId: id,
          acao: 'atualizacao',
          descricao: `Política de vencimento atualizada`,
          dadosNovos: data as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),

    clientSubs: protectedProcedure
      .input(z.object({ clienteId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return credDb.listClientDuePolicySubs(input?.clienteId);
      }),

    subscribeCli: protectedProcedure
      .input(z.object({
        clienteId: z.number(),
        caseId: z.number().nullable().optional(),
        policyId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return credDb.createClientDuePolicySub(input);
      }),

    unsubscribeCli: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await credDb.deleteClientDuePolicySub(input.id);
        return { success: true };
      }),
  }),

  // --- SLA Configs ---
  slaConfigs: router({
    list: protectedProcedure.query(async () => {
      return credDb.listCreditSlaConfigs();
    }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        slaHoras: z.number().nullable().optional(),
        slaDias: z.number().nullable().optional(),
        slaDiasUteis: z.number().optional(),
        alertaDias: z.any().optional(),
        escalonamentoDias: z.number().nullable().optional(),
        ativo: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const { id, ...data } = input;
        await credDb.updateCreditSlaConfig(id, data);
        await credDb.logCreditAudit({
          entidade: 'sla',
          entidadeId: id,
          acao: 'atualizacao',
          descricao: `SLA config atualizado`,
          dadosNovos: data as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),

    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        categoria: z.enum(['triagem', 'fila', 'ticket', 'case', 'rti_devolutiva', 'vencimento_guia']),
        fila: z.string().optional(),
        slaHoras: z.number().nullable().optional(),
        slaDias: z.number().nullable().optional(),
        slaDiasUteis: z.number().default(1),
        alertaDias: z.any().optional(),
        escalonamentoDias: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const result = await credDb.createCreditSlaConfig({ ...input, criadoPorId: user.id });
        return result;
      }),
  }),

  // --- Audit Log ---
  auditLog: protectedProcedure
    .input(z.object({
      entidade: z.string().optional(),
      entidadeId: z.number().optional(),
      limit: z.number().default(100),
    }).optional())
    .query(async ({ input }) => {
      return credDb.listCreditAuditLog(input || {});
    }),
  // --- Clientes 360° ---
  clientes: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional(), parceiroId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return credDb.listCreditClientes(input || {});
      }),
    get360: protectedProcedure
      .input(z.object({ clienteId: z.number() }))
      .query(async ({ input }) => {
        return credDb.getCliente360(input.clienteId);
      }),
    gestaoCreditos: protectedProcedure
      .input(z.object({ clienteId: z.number() }))
      .query(async ({ input }) => {
        return credDb.getGestaoCreditos(input.clienteId);
      }),
    evaluateTeses: protectedProcedure
      .input(z.object({ clienteId: z.number() }))
      .query(async ({ input }) => {
        return credDb.evaluateTesesAderencia(input.clienteId);
      }),
  }),
  // --- Relatórios ---
  reports: router({
    getData: protectedProcedure
      .input(z.object({
        periodoInicio: z.string().optional(),
        periodoFim: z.string().optional(),
        teseId: z.number().optional(),
        parceiroId: z.number().optional(),
        classificacao: z.string().optional(),
        segmento: z.string().optional(),
        fila: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.getReportData(input || {});
      }),
    segmentos: protectedProcedure.query(async () => {
      return credDb.getDistinctSegmentos();
    }),
    produtividade: protectedProcedure
      .input(z.object({
        periodoInicio: z.string().optional(),
        periodoFim: z.string().optional(),
        responsavelId: z.number().optional(),
        fila: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.getProductivityReport(input || {});
      }),
    excecoes: protectedProcedure
      .input(z.object({
        periodoInicio: z.string().optional(),
        periodoFim: z.string().optional(),
        fila: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.getExceptionsAndReopenings(input || {});
      }),
  }),
});

// ===== ADMIN ROUTER =====
const adminRouter = router({
  slas: router({
    list: protectedProcedure.query(async () => {
      return credDb.listCreditSlaConfigs();
    }),
    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        categoria: z.enum(['triagem', 'fila', 'ticket', 'case', 'rti_devolutiva', 'vencimento_guia']),
        fila: z.string().optional(),
        slaHoras: z.number().nullable().optional(),
        slaDias: z.number().nullable().optional(),
        slaDiasUteis: z.number().default(1),
        alertaDias: z.any().optional(),
        escalonamentoDias: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const result = await credDb.createCreditSlaConfig({ ...input, criadoPorId: user.id });
        return result;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        slaHoras: z.number().nullable().optional(),
        slaDias: z.number().nullable().optional(),
        slaDiasUteis: z.number().optional(),
        alertaDias: z.any().optional(),
        escalonamentoDias: z.number().nullable().optional(),
        ativo: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const { id, ...data } = input;
        await credDb.updateCreditSlaConfig(id, data);
        await credDb.logCreditAudit({
          entidade: 'sla',
          entidadeId: id,
          acao: 'atualizacao',
          descricao: `SLA config atualizado`,
          dadosNovos: data as any,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),
  }),
  slaDashboard: protectedProcedure.query(async () => {
    return credDb.getSlaDashboardData();
  }),
  policies: router({
    list: protectedProcedure.query(async () => {
      return credDb.listDueSchedulePolicies();
    }),
    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(1),
        compensationGroupId: z.number().nullable().optional(),
        compensationGroupNome: z.string().optional(),
        frequencia: z.enum(['mensal', 'trimestral', 'anual']),
        diaVencimento: z.number().nullable().optional(),
        mesesVencimento: z.any().optional(),
        antecedenciaInternaDiasUteis: z.number().default(5),
        antecedenciaCriacaoTarefaDias: z.number().default(10),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const result = await credDb.createDueSchedulePolicy({ ...input, criadoPorId: user.id });
        if (result) {
          await credDb.logCreditAudit({
            entidade: 'policy',
            entidadeId: result.id,
            acao: 'criacao',
            descricao: `Pol\u00edtica de vencimento "${input.nome}" criada`,
            usuarioId: user.id,
            usuarioNome: user.name,
          });
        }
        return result;
      }),
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), ativo: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        await credDb.updateDueSchedulePolicy(input.id, { ativo: input.ativo ? 1 : 0 });
        await credDb.logCreditAudit({
          entidade: 'policy',
          entidadeId: input.id,
          acao: 'atualizacao',
          descricao: `Pol\u00edtica ${input.ativo ? 'ativada' : 'desativada'}`,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),
  }),
  compensationGroups: router({
    list: protectedProcedure.query(async () => {
      return credDb.listCompensationGroups();
    }),
  }),
  auditLog: protectedProcedure
    .input(z.object({
      entidade: z.string().optional(),
      entidadeId: z.number().optional(),
      limit: z.number().default(100),
    }).optional())
    .query(async ({ input }) => {
      return credDb.listCreditAuditLog(input || {});
    }),
  // --- Checklists ---
  checklists: router({
    templates: protectedProcedure
      .input(z.object({ fila: z.string().optional(), teseId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return credDb.listChecklistTemplates(input?.fila, input?.teseId);
      }),
    createTemplate: protectedProcedure
      .input(z.object({
        fila: z.string(),
        teseId: z.number().nullable().optional(),
        teseNome: z.string().nullable().optional(),
        nome: z.string().min(1),
        itens: z.array(z.object({ ordem: z.number(), titulo: z.string(), descricao: z.string().optional(), obrigatorio: z.boolean().default(true) })),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        return credDb.createChecklistTemplate({ ...input, criadoPorId: user.id, criadoPorNome: user.name });
      }),
    updateTemplate: protectedProcedure
      .input(z.object({ id: z.number(), nome: z.string().optional(), itens: z.any().optional(), ativo: z.number().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await credDb.updateChecklistTemplate(id, data);
        return { success: true };
      }),
    getInstance: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return credDb.getChecklistInstance(input.taskId);
      }),
    createInstance: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        templateId: z.number().nullable().optional(),
        fila: z.string(),
        nome: z.string(),
        itens: z.any(),
      }))
      .mutation(async ({ input }) => {
        return credDb.createChecklistInstance(input);
      }),
    updateInstance: protectedProcedure
      .input(z.object({ id: z.number(), itens: z.any(), progresso: z.number() }))
      .mutation(async ({ input }) => {
        await credDb.updateChecklistInstance(input.id, input.itens, input.progresso);
        return { success: true };
      }),
  }),
  // --- Document Folders ---
  docFolders: router({
    list: protectedProcedure
      .input(z.object({ taskId: z.number().optional(), clienteId: z.number().optional(), caseId: z.number().optional() }))
      .query(async ({ input }) => {
        return credDb.listDocFolders(input);
      }),
    create: protectedProcedure
      .input(z.object({
        taskId: z.number().nullable().optional(),
        caseId: z.number().nullable().optional(),
        clienteId: z.number(),
        fila: z.string().nullable().optional(),
        nome: z.string().min(1),
        descricao: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        return credDb.createDocFolder({ ...input, criadoPorId: user.id, criadoPorNome: user.name });
      }),
    listFiles: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .query(async ({ input }) => {
        return credDb.listDocFiles(input.folderId);
      }),
    uploadFile: protectedProcedure
      .input(z.object({
        folderId: z.number(),
        nome: z.string(),
        fileUrl: z.string(),
        fileKey: z.string().nullable().optional(),
        mimeType: z.string().nullable().optional(),
        tamanhoBytes: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        return credDb.createDocFile({ ...input, uploadPorId: user.id, uploadPorNome: user.name });
      }),
    deleteFile: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await credDb.deleteDocFile(input.id);
        return { success: true };
      }),
  }),
  // --- PerdComps ---
  perdcomps: router({
    list: protectedProcedure
      .input(z.object({ clienteId: z.number().optional(), caseId: z.number().optional(), taskId: z.number().optional(), search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return credDb.listPerdcomps(input || {});
      }),
    create: protectedProcedure
      .input(z.object({
        taskId: z.number().nullable().optional(),
        caseId: z.number().nullable().optional(),
        clienteId: z.number(),
        ledgerEntryId: z.number().nullable().optional(),
        numeroPerdcomp: z.string().min(1),
        tipoCredito: z.string().nullable().optional(),
        periodoApuracao: z.string().nullable().optional(),
        valorCredito: z.number().nullable().optional(),
        valorDebitosCompensados: z.number().nullable().optional(),
        saldoRemanescente: z.number().nullable().optional(),
        dataTransmissao: z.string().nullable().optional(),
        dataVencimentoGuia: z.string().nullable().optional(),
        guiaNumero: z.string().nullable().optional(),
        status: z.string().default('transmitido'),
        feitoPelaEvox: z.number().default(1),
        observacoes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        return credDb.createPerdcomp({ ...input, registradoPorId: user.id, registradoPorNome: user.name });
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string().optional(), despachoDecisorio: z.string().nullable().optional(), observacoes: z.string().nullable().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await credDb.updatePerdcomp(id, data);
        return { success: true };
      }),
  }),
  // --- Task Teses ---
  taskTeses: router({
    list: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return credDb.listTaskTeses(input.taskId);
      }),
    create: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        teseId: z.number(),
        teseNome: z.string().nullable().optional(),
        aderente: z.number().default(1),
        justificativaNaoAderente: z.string().nullable().optional(),
        valorEstimado: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return credDb.createTaskTese(input);
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string().optional(), valorApurado: z.number().nullable().optional(), valorValidado: z.number().nullable().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await credDb.updateTaskTese(id, data);
        return { success: true };
      }),
  }),
  // --- Case Strategy ---
  caseStrategy: router({
    get: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return credDb.getCaseStrategy(input.caseId);
      }),
    upsert: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        clienteId: z.number(),
        estrategia: z.enum(['compensacao', 'ressarcimento', 'restituicao', 'mista']),
        compensacaoPct: z.number().default(0),
        ressarcimentoPct: z.number().default(0),
        restituicaoPct: z.number().default(0),
        observacoes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        return credDb.upsertCaseStrategy({ ...input, definidoPorId: user.id, definidoPorNome: user.name });
      }),
  }),

  // ===== RTI TEMPLATES (admin) =====
  rtiTemplates: router({
    list: protectedProcedure.query(async () => {
      return credDb.listRtiTemplates();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return credDb.getRtiTemplateById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        textoIntro: z.string().optional(),
        textoObservacoes: z.string().optional(),
        textoProximasEtapas: z.string().optional(),
        cenarioCompensacaoDefault: z.any().optional(),
        alertasDefault: z.any().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        return credDb.createRtiTemplate({ ...input, criadoPorId: user.id, criadoPorNome: user.name });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        textoIntro: z.string().optional(),
        textoObservacoes: z.string().optional(),
        textoProximasEtapas: z.string().optional(),
        cenarioCompensacaoDefault: z.any().optional(),
        alertasDefault: z.any().optional(),
        ativo: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await credDb.updateRtiTemplate(id, data);
        return { success: true };
      }),
  }),

  // ===== PARTNER RETURNS =====
  partnerReturns: router({
    list: protectedProcedure
      .input(z.object({
        rtiId: z.number().optional(),
        clienteId: z.number().optional(),
        parceiroId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return credDb.listPartnerReturns(input || {});
      }),
    stats: protectedProcedure.query(async () => {
      return credDb.getPartnerReturnStats();
    }),
    create: protectedProcedure
      .input(z.object({
        rtiId: z.number(),
        caseId: z.number().optional(),
        clienteId: z.number(),
        parceiroId: z.number().optional(),
        parceiroNome: z.string().optional(),
        slaDias: z.number().default(7),
        valorRti: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const id = await credDb.createPartnerReturn({ ...input, registradoPorId: user.id, registradoPorNome: user.name });
        await credDb.logCreditAudit({
          entidade: 'partner_return',
          entidadeId: id,
          acao: 'criacao',
          descricao: `RTI enviado ao parceiro ${input.parceiroNome || 'N/A'} com SLA de ${input.slaDias} dias`,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        retornoStatus: z.string().optional(),
        retornoObservacao: z.string().optional(),
        motivoNaoFechamento: z.string().optional(),
        valorContratado: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const { id, ...data } = input;
        if (data.retornoStatus && data.retornoStatus !== 'aguardando') {
          (data as any).retornoRecebidoEm = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
        await credDb.updatePartnerReturn(id, data);
        await credDb.logCreditAudit({
          entidade: 'partner_return',
          entidadeId: id,
          acao: 'atualizacao',
          descricao: `Retorno atualizado: ${data.retornoStatus || 'edição'}`,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),
  }),

  // ===== ONBOARDING =====
  onboarding: router({
    getByTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return credDb.getOnboardingRecord(input.taskId);
      }),
    getByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return credDb.getOnboardingRecordByCase(input.caseId);
      }),
    create: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        caseId: z.number().optional(),
        clienteId: z.number(),
        checklistRevisao: z.any().optional(),
        checklistRefinamento: z.any().optional(),
        checklistRegistro: z.any().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const id = await credDb.createOnboardingRecord(input);
        await credDb.logCreditAudit({
          entidade: 'onboarding',
          entidadeId: id,
          acao: 'criacao',
          descricao: `Onboarding iniciado para tarefa ${input.taskId}`,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        checklistRevisao: z.any().optional(),
        checklistRefinamento: z.any().optional(),
        checklistRegistro: z.any().optional(),
        reuniaoGravacaoUrl: z.string().optional(),
        reuniaoGravacaoFileKey: z.string().optional(),
        reuniaoTranscricaoUrl: z.string().optional(),
        reuniaoTranscricaoFileKey: z.string().optional(),
        reuniaoData: z.string().optional(),
        reuniaoParticipantes: z.any().optional(),
        creditoDescricao: z.string().optional(),
        periodoCredito: z.string().optional(),
        valorEstimadoCredito: z.number().optional(),
        estrategia: z.string().optional(),
        estrategiaDetalhes: z.any().optional(),
        contatoContabil: z.any().optional(),
        contatoFinanceiro: z.any().optional(),
        contatoEmpresario: z.any().optional(),
        contatoOutros: z.any().optional(),
        responsavelTecnicoId: z.number().optional(),
        responsavelTecnicoNome: z.string().optional(),
        empresaTemDebitos: z.number().optional(),
        empresaPrecisaCnd: z.number().optional(),
        empresaNoEmac: z.number().optional(),
        empresaHistoricoMalha: z.number().optional(),
        empresaAssinanteMonitor: z.number().optional(),
        status: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        const { id, ...data } = input;
        if (data.status === 'concluido') {
          (data as any).concluidoEm = new Date().toISOString().slice(0, 19).replace('T', ' ');
          (data as any).concluidoPorId = user.id;
          (data as any).concluidoPorNome = user.name;
        }
        await credDb.updateOnboardingRecord(id, data);
        await credDb.logCreditAudit({
          entidade: 'onboarding',
          entidadeId: id,
          acao: 'atualizacao',
          descricao: `Onboarding atualizado${data.status === 'concluido' ? ' - CONCLUÍDO' : ''}`,
          usuarioId: user.id,
          usuarioNome: user.name,
        });
        return { success: true };
      }),
  }),

  // ===== RTI OPORTUNIDADES =====
  rtiOportunidades: router({
    list: protectedProcedure
      .input(z.object({ rtiId: z.number() }))
      .query(async ({ input }) => {
        return credDb.listRtiOportunidades(input.rtiId);
      }),
    create: protectedProcedure
      .input(z.object({
        rtiId: z.number(),
        teseId: z.number().optional(),
        descricao: z.string(),
        classificacao: z.enum(['pacificado', 'nao_pacificado']),
        valorApurado: z.number().optional(),
        detalhamento: z.any().optional(),
        ordem: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return credDb.createRtiOportunidade(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        descricao: z.string().optional(),
        classificacao: z.enum(['pacificado', 'nao_pacificado']).optional(),
        valorApurado: z.number().optional(),
        detalhamento: z.any().optional(),
        ordem: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await credDb.updateRtiOportunidade(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await credDb.deleteRtiOportunidade(input.id);
        return { success: true };
      }),
  }),

  // ===== RTI CENÁRIO & ALERTAS =====
  rtiCenario: router({
    list: protectedProcedure
      .input(z.object({ rtiId: z.number() }))
      .query(async ({ input }) => {
        return credDb.listRtiCenarioCompensacao(input.rtiId);
      }),
    upsert: protectedProcedure
      .input(z.object({
        rtiId: z.number(),
        items: z.array(z.object({
          tributo: z.string(),
          mediaMensal: z.number().optional(),
          ordem: z.number().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        await credDb.upsertRtiCenarioCompensacao(input.rtiId, input.items);
        return { success: true };
      }),
  }),
  rtiAlertas: router({
    list: protectedProcedure
      .input(z.object({ rtiId: z.number() }))
      .query(async ({ input }) => {
        return credDb.listRtiAlertas(input.rtiId);
      }),
    upsert: protectedProcedure
      .input(z.object({
        rtiId: z.number(),
        items: z.array(z.object({
          tipo: z.string(),
          texto: z.string(),
          ordem: z.number().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        await credDb.upsertRtiAlertas(input.rtiId, input.items);
        return { success: true };
      }),
  }),

  // ===== APURAÇÃO STATS =====
  apuracaoStats: protectedProcedure
    .input(z.object({
      periodoInicio: z.string().optional(),
      periodoFim: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return credDb.getApuracaoStats(input || {});
    }),

  // ===== RTI FULL =====
  rtiFull: protectedProcedure
    .input(z.object({ rtiId: z.number() }))
    .query(async ({ input }) => {
      return credDb.getRtiReportFull(input.rtiId);
    }),

  // ===== RETIFICAÇÃO =====
  retificacao: router({
    listByTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => credDb.listRetificacaoRecords(input.taskId)),
    listByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => credDb.getRetificacaoByCase(input.caseId)),
    create: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        caseId: z.number(),
        clienteId: z.number(),
        teseId: z.number().optional(),
        teseNome: z.string().optional(),
        tipoRetificacao: z.enum(['total', 'parcial']).default('total'),
        periodoInicio: z.string().optional(),
        periodoFim: z.string().optional(),
        valorApuradoRti: z.number().default(0),
        valorCreditoDisponivel: z.number().default(0),
        divergencia: z.number().default(0),
        divergenciaPct: z.number().default(0),
        alertaDivergencia: z.boolean().default(false),
        justificativaDivergencia: z.string().optional(),
        saldoPorGrupo: z.any().optional(),
        obrigacoesAcessorias: z.any().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await credDb.createRetificacaoRecord({
          ...input,
          registradoPorId: ctx.user.id,
          registradoPorNome: ctx.user.name || ctx.user.openId,
        });
        await credDb.logCreditAudit({
          entidade: 'retificacao' as any,
          entidadeId: result.id,
          acao: 'criou',
          descricao: `Retificação ${input.tipoRetificacao} registrada para tese ${input.teseNome || 'N/A'}`,
          usuarioId: ctx.user.id,
          usuarioNome: ctx.user.name || ctx.user.openId,
        });
        return result;
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.any() }))
      .mutation(async ({ input }) => credDb.updateRetificacaoRecord(input.id, input.data)),
    stats: protectedProcedure
      .input(z.object({ clienteId: z.number().optional() }).optional())
      .query(async ({ input }) => credDb.getRetificacaoStats(input?.clienteId)),
  }),

  // ===== GUIAS =====
  guias: router({
    list: protectedProcedure
      .input(z.object({
        taskId: z.number().optional(),
        caseId: z.number().optional(),
        clienteId: z.number().optional(),
        perdcompId: z.number().optional(),
      }))
      .query(async ({ input }) => credDb.listGuias(input)),
    create: protectedProcedure
      .input(z.object({
        taskId: z.number().optional(),
        caseId: z.number().optional(),
        clienteId: z.number(),
        perdcompId: z.number().optional(),
        cnpjGuia: z.string().optional(),
        codigoReceita: z.string().optional(),
        grupoTributo: z.string().optional(),
        periodoApuracao: z.string().optional(),
        dataVencimento: z.string().optional(),
        valorOriginal: z.number().default(0),
        valorMulta: z.number().default(0),
        valorJuros: z.number().default(0),
        valorTotal: z.number().default(0),
        valorCompensado: z.number().default(0),
        statusGuia: z.string().default('a_vencer'),
        validacaoCliente: z.boolean().default(false),
        guiaUrl: z.string().optional(),
        comprovanteUrl: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return credDb.createGuia({
          ...input,
          registradoPorId: ctx.user.id,
          registradoPorNome: ctx.user.name || ctx.user.openId,
        });
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.any() }))
      .mutation(async ({ input }) => credDb.updateGuia(input.id, input.data)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => credDb.deleteGuia(input.id)),
  }),

  // ===== PERDCOMP FULL =====
  perdcompFull: router({
    create: protectedProcedure
      .input(z.object({
        taskId: z.number().optional(),
        caseId: z.number().optional(),
        clienteId: z.number(),
        ledgerEntryId: z.number().optional(),
        numeroPerdcomp: z.string(),
        tipoDocumento: z.string().optional(),
        numeroControle: z.string().optional(),
        cnpjDeclarante: z.string().optional(),
        nomeEmpresarial: z.string().optional(),
        tipoCredito: z.string().optional(),
        oriundoAcaoJudicial: z.boolean().default(false),
        creditoSucedida: z.boolean().default(false),
        numeroDocArrecadacao: z.string().optional(),
        codigoReceita: z.string().optional(),
        grupoTributo: z.string().optional(),
        dataArrecadacao: z.string().optional(),
        periodoApuracao: z.string().optional(),
        valorCredito: z.number().default(0),
        valorDebitosCompensados: z.number().default(0),
        debitosCompensadosJson: z.any().optional(),
        saldoRemanescente: z.number().default(0),
        dataTransmissao: z.string().optional(),
        dataVencimentoGuia: z.string().optional(),
        guiaNumero: z.string().optional(),
        guiaUrl: z.string().optional(),
        comprovanteUrl: z.string().optional(),
        reciboUrl: z.string().optional(),
        status: z.string().default('transmitido'),
        despachoDecisorio: z.string().optional(),
        representanteNome: z.string().optional(),
        representanteCpf: z.string().optional(),
        versaoSistema: z.string().optional(),
        codigoSerpro: z.string().optional(),
        dataRecebimentoSerpro: z.string().optional(),
        feitoPelaEvox: z.boolean().default(true),
        modalidade: z.enum(['compensacao', 'ressarcimento', 'restituicao']).default('compensacao'),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await credDb.createPerdcompFull({
          ...input,
          registradoPorId: ctx.user.id,
          registradoPorNome: ctx.user.name || ctx.user.openId,
        });
        await credDb.logCreditAudit({
          entidade: 'perdcomp' as any,
          entidadeId: result.id,
          acao: 'criou',
          descricao: `PerdComp ${input.numeroPerdcomp} registrada (${input.modalidade})`,
          usuarioId: ctx.user.id,
          usuarioNome: ctx.user.name || ctx.user.openId,
        });
        return result;
      }),
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => credDb.searchPerdcomps(input.query)),
  }),

  // ===== GESTÃO COMPLETA DE CRÉDITOS =====
  gestaoCompleta: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input }) => credDb.getGestaoCompletaCreditos(input.clienteId)),

  // ===== AUTO-CREATE NEXT QUEUE TASK =====
  createNextQueueTask: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      clienteId: z.number(),
      fila: z.string(),
      titulo: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await credDb.createNextQueueTask({
        ...input,
        criadoPorId: ctx.user.id,
        criadoPorNome: ctx.user.name || ctx.user.openId,
      });
      await credDb.logCreditAudit({
        entidade: 'task' as any,
        entidadeId: result.id,
        acao: 'criou',
        descricao: `Tarefa automática criada para fila ${input.fila}`,
        usuarioId: ctx.user.id,
        usuarioNome: ctx.user.name || ctx.user.openId,
      });
      return result;
    }),

  // ===== OCR / PARSER DE GUIAS =====
  parseGuia: protectedProcedure
    .input(z.object({ fileUrl: z.string(), mimeType: z.string() }))
    .mutation(async ({ input }) => {
      return credDb.parseGuiaWithOcr(input.fileUrl, input.mimeType);
    }),

  uploadAndParseGuia: protectedProcedure
    .input(z.object({
      base64Data: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      clienteId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64Data, 'base64');
      const suffix = crypto.randomBytes(4).toString('hex');
      const key = `evox-fiscal/guias/${suffix}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      const ocrResult = await credDb.parseGuiaWithOcr(url, input.mimeType);
      let cnpjValidation = null;
      if (input.clienteId && ocrResult.cnpj) {
        cnpjValidation = await credDb.validateGuiaCnpj(ocrResult.cnpj, input.clienteId);
      }
      return { ...ocrResult, fileUrl: url, fileKey: key, cnpjValidation };
    }),

  validateGuiaCnpj: protectedProcedure
    .input(z.object({ cnpj: z.string(), clienteId: z.number() }))
    .query(async ({ input }) => {
      return credDb.validateGuiaCnpj(input.cnpj, input.clienteId);
    }),

  // ===== TAREFAS ATRASADAS =====
  tarefasAtrasadas: protectedProcedure
    .input(z.object({ fila: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return credDb.listTarefasAtrasadas(input?.fila);
    }),

  countAtrasadas: protectedProcedure
    .input(z.object({ fila: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return credDb.countTarefasAtrasadas(input?.fila);
    }),
});

// ===== COMBINED EXPORT =====
export const creditRecoveryRouter = router({
  suporte: suporteRouter,
  credito: creditoRouter,
  admin: adminRouter,
});
