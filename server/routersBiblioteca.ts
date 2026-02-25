import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import * as bibDb from "./dbBiblioteca";
import * as db from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import crypto from "crypto";

// Helper to extract user info from ctx (User type is inferred from DB)
function getUser(ctx: any): { id: number; name: string } {
  return { id: ctx.user.id, name: ctx.user.name };
}

/**
 * Generates the responsibility term PDF for a loan, uploads to S3,
 * updates the emprestimo record with the PDF URL, and sends email to the collaborator.
 */
async function generateAndStoreTermoPdf(emprestimoId: number, colaboradorId: number) {
  const { createPDF, addHeader, addSectionTitle, addTable, addFooter, fmtDate } = await import('./pdfGenerator');

  const emprestimo = await bibDb.getEmprestimo(emprestimoId);
  if (!emprestimo) throw new Error('Empréstimo não encontrado');

  const livro = await bibDb.getLivro(emprestimo.livroId);
  const exemplar = await bibDb.getExemplar(emprestimo.exemplarId);
  const colaborador = colaboradorId ? await db.getColaboradorById(colaboradorId) : null;

  // Look up setor name
  let setorNome = '-';
  if (colaborador?.setorId) {
    try {
      const setores = await db.listSetores();
      const setor = setores.find((s: any) => s.id === colaborador.setorId);
      if (setor) setorNome = setor.nome;
    } catch { /* ignore */ }
  }

  const doc = createPDF();
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  // Pre-fetch signature images if available
  let sigColabBuf: Buffer | null = null;
  let sigBibBuf: Buffer | null = null;
  if (emprestimo.assinaturaColaboradorUrl) {
    try {
      const resp = await globalThis.fetch(emprestimo.assinaturaColaboradorUrl);
      if (resp.ok) sigColabBuf = Buffer.from(await resp.arrayBuffer());
    } catch { /* ignore */ }
  }
  if (emprestimo.assinaturaBibliotecarioUrl) {
    try {
      const resp = await globalThis.fetch(emprestimo.assinaturaBibliotecarioUrl);
      if (resp.ok) sigBibBuf = Buffer.from(await resp.arrayBuffer());
    } catch { /* ignore */ }
  }

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
    addHeader(doc, 'Termo de Responsabilidade — Biblioteca Evox', `Evox Fiscal — Gestão RH | Gerado em ${dataHora}`);

    addSectionTitle(doc, 'Dados do Colaborador');
    addTable(doc,
      [{ header: 'Campo', key: 'campo', width: 150 }, { header: 'Informação', key: 'valor', width: 350 }],
      [
        { campo: 'Nome Completo', valor: emprestimo.colaboradorNome || '-' },
        { campo: 'CPF', valor: colaborador?.cpf || '-' },
        { campo: 'Cargo', valor: colaborador?.cargo || '-' },
        { campo: 'Setor', valor: setorNome },
        { campo: 'E-mail', valor: colaborador?.email || colaborador?.emailCorporativo || '-' },
        { campo: 'Telefone', valor: colaborador?.telefone || '-' },
      ]
    );

    addSectionTitle(doc, 'Dados do Livro');
    addTable(doc,
      [{ header: 'Campo', key: 'campo', width: 150 }, { header: 'Informação', key: 'valor', width: 350 }],
      [
        { campo: 'Título', valor: livro?.titulo || '-' },
        { campo: 'Autor(es)', valor: livro?.autores || '-' },
        { campo: 'Editora', valor: livro?.editora || '-' },
        { campo: 'ISBN', valor: livro?.isbn || '-' },
        { campo: 'Edição', valor: livro?.edicao || '-' },
        { campo: 'Categoria', valor: livro?.categoria || '-' },
      ]
    );

    addSectionTitle(doc, 'Dados do Exemplar');
    addTable(doc,
      [{ header: 'Campo', key: 'campo', width: 150 }, { header: 'Informação', key: 'valor', width: 350 }],
      [
        { campo: 'Código Patrimonial', valor: exemplar?.codigoPatrimonial || '-' },
        { campo: 'Localização', valor: exemplar?.localizacao || '-' },
        { campo: 'Condição', valor: (exemplar?.condicao || '-').charAt(0).toUpperCase() + (exemplar?.condicao || '-').slice(1) },
      ]
    );

    addSectionTitle(doc, 'Dados do Empréstimo');
    addTable(doc,
      [{ header: 'Campo', key: 'campo', width: 150 }, { header: 'Informação', key: 'valor', width: 350 }],
      [
        { campo: 'Nº Empréstimo', valor: `#${emprestimo.id}` },
        { campo: 'Data de Retirada', valor: emprestimo.dataRetirada ? fmtDate(emprestimo.dataRetirada) : '-' },
        { campo: 'Data Prevista Devolução', valor: emprestimo.dataPrevistaDevolucao ? fmtDate(emprestimo.dataPrevistaDevolucao) : '-' },
        { campo: 'Registrado por', valor: emprestimo.registradoPorNome || '-' },
        { campo: 'Observações', valor: emprestimo.observacoes || 'Nenhuma' },
      ]
    );

    addSectionTitle(doc, 'Cláusulas e Condições');
    const clausulas = [
      '1. O colaborador declara ter recebido o exemplar acima descrito em bom estado de conservação, comprometendo-se a devolvê-lo nas mesmas condições.',
      '2. O prazo máximo para devolução é a data prevista acima indicada, podendo ser renovado mediante solicitação prévia, desde que não haja reservas pendentes.',
      '3. Em caso de atraso na devolução, o colaborador estará sujeito a suspensão temporária do direito de empréstimo, conforme política vigente da Biblioteca Evox.',
      '4. Em caso de perda, extravio ou dano ao exemplar, o colaborador se compromete a repor o material ou ressarcir o valor equivalente à reposição.',
      '5. O colaborador se compromete a não emprestar, ceder ou reproduzir integralmente a obra sem autorização expressa da Biblioteca Evox.',
      '6. A Biblioteca Evox reserva-se o direito de solicitar a devolução antecipada do exemplar, caso necessário, mediante comunicação prévia ao colaborador.',
    ];
    doc.fontSize(8.5).fillColor('#374151');
    clausulas.forEach(c => {
      doc.text(c, 40, undefined, { width: 515, lineGap: 2 });
      doc.moveDown(0.5);
    });

    doc.moveDown(1.5);

    // Signatures section
    const sigY = doc.y;
    const leftX = 40;
    const rightX = 310;
    const lineWidth = 200;

    // Embed digital signatures if available
    if (sigColabBuf) {
      try { doc.image(sigColabBuf, leftX + 25, sigY - 55, { width: 150, height: 50 }); } catch { /* ignore */ }
    }
    if (sigBibBuf) {
      try { doc.image(sigBibBuf, rightX + 25, sigY - 55, { width: 150, height: 50 }); } catch { /* ignore */ }
    }

    doc.moveTo(leftX, sigY).lineTo(leftX + lineWidth, sigY).strokeColor('#9ca3af').lineWidth(0.5).stroke();
    doc.fontSize(8).fillColor('#374151').text(emprestimo.colaboradorNome || 'Colaborador', leftX, sigY + 5, { width: lineWidth, align: 'center' });
    doc.fontSize(7).fillColor('#9ca3af').text('Colaborador Responsável', leftX, sigY + 17, { width: lineWidth, align: 'center' });

    doc.moveTo(rightX, sigY).lineTo(rightX + lineWidth, sigY).strokeColor('#9ca3af').lineWidth(0.5).stroke();
    doc.fontSize(8).fillColor('#374151').text(emprestimo.registradoPorNome || 'Responsável', rightX, sigY + 5, { width: lineWidth, align: 'center' });
    doc.fontSize(7).fillColor('#9ca3af').text('Responsável pela Biblioteca', rightX, sigY + 17, { width: lineWidth, align: 'center' });

    doc.moveDown(2);
    addFooter(doc);
    doc.end();
  });

  // Upload PDF to S3
  const suffix = crypto.randomBytes(4).toString('hex');
  const pdfKey = `biblioteca/termos/termo-${emprestimoId}-${suffix}.pdf`;
  const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, 'application/pdf');

  // Update emprestimo with PDF URL
  await bibDb.updateEmprestimo(emprestimoId, { termoPdfUrl: pdfUrl } as any);

  // Send email notification to collaborator if they have an email
  const emailDest = colaborador?.emailCorporativo || colaborador?.email;
  if (emailDest) {
    try {
      await db.createNotificacao({
        tipo: 'biblioteca_vencimento' as any,
        titulo: `Termo de Responsabilidade - Empréstimo #${emprestimoId}`,
        mensagem: `Olá ${emprestimo.colaboradorNome}, seu empréstimo do livro "${livro?.titulo || ''}" foi registrado. O termo de responsabilidade está disponível para download. Prazo de devolução: ${emprestimo.dataPrevistaDevolucao ? fmtDate(emprestimo.dataPrevistaDevolucao) : '-'}.`,
        lida: false,
        usuarioId: colaborador?.userId || null,
      } as any);
      // Mark email as sent
      await bibDb.updateEmprestimo(emprestimoId, { termoEnviadoEmail: 1 } as any);
      console.log(`[Biblioteca] Notificação de termo enviada para colaborador ${emprestimo.colaboradorNome} (empréstimo #${emprestimoId})`);
    } catch (err) {
      console.error('[Biblioteca] Erro ao enviar notificação de termo:', err);
    }
  }

  // Also notify owner
  try {
    await notifyOwner({
      title: `Novo Empréstimo Biblioteca #${emprestimoId}`,
      content: `Colaborador: ${emprestimo.colaboradorNome}\nLivro: ${livro?.titulo || '-'}\nPrazo: ${emprestimo.dataPrevistaDevolucao || '-'}\nTermo PDF gerado e armazenado.`,
    });
  } catch { /* ignore */ }

  return pdfUrl;
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
    uploadCapa: protectedProcedure.input(z.object({
      livroId: z.number(),
      base64Data: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.base64Data, 'base64');
      const suffix = crypto.randomBytes(4).toString('hex');
      const ext = input.fileName.split('.').pop() || 'jpg';
      const fileKey = `evox-fiscal/biblioteca/capas/${input.livroId}-${suffix}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      await bibDb.updateLivro(input.livroId, { capaUrl: url, capaFileKey: fileKey });
      await bibDb.createAuditoriaBib({
        acao: 'editar',
        entidadeTipo: 'livro',
        entidadeId: input.livroId,
        entidadeNome: `Upload de capa: ${input.fileName}`,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });
      return { url, fileKey };
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
      assinaturaColaboradorUrl: z.string().optional(),
      assinaturaBibliotecarioUrl: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      // Check if collaborator is blocked
      const bloqueado = await bibDb.isColaboradorBloqueado(input.colaboradorId);
      if (bloqueado) {
        throw new Error('Colaborador está bloqueado para empréstimos');
      }

      // Upload signature data URLs to S3 if provided
      let assinaturaColabUrl: string | undefined;
      let assinaturaBibUrl: string | undefined;
      if (input.assinaturaColaboradorUrl && input.assinaturaColaboradorUrl.startsWith('data:')) {
        const base64Data = input.assinaturaColaboradorUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const suffix = crypto.randomBytes(4).toString('hex');
        const key = `biblioteca/assinaturas/new-colab-${suffix}.png`;
        const { url } = await storagePut(key, buffer, 'image/png');
        assinaturaColabUrl = url;
      }
      if (input.assinaturaBibliotecarioUrl && input.assinaturaBibliotecarioUrl.startsWith('data:')) {
        const base64Data = input.assinaturaBibliotecarioUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const suffix = crypto.randomBytes(4).toString('hex');
        const key = `biblioteca/assinaturas/new-bib-${suffix}.png`;
        const { url } = await storagePut(key, buffer, 'image/png');
        assinaturaBibUrl = url;
      }

      // Get default loan limit from policies
      const limiteRenovacoes = parseInt(await bibDb.getPoliticaValor('limite_renovacoes') || '2');
      const result = await bibDb.createEmprestimo({
        ...input,
        assinaturaColaboradorUrl: assinaturaColabUrl || undefined,
        assinaturaBibliotecarioUrl: assinaturaBibUrl || undefined,
        limiteRenovacoes,
        registradoPorId: getUser(ctx).id,
        registradoPorNome: (getUser(ctx).name),
      } as any);
      await bibDb.createAuditoriaBib({
        acao: 'emprestar',
        entidadeTipo: 'emprestimo',
        entidadeId: result?.id,
        entidadeNome: `${input.colaboradorNome} - Exemplar #${input.exemplarId}`,
        usuarioId: getUser(ctx).id,
        usuarioNome: (getUser(ctx).name),
      });

      // Auto-generate term PDF and upload to S3 (fire-and-forget)
      if (result?.id) {
        generateAndStoreTermoPdf(result.id, input.colaboradorId).catch(err => {
          console.error('[Biblioteca] Erro ao gerar termo PDF automático:', err);
        });
      }

      return result;
    }),
    // Save signature to an existing emprestimo
    salvarAssinatura: protectedProcedure.input(z.object({
      emprestimoId: z.number(),
      tipo: z.enum(['colaborador', 'bibliotecario']),
      assinaturaDataUrl: z.string(),
    })).mutation(async ({ input, ctx }) => {
      // Upload signature image to S3
      const base64Data = input.assinaturaDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const suffix = crypto.randomBytes(4).toString('hex');
      const key = `biblioteca/assinaturas/${input.emprestimoId}-${input.tipo}-${suffix}.png`;
      const { url } = await storagePut(key, buffer, 'image/png');

      // Update emprestimo record
      const updateData = input.tipo === 'colaborador'
        ? { assinaturaColaboradorUrl: url }
        : { assinaturaBibliotecarioUrl: url };
      await bibDb.updateEmprestimo(input.emprestimoId, updateData as any);

      await bibDb.createAuditoriaBib({
        acao: 'ajuste_manual',
        entidadeTipo: 'emprestimo',
        entidadeId: input.emprestimoId,
        entidadeNome: `Assinatura ${input.tipo}`,
        usuarioId: getUser(ctx).id,
        usuarioNome: getUser(ctx).name,
      });

      // Re-generate PDF with signature embedded
      const emp = await bibDb.getEmprestimo(input.emprestimoId);
      if (emp) {
        generateAndStoreTermoPdf(input.emprestimoId, emp.colaboradorId).catch(err => {
          console.error('[Biblioteca] Erro ao regenerar termo PDF com assinatura:', err);
        });
      }

      return { url };
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

  // ===== AUTOATENDIMENTO DO COLABORADOR =====
  autoatendimento: router({
    // Get the colaborador linked to the current user
    meuPerfil: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const colab = await db.getColaboradorByUserId(userId);
      return colab;
    }),
    // Catalog search (public for logged-in users)
    catalogo: protectedProcedure.input(z.object({
      busca: z.string().optional(),
      categoria: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      const livros = await bibDb.listLivros();
      const exemplares = await bibDb.listExemplares();
      // Build availability map
      const disponibilidade = new Map<number, { total: number; disponiveis: number }>();
      exemplares.forEach((ex: any) => {
        const cur = disponibilidade.get(ex.livroId) || { total: 0, disponiveis: 0 };
        cur.total++;
        if (ex.status === 'disponivel') cur.disponiveis++;
        disponibilidade.set(ex.livroId, cur);
      });
      let filtered = livros;
      if (input?.busca) {
        const q = input.busca.toLowerCase();
        filtered = filtered.filter((l: any) =>
          l.titulo?.toLowerCase().includes(q) ||
          l.autores?.toLowerCase().includes(q) ||
          l.isbn?.toLowerCase().includes(q) ||
          l.categoria?.toLowerCase().includes(q)
        );
      }
      if (input?.categoria && input.categoria !== 'todas') {
        filtered = filtered.filter((l: any) => l.categoria === input.categoria);
      }
      return filtered.map((l: any) => ({
        ...l,
        disponibilidade: disponibilidade.get(l.id) || { total: 0, disponiveis: 0 },
      }));
    }),
    // Get categories for filter
    categorias: protectedProcedure.query(async () => {
      const livros = await bibDb.listLivros();
      const cats = new Set<string>();
      livros.forEach((l: any) => { if (l.categoria) cats.add(l.categoria); });
      return Array.from(cats).sort();
    }),
    // My loans
    meusEmprestimos: protectedProcedure.query(async ({ ctx }) => {
      const colab = await db.getColaboradorByUserId(ctx.user.id);
      if (!colab) return [];
      return bibDb.listEmprestimos({ colaboradorId: colab.id });
    }),
    // My reservations
    minhasReservas: protectedProcedure.query(async ({ ctx }) => {
      const colab = await db.getColaboradorByUserId(ctx.user.id);
      if (!colab) return [];
      return bibDb.listReservas({ colaboradorId: colab.id });
    }),
    // Request reservation (self-service)
    reservar: protectedProcedure.input(z.object({
      livroId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const colab = await db.getColaboradorByUserId(ctx.user.id);
      if (!colab) throw new Error('Voc\u00ea n\u00e3o est\u00e1 vinculado a um colaborador. Solicite ao RH.');
      const bloqueado = await bibDb.isColaboradorBloqueado(colab.id);
      if (bloqueado) throw new Error('Voc\u00ea est\u00e1 bloqueado para empr\u00e9stimos na biblioteca.');
      // Check if already has active reservation for this book
      const minhasReservas = await bibDb.listReservas({ colaboradorId: colab.id, livroId: input.livroId });
      const jaReservou = minhasReservas.some((r: any) => r.status === 'ativa');
      if (jaReservou) throw new Error('Voc\u00ea j\u00e1 possui uma reserva ativa para este livro.');
      const hoje = new Date().toISOString().split('T')[0];
      const result = await bibDb.createReserva({
        livroId: input.livroId,
        colaboradorId: colab.id,
        colaboradorNome: colab.nomeCompleto,
        dataReserva: hoje,
      } as any);
      await bibDb.createAuditoriaBib({
        acao: 'reservar',
        entidadeTipo: 'emprestimo',
        entidadeId: result?.id,
        entidadeNome: `Reserva autoatendimento - ${colab.nomeCompleto}`,
        usuarioId: ctx.user.id,
        usuarioNome: ctx.user.name,
      });
      return result;
    }),
    // Request renewal (self-service)
    renovar: protectedProcedure.input(z.object({
      emprestimoId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const colab = await db.getColaboradorByUserId(ctx.user.id);
      if (!colab) throw new Error('Voc\u00ea n\u00e3o est\u00e1 vinculado a um colaborador.');
      const emp = await bibDb.getEmprestimo(input.emprestimoId);
      if (!emp) throw new Error('Empr\u00e9stimo n\u00e3o encontrado.');
      if (emp.colaboradorId !== colab.id) throw new Error('Este empr\u00e9stimo n\u00e3o pertence a voc\u00ea.');
      const novaPrev = new Date(emp.dataPrevistaDevolucao);
      novaPrev.setDate(novaPrev.getDate() + 14);
      const result = await bibDb.renovarEmprestimo(input.emprestimoId, novaPrev.toISOString().split('T')[0]);
      if (result.success) {
        await bibDb.createAuditoriaBib({
          acao: 'renovar',
          entidadeTipo: 'emprestimo',
          entidadeId: input.emprestimoId,
          entidadeNome: `Renova\u00e7\u00e3o autoatendimento - ${colab.nomeCompleto}`,
          usuarioId: ctx.user.id,
          usuarioNome: ctx.user.name,
        });
      }
      return result;
    }),
    // Cancel reservation (self-service)
    cancelarReserva: protectedProcedure.input(z.object({
      reservaId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const colab = await db.getColaboradorByUserId(ctx.user.id);
      if (!colab) throw new Error('Voc\u00ea n\u00e3o est\u00e1 vinculado a um colaborador.');
      const reservas = await bibDb.listReservas({ colaboradorId: colab.id });
      const reserva = reservas.find((r: any) => r.id === input.reservaId);
      if (!reserva) throw new Error('Reserva n\u00e3o encontrada ou n\u00e3o pertence a voc\u00ea.');
      await bibDb.cancelarReserva(input.reservaId);
      await bibDb.createAuditoriaBib({
        acao: 'ajuste_manual',
        entidadeTipo: 'emprestimo',
        entidadeNome: `Cancelamento reserva autoatendimento - ${colab.nomeCompleto}`,
        entidadeId: input.reservaId,
        usuarioId: ctx.user.id,
        usuarioNome: ctx.user.name,
      });
    }),
  }),
});
