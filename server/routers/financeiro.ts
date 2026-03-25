import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  listFornecedores,
  getFornecedorById,
  createFornecedor,
  updateFornecedor,
  deleteFornecedor,
  listCentrosCusto,
  getCentroCustoById,
  createCentroCusto,
  updateCentroCusto,
  listCategoriasFinanceiras,
  getCategoriaFinanceiraById,
  createCategoriaFinanceira,
  listContasAPagar,
  getContaPagarById,
  createContaPagar,
  updateContaPagar,
  listContasAReceber,
  getContaReceberById,
  createContaReceber,
  updateContaReceber,
  getDashboardFinanceiro,
  listAuditoriaFinanceira,
  createAuditoriaFinanceira,
} from "../db";

export const financeiroRouter = router({
  // FORNECEDORES
  fornecedor: router({
    list: publicProcedure.query(async () => {
      return listFornecedores();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getFornecedorById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          nome: z.string(),
          cnpjCpf: z.string(),
          email: z.string().optional(),
          telefone: z.string().optional(),
          endereco: z.string().optional(),
          banco: z.string().optional(),
          agencia: z.string().optional(),
          conta: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await createFornecedor({
          ...input,
          criadoPorId: ctx.user.id,
          ativo: 1,
          validado: 0,
        });

        // Registrar auditoria
        await createAuditoriaFinanceira({
          usuarioId: ctx.user.id,
          operacao: "Criar Fornecedor",
          tabela: "fornecedores",
          registroId: id || 0,
          ip: "",
          dispositivo: "",
          navegador: "",
        });

        return id;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          email: z.string().optional(),
          telefone: z.string().optional(),
          endereco: z.string().optional(),
          banco: z.string().optional(),
          agencia: z.string().optional(),
          conta: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await updateFornecedor(id, data);

        await createAuditoriaFinanceira({
          usuarioId: ctx.user.id,
          operacao: "Atualizar Fornecedor",
          tabela: "fornecedores",
          registroId: id,
          ip: "",
          dispositivo: "",
          navegador: "",
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteFornecedor(input.id);

        await createAuditoriaFinanceira({
          usuarioId: ctx.user.id,
          operacao: "Deletar Fornecedor",
          tabela: "fornecedores",
          registroId: input.id,
          ip: "",
          dispositivo: "",
          navegador: "",
        });
      }),
  }),

  // CENTROS DE CUSTO
  centroCusto: router({
    list: publicProcedure.query(async () => {
      return listCentrosCusto();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getCentroCustoById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          nome: z.string(),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await createCentroCusto({
          ...input,
          criadoPorId: ctx.user.id,
          ativo: 1,
        });

        await createAuditoriaFinanceira({
          usuarioId: ctx.user.id,
          operacao: "Criar Centro de Custo",
          tabela: "centros_custo",
          registroId: id || 0,
          ip: "",
          dispositivo: "",
          navegador: "",
        });

        return id;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await updateCentroCusto(id, data);

        await createAuditoriaFinanceira({
          usuarioId: ctx.user.id,
          operacao: "Atualizar Centro de Custo",
          tabela: "centros_custo",
          registroId: id,
          ip: "",
          dispositivo: "",
          navegador: "",
        });
      }),
  }),

  // CATEGORIAS FINANCEIRAS
  categoriaFinanceira: router({
    list: publicProcedure
      .input(z.object({ tipo: z.enum(["receita", "despesa"]).optional() }))
      .query(async ({ input }) => {
        return listCategoriasFinanceiras(input.tipo);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getCategoriaFinanceiraById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          nome: z.string(),
          tipo: z.enum(["receita", "despesa"]),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await createCategoriaFinanceira({
          ...input,
          criadoPorId: ctx.user.id,
          ativo: 1,
        });

        await createAuditoriaFinanceira({
          usuarioId: ctx.user.id,
          operacao: "Criar Categoria Financeira",
          tabela: "categorias_financeiras",
          registroId: id || 0,
          ip: "",
          dispositivo: "",
          navegador: "",
        });

        return id;
      }),
  }),

  // CONTAS A PAGAR
  contaPagar: router({
    list: publicProcedure
      .input(
        z.object({
          status: z.string().optional(),
          fornecedorId: z.number().optional(),
          competencia: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return listContasAPagar(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getContaPagarById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          fornecedorId: z.number(),
          descricao: z.string(),
          valor: z.string(),
          dataVencimento: z.string(),
          competencia: z.string(),
          categoriaId: z.number().optional(),
          centroCustoId: z.number().optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await createContaPagar({
          ...input,
          valor: parseFloat(input.valor).toString() as any,
          dataVencimento: input.dataVencimento,
          criadoPorId: ctx.user.id,
          status: "pendente",
        });

        await createAuditoriaFinanceira({
          usuarioId: ctx.user.id,
          operacao: "Criar Conta a Pagar",
          tabela: "contas_pagar",
          registroId: id || 0,
          ip: "",
          dispositivo: "",
          navegador: "",
        });

        return id;
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pendente", "aprovado", "pago", "cancelado", "atrasado"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await updateContaPagar(input.id, { status: input.status });

        await createAuditoriaFinanceira({
          usuarioId: ctx.user.id,
          operacao: `Atualizar Status Conta a Pagar para ${input.status}`,
          tabela: "contas_pagar",
          registroId: input.id,
          ip: "",
          dispositivo: "",
          navegador: "",
        });
      }),
  }),

  // CONTAS A RECEBER
  contaReceber: router({
    list: publicProcedure
      .input(
        z.object({
          status: z.string().optional(),
          clienteId: z.number().optional(),
          competencia: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return listContasAReceber(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getContaReceberById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          clienteId: z.number(),
          descricao: z.string(),
          valor: z.string(),
          dataVencimento: z.string(),
          competencia: z.string(),
          categoriaId: z.number().optional(),
          centroCustoId: z.number().optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await createContaReceber({
          ...input,
          valor: parseFloat(input.valor).toString() as any,
          dataVencimento: input.dataVencimento,
          criadoPorId: ctx.user.id,
          status: "emitido",
        });

        await createAuditoriaFinanceira({
          usuarioId: ctx.user.id,
          operacao: "Criar Conta a Receber",
          tabela: "contas_receber",
          registroId: id || 0,
          ip: "",
          dispositivo: "",
          navegador: "",
        });

        return id;
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["emitido", "vencido", "recebido", "cancelado", "atrasado"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await updateContaReceber(input.id, { status: input.status });

        await createAuditoriaFinanceira({
          usuarioId: ctx.user.id,
          operacao: `Atualizar Status Conta a Receber para ${input.status}`,
          tabela: "contas_receber",
          registroId: input.id,
          ip: "",
          dispositivo: "",
          navegador: "",
        });
      }),
  }),

  // DASHBOARD FINANCEIRO
  dashboard: router({
    getIndicadores: publicProcedure.query(async () => {
      return getDashboardFinanceiro();
    }),
  }),

  // AUDITORIA FINANCEIRA
  auditoria: router({
    list: protectedProcedure
      .input(
        z.object({
          usuarioId: z.number().optional(),
          operacao: z.string().optional(),
          tabela: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return listAuditoriaFinanceira(input);
      }),
  }),
});
