import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as conDb from "./dbContratos";
import * as db from "./db";

function getUser(ctx: any): { id: number; name: string } {
  return { id: ctx.user.id, name: ctx.user.name };
}

const contratosRouter = router({
  // ---- Dashboard ----
  dashboard: protectedProcedure
    .input(z.object({
      responsavelId: z.number().optional(),
      parceiroId: z.number().optional(),
      periodoInicio: z.string().optional(),
      periodoFim: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return conDb.getContratosDashboard(input || {});
    }),

  // ---- CRUD ----
  list: protectedProcedure
    .input(z.object({
      fila: z.string().optional(),
      status: z.string().optional(),
      tipo: z.string().optional(),
      clienteId: z.number().optional(),
      parceiroId: z.number().optional(),
      responsavelId: z.number().optional(),
      busca: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return conDb.listContratos(input || {});
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return conDb.getContratoById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      clienteNome: z.string().optional(),
      clienteCnpj: z.string().optional(),
      parceiroId: z.number().optional(),
      parceiroNome: z.string().optional(),
      servicoId: z.number().optional(),
      servicoNome: z.string().optional(),
      tipo: z.enum(['prestacao_servicos', 'honorarios', 'parceria', 'nda', 'aditivo', 'distrato', 'outro']).optional(),
      fila: z.enum(['elaboracao', 'revisao', 'assinatura', 'vigencia', 'renovacao', 'encerrado']).optional(),
      prioridade: z.enum(['urgente', 'alta', 'media', 'baixa']).optional(),
      valorContrato: z.string().optional(),
      formaCobranca: z.enum(['percentual_credito', 'valor_fixo', 'mensalidade', 'exito', 'hibrido', 'entrada_exito', 'valor_fixo_parcelado']).optional(),
      percentualExito: z.string().optional(),
      valorEntrada: z.string().optional(),
      quantidadeParcelas: z.number().optional(),
      valorParcela: z.string().optional(),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      dataVencimento: z.string().optional(),
      slaHoras: z.number().optional(),
      responsavelId: z.number().optional(),
      responsavelNome: z.string().optional(),
      revisorId: z.number().optional(),
      revisorNome: z.string().optional(),
      objetoContrato: z.string().optional(),
      clausulasEspeciais: z.string().optional(),
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = getUser(ctx);
      return conDb.createContrato({
        ...input,
        criadoPorId: user.id,
        criadoPorNome: user.name,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      clienteNome: z.string().optional(),
      clienteCnpj: z.string().optional(),
      parceiroId: z.number().nullable().optional(),
      parceiroNome: z.string().nullable().optional(),
      servicoId: z.number().nullable().optional(),
      servicoNome: z.string().nullable().optional(),
      tipo: z.enum(['prestacao_servicos', 'honorarios', 'parceria', 'nda', 'aditivo', 'distrato', 'outro']).optional(),
      prioridade: z.enum(['urgente', 'alta', 'media', 'baixa']).optional(),
      valorContrato: z.string().optional(),
      formaCobranca: z.enum(['percentual_credito', 'valor_fixo', 'mensalidade', 'exito', 'hibrido', 'entrada_exito', 'valor_fixo_parcelado']).optional(),
      percentualExito: z.string().optional(),
      valorEntrada: z.string().optional(),
      quantidadeParcelas: z.number().nullable().optional(),
      valorParcela: z.string().optional(),
      dataInicio: z.string().nullable().optional(),
      dataFim: z.string().nullable().optional(),
      dataAssinatura: z.string().nullable().optional(),
      dataVencimento: z.string().nullable().optional(),
      slaHoras: z.number().nullable().optional(),
      responsavelId: z.number().nullable().optional(),
      responsavelNome: z.string().nullable().optional(),
      revisorId: z.number().nullable().optional(),
      revisorNome: z.string().nullable().optional(),
      contratoUrl: z.string().nullable().optional(),
      contratoAssinadoUrl: z.string().nullable().optional(),
      objetoContrato: z.string().nullable().optional(),
      clausulasEspeciais: z.string().nullable().optional(),
      observacoes: z.string().nullable().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = getUser(ctx);
      const { id, ...data } = input;
      return conDb.updateContrato(id, data, user.id, user.name);
    }),

  // ---- Filas ----
  changeFila: protectedProcedure
    .input(z.object({
      id: z.number(),
      novaFila: z.enum(['elaboracao', 'revisao', 'assinatura', 'vigencia', 'renovacao', 'encerrado']),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = getUser(ctx);
      return conDb.updateContratoFila(input.id, input.novaFila, user.id, user.name);
    }),

  changeStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      novoStatus: z.enum(['a_fazer', 'fazendo', 'feito', 'concluido']),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = getUser(ctx);
      return conDb.updateContratoStatus(input.id, input.novoStatus, user.id, user.name);
    }),

  listByFila: protectedProcedure
    .input(z.object({
      fila: z.string(),
      status: z.string().optional(),
      responsavelId: z.number().optional(),
      busca: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { fila, ...filters } = input;
      return conDb.listContratosByFila(fila, filters);
    }),

  filaStats: protectedProcedure
    .input(z.object({ fila: z.string() }))
    .query(async ({ input }) => {
      return conDb.getFilaStats(input.fila);
    }),

  // ---- Documentos ----
  documentos: router({
    list: protectedProcedure
      .input(z.object({ contratoId: z.number() }))
      .query(async ({ input }) => {
        return conDb.listContratoDocumentos(input.contratoId);
      }),

    create: protectedProcedure
      .input(z.object({
        contratoId: z.number(),
        nome: z.string(),
        tipo: z.enum(['minuta', 'contrato_final', 'aditivo', 'distrato', 'procuracao', 'nda', 'comprovante', 'outro']).optional(),
        versao: z.number().optional(),
        url: z.string(),
        tamanho: z.number().optional(),
        mimeType: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = getUser(ctx);
        return conDb.createContratoDocumento({
          ...input,
          uploadPorId: user.id,
          uploadPorNome: user.name,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return conDb.deleteContratoDocumento(input.id);
      }),
  }),

  // ---- Histórico ----
  historico: protectedProcedure
    .input(z.object({ contratoId: z.number() }))
    .query(async ({ input }) => {
      return conDb.listContratoHistorico(input.contratoId);
    }),

  // ---- Clientes e Parceiros (para dropdowns) ----
  clientesList: protectedProcedure.query(async () => {
    return db.listClientes();
  }),

  parceirosList: protectedProcedure.query(async () => {
    return db.listParceiros();
  }),

  usuariosList: protectedProcedure.query(async () => {
    return db.listUsers();
  }),
});

export { contratosRouter };
