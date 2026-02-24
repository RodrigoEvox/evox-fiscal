import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as bibDb from "./dbBiblioteca";

// Helper to extract user info from ctx (User type is inferred from DB)
function getUser(ctx: any): { id: number; name: string } {
  return { id: getUser(ctx).id, name: (getUser(ctx).name) };
}

export const bibliotecaRouter = router({
  // ===== DASHBOARD =====
  dashboard: protectedProcedure.query(async () => {
    return bibDb.getBibliotecaDashboard();
  }),

  // ===== LIVROS =====
  livros: router({
    list: protectedProcedure.query(async () => {
      return bibDb.listLivros();
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return bibDb.getLivro(input.id);
    }),
    create: protectedProcedure.input(z.object({
      titulo: z.string().min(1),
      subtitulo: z.string().optional(),
      autores: z.string().min(1),
      editora: z.string().optional(),
      edicao: z.string().optional(),
      ano: z.number().optional(),
      isbn: z.string().optional(),
      idioma: z.string().optional(),
      categoria: z.string().optional(),
      subcategoria: z.string().optional(),
      tags: z.any().optional(),
      sinopse: z.string().optional(),
      capaUrl: z.string().optional(),
      capaFileKey: z.string().optional(),
      linkReferencia: z.string().optional(),
      classificacao: z.enum(['essencial', 'recomendado', 'avancado']).optional(),
      areaSugerida: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const result = await bibDb.createLivro({
        ...input,
        registradoPorId: getUser(ctx).id,
        registradoPorNome: (getUser(ctx).name),
      });
      await bibDb.createAuditoriaBib({
        acao: 'criar',
        entidadeTipo: 'livro',
        entidadeId: result?.id,
        entidadeNome: input.titulo,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
      return result;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      titulo: z.string().optional(),
      subtitulo: z.string().optional(),
      autores: z.string().optional(),
      editora: z.string().optional(),
      edicao: z.string().optional(),
      ano: z.number().optional(),
      isbn: z.string().optional(),
      idioma: z.string().optional(),
      categoria: z.string().optional(),
      subcategoria: z.string().optional(),
      tags: z.any().optional(),
      sinopse: z.string().optional(),
      capaUrl: z.string().optional(),
      capaFileKey: z.string().optional(),
      linkReferencia: z.string().optional(),
      classificacao: z.enum(['essencial', 'recomendado', 'avancado']).optional(),
      areaSugerida: z.string().optional(),
      status: z.enum(['ativo', 'inativo', 'descontinuado']).optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await bibDb.updateLivro(id, data);
      await bibDb.createAuditoriaBib({
        acao: 'editar',
        entidadeTipo: 'livro',
        entidadeId: id,
        entidadeNome: data.titulo,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const livro = await bibDb.getLivro(input.id);
      await bibDb.deleteLivro(input.id);
      await bibDb.createAuditoriaBib({
        acao: 'excluir',
        entidadeTipo: 'livro',
        entidadeId: input.id,
        entidadeNome: livro?.titulo,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
    }),
  }),

  // ===== EXEMPLARES =====
  exemplares: router({
    list: protectedProcedure.input(z.object({ livroId: z.number().optional() }).optional()).query(async ({ input }) => {
      return bibDb.listExemplares(input?.livroId);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return bibDb.getExemplar(input.id);
    }),
    create: protectedProcedure.input(z.object({
      livroId: z.number(),
      codigoPatrimonial: z.string().min(1),
      localizacao: z.string().optional(),
      condicao: z.enum(['novo', 'bom', 'regular', 'danificado']).optional(),
      dataEntrada: z.string().optional(),
      origem: z.enum(['aquisicao', 'doacao']).optional(),
      fornecedorId: z.number().optional(),
      dataCompra: z.string().optional(),
      valorCompra: z.string().optional(),
      doadorTipo: z.enum(['colaborador', 'parceiro', 'cliente', 'pessoa_fisica']).optional(),
      doadorNome: z.string().optional(),
      dataDoacao: z.string().optional(),
      observacoes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const result = await bibDb.createExemplar({
        ...input,
        registradoPorId: getUser(ctx).id,
        registradoPorNome: (getUser(ctx).name),
      });
      await bibDb.createAuditoriaBib({
        acao: 'criar',
        entidadeTipo: 'exemplar',
        entidadeId: result?.id,
        entidadeNome: input.codigoPatrimonial,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
      return result;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      codigoPatrimonial: z.string().optional(),
      localizacao: z.string().optional(),
      condicao: z.enum(['novo', 'bom', 'regular', 'danificado']).optional(),
      status: z.enum(['disponivel', 'emprestado', 'reservado', 'indisponivel', 'perdido', 'baixado']).optional(),
      motivoBaixa: z.string().optional(),
      observacoes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await bibDb.updateExemplar(id, data);
      await bibDb.createAuditoriaBib({
        acao: 'editar',
        entidadeTipo: 'exemplar',
        entidadeId: id,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await bibDb.deleteExemplar(input.id);
      await bibDb.createAuditoriaBib({
        acao: 'excluir',
        entidadeTipo: 'exemplar',
        entidadeId: input.id,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
    }),
  }),

  // ===== EMPRÉSTIMOS =====
  emprestimos: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      colaboradorId: z.number().optional(),
      livroId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return bibDb.listEmprestimos(input || undefined);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return bibDb.getEmprestimo(input.id);
    }),
    create: protectedProcedure.input(z.object({
      exemplarId: z.number(),
      livroId: z.number(),
      colaboradorId: z.number(),
      colaboradorNome: z.string(),
      dataRetirada: z.string(),
      dataPrevistaDevolucao: z.string(),
      termoAceito: z.number().optional(),
      checklistRetirada: z.any().optional(),
      observacoes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      // Check if collaborator is blocked
      const bloqueado = await bibDb.isColaboradorBloqueado(input.colaboradorId);
      if (bloqueado) {
        throw new Error('Colaborador está bloqueado para empréstimos');
      }
      // Get default loan limit from policies
      const limiteRenovacoes = parseInt(await bibDb.getPoliticaValor('limite_renovacoes') || '2');
      const result = await bibDb.createEmprestimo({
        ...input,
        limiteRenovacoes,
        registradoPorId: getUser(ctx).id,
        registradoPorNome: (getUser(ctx).name),
      });
      await bibDb.createAuditoriaBib({
        acao: 'emprestar',
        entidadeTipo: 'emprestimo',
        entidadeId: result?.id,
        entidadeNome: `${input.colaboradorNome} - Exemplar #${input.exemplarId}`,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
      return result;
    }),
    renovar: protectedProcedure.input(z.object({
      id: z.number(),
      novaPrevista: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const result = await bibDb.renovarEmprestimo(input.id, input.novaPrevista);
      if (result.success) {
        await bibDb.createAuditoriaBib({
          acao: 'renovar',
          entidadeTipo: 'emprestimo',
          entidadeId: input.id,
          usuarioId: getUser(ctx).id,
          usuarioNome: (getUser(ctx).name),
        });
      }
      return result;
    }),
    devolver: protectedProcedure.input(z.object({
      id: z.number(),
      checklistDevolucao: z.any().optional(),
      dataEfetiva: z.string(),
    })).mutation(async ({ input, ctx }) => {
      await bibDb.devolverEmprestimo(input.id, input.checklistDevolucao, input.dataEfetiva);
      await bibDb.createAuditoriaBib({
        acao: 'devolver',
        entidadeTipo: 'emprestimo',
        entidadeId: input.id,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
    }),
  }),

  // ===== RESERVAS =====
  reservas: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      colaboradorId: z.number().optional(),
      livroId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return bibDb.listReservas(input || undefined);
    }),
    create: protectedProcedure.input(z.object({
      livroId: z.number(),
      colaboradorId: z.number(),
      colaboradorNome: z.string(),
      dataReserva: z.string(),
      observacoes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const bloqueado = await bibDb.isColaboradorBloqueado(input.colaboradorId);
      if (bloqueado) {
        throw new Error('Colaborador está bloqueado para reservas');
      }
      const result = await bibDb.createReserva(input);
      await bibDb.createAuditoriaBib({
        acao: 'reservar',
        entidadeTipo: 'reserva',
        entidadeId: result?.id,
        entidadeNome: `${input.colaboradorNome} - Livro #${input.livroId}`,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
      return result;
    }),
    cancelar: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await bibDb.cancelarReserva(input.id);
      await bibDb.createAuditoriaBib({
        acao: 'excluir',
        entidadeTipo: 'reserva',
        entidadeId: input.id,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
    }),
  }),

  // ===== OCORRÊNCIAS =====
  ocorrenciasBib: router({
    list: protectedProcedure.input(z.object({
      tipo: z.string().optional(),
      colaboradorId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return bibDb.listOcorrencias(input || undefined);
    }),
    create: protectedProcedure.input(z.object({
      tipo: z.enum(['atraso_recorrente', 'devolvido_danificado', 'extravio_perda', 'divergencia_condicao', 'ajuste_manual']),
      emprestimoId: z.number().optional(),
      exemplarId: z.number().optional(),
      colaboradorId: z.number().optional(),
      colaboradorNome: z.string().optional(),
      descricao: z.string().min(1),
      evidenciaUrl: z.string().optional(),
      evidenciaFileKey: z.string().optional(),
      acaoAplicada: z.enum(['bloqueio', 'advertencia', 'reposicao', 'baixa', 'nenhuma']).optional(),
      diasBloqueio: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const result = await bibDb.createOcorrencia({
        ...input,
        responsavelId: getUser(ctx).id,
        responsavelNome: (getUser(ctx).name),
      });
      // If action is bloqueio, create a block
      if (input.acaoAplicada === 'bloqueio' && input.colaboradorId) {
        const dataFim = input.diasBloqueio
          ? new Date(Date.now() + input.diasBloqueio * 86400000).toISOString().slice(0, 10)
          : undefined;
        await bibDb.createBloqueio({
          colaboradorId: input.colaboradorId,
          colaboradorNome: input.colaboradorNome || '',
          motivo: input.descricao,
          ocorrenciaId: result?.id,
          dataInicio: new Date().toISOString().slice(0, 10),
          dataFim,
          criadoPorId: getUser(ctx).id,
          criadoPorNome: (getUser(ctx).name),
        });
      }
      return result;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      acaoAplicada: z.enum(['bloqueio', 'advertencia', 'reposicao', 'baixa', 'nenhuma']).optional(),
      descricao: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await bibDb.updateOcorrencia(id, data);
    }),
  }),

  // ===== FORNECEDORES / DOADORES =====
  fornecedores: router({
    list: protectedProcedure.query(async () => {
      return bibDb.listFornecedoresDoadores();
    }),
    create: protectedProcedure.input(z.object({
      nome: z.string().min(1),
      tipo: z.enum(['fornecedor', 'doador', 'ambos']),
      contato: z.string().optional(),
      email: z.string().optional(),
      telefone: z.string().optional(),
      observacoes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const result = await bibDb.createFornecedorDoador(input);
      await bibDb.createAuditoriaBib({
        acao: 'criar',
        entidadeTipo: 'fornecedor',
        entidadeId: result?.id,
        entidadeNome: input.nome,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
      return result;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      nome: z.string().optional(),
      tipo: z.enum(['fornecedor', 'doador', 'ambos']).optional(),
      contato: z.string().optional(),
      email: z.string().optional(),
      telefone: z.string().optional(),
      observacoes: z.string().optional(),
      ativo: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await bibDb.updateFornecedorDoador(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await bibDb.deleteFornecedorDoador(input.id);
    }),
  }),

  // ===== POLÍTICAS =====
  politicas: router({
    list: protectedProcedure.query(async () => {
      return bibDb.listPoliticas();
    }),
    upsert: protectedProcedure.input(z.object({
      chave: z.string(),
      valor: z.string(),
      descricao: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      await bibDb.upsertPolitica({
        ...input,
        updatedPorId: getUser(ctx).id,
        updatedPorNome: (getUser(ctx).name),
      });
      await bibDb.createAuditoriaBib({
        acao: 'editar',
        entidadeTipo: 'politica',
        entidadeNome: input.chave,
        detalhes: { valor: input.valor },
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
    }),
  }),

  // ===== AUDITORIA =====
  auditoria: router({
    list: protectedProcedure.input(z.object({
      entidadeTipo: z.string().optional(),
      usuarioId: z.number().optional(),
      limit: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return bibDb.listAuditoria(input || undefined);
    }),
  }),

  // ===== BLOQUEIOS =====
  bloqueios: router({
    list: protectedProcedure.input(z.object({ colaboradorId: z.number().optional() }).optional()).query(async ({ input }) => {
      return bibDb.listBloqueios(input?.colaboradorId);
    }),
    desbloquear: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await bibDb.desbloquearColaborador(input.id);
      await bibDb.createAuditoriaBib({
        acao: 'desbloquear',
        entidadeTipo: 'bloqueio',
        entidadeId: input.id,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
    }),
    verificar: protectedProcedure.input(z.object({ colaboradorId: z.number() })).query(async ({ input }) => {
      return bibDb.isColaboradorBloqueado(input.colaboradorId);
    }),
  }),
});
