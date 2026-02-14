/**
 * API REST Pública — Evox Fiscal CRM
 * 
 * Autenticação via header: Authorization: Bearer evx_<key>
 * 
 * Endpoints:
 * GET  /api/v1/clientes        — Lista clientes
 * GET  /api/v1/clientes/:id    — Detalhe do cliente
 * GET  /api/v1/parceiros       — Lista parceiros
 * GET  /api/v1/tarefas         — Lista tarefas
 * GET  /api/v1/tarefas/:id     — Detalhe da tarefa
 * POST /api/v1/tarefas         — Criar tarefa
 * GET  /api/v1/setores         — Lista setores
 * GET  /api/v1/teses           — Lista teses tributárias
 * GET  /api/v1/relatorios      — Lista relatórios
 * GET  /api/v1/audit           — Log de auditoria
 * GET  /api/v1/health          — Health check
 */

import { Router, Request, Response, NextFunction } from "express";
import * as db from "./db";

const apiRouter = Router();

// ---- Middleware de autenticação por API Key ----
async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "API Key ausente. Use: Authorization: Bearer <sua_chave>" });
  }

  const chave = authHeader.replace("Bearer ", "").trim();
  const apiKey = await db.getApiKeyByChave(chave);

  if (!apiKey) {
    return res.status(401).json({ error: "API Key inválida" });
  }

  if (!apiKey.ativo) {
    return res.status(403).json({ error: "API Key desativada" });
  }

  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return res.status(403).json({ error: "API Key expirada" });
  }

  // Registrar uso
  await db.touchApiKeyUsage(apiKey.id);

  // Attach permissions to request
  (req as any).apiKey = apiKey;
  (req as any).permissions = apiKey.permissoes || [];
  next();
}

function hasPermission(req: Request, permission: string): boolean {
  const permissions = (req as any).permissions as string[];
  return permissions.includes(permission) || permissions.includes("*");
}

function paginate(query: any[], page: number = 1, limit: number = 50) {
  const start = (page - 1) * limit;
  const data = query.slice(start, start + limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total: query.length,
      totalPages: Math.ceil(query.length / limit),
    },
  };
}

// ---- Health Check ----
apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Evox Fiscal CRM API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ---- Clientes ----
apiRouter.get("/clientes", authenticateApiKey, async (req, res) => {
  if (!hasPermission(req, "clientes:read")) {
    return res.status(403).json({ error: "Permissão insuficiente: clientes:read" });
  }
  try {
    const all = await db.listClientes();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    res.json(paginate(all, page, limit));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

apiRouter.get("/clientes/:id", authenticateApiKey, async (req, res) => {
  if (!hasPermission(req, "clientes:read")) {
    return res.status(403).json({ error: "Permissão insuficiente: clientes:read" });
  }
  try {
    const cliente = await db.getClienteById(parseInt(req.params.id));
    if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });
    const relatorios = await db.getRelatoriosByClienteId(cliente.id);
    const arquivos = await db.listArquivos("cliente", cliente.id);
    res.json({ data: { ...cliente, relatorios, arquivos } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Parceiros ----
apiRouter.get("/parceiros", authenticateApiKey, async (req, res) => {
  if (!hasPermission(req, "parceiros:read")) {
    return res.status(403).json({ error: "Permissão insuficiente: parceiros:read" });
  }
  try {
    const all = await db.listParceiros();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    res.json(paginate(all, page, limit));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Tarefas ----
apiRouter.get("/tarefas", authenticateApiKey, async (req, res) => {
  if (!hasPermission(req, "tarefas:read")) {
    return res.status(403).json({ error: "Permissão insuficiente: tarefas:read" });
  }
  try {
    const filters: any = {};
    if (req.query.setorId) filters.setorId = parseInt(req.query.setorId as string);
    if (req.query.responsavelId) filters.responsavelId = parseInt(req.query.responsavelId as string);
    if (req.query.status) filters.status = req.query.status;
    if (req.query.clienteId) filters.clienteId = parseInt(req.query.clienteId as string);
    const all = await db.listTarefas(filters);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    res.json(paginate(all, page, limit));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

apiRouter.get("/tarefas/:id", authenticateApiKey, async (req, res) => {
  if (!hasPermission(req, "tarefas:read")) {
    return res.status(403).json({ error: "Permissão insuficiente: tarefas:read" });
  }
  try {
    const tarefa = await db.getTarefaById(parseInt(req.params.id));
    if (!tarefa) return res.status(404).json({ error: "Tarefa não encontrada" });
    const subtarefas = await db.getSubtarefas(tarefa.id);
    const comentarios = await db.listComentarios(tarefa.id);
    res.json({ data: { ...tarefa, subtarefas, comentarios } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

apiRouter.post("/tarefas", authenticateApiKey, async (req, res) => {
  if (!hasPermission(req, "tarefas:write")) {
    return res.status(403).json({ error: "Permissão insuficiente: tarefas:write" });
  }
  try {
    const { titulo, descricao, tipo, prioridade, setorId, responsavelId, clienteId, dataVencimento, slaHoras, tags } = req.body;
    if (!titulo) return res.status(400).json({ error: "Campo 'titulo' é obrigatório" });
    const codigo = await db.getNextTarefaCodigo();
    const id = await db.createTarefa({
      codigo,
      titulo,
      descricao,
      tipo: tipo || "tarefa",
      prioridade: prioridade || "media",
      setorId,
      responsavelId,
      clienteId,
      dataInicio: new Date(),
      dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
      slaHoras,
      tags,
    } as any);
    await db.createAuditEntry({
      acao: "criar",
      entidadeTipo: "tarefa",
      entidadeId: id,
      entidadeNome: titulo,
      usuarioNome: `API: ${(req as any).apiKey.nome}`,
    } as any);
    res.status(201).json({ data: { id, codigo } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Setores ----
apiRouter.get("/setores", authenticateApiKey, async (req, res) => {
  if (!hasPermission(req, "setores:read")) {
    return res.status(403).json({ error: "Permissão insuficiente: setores:read" });
  }
  try {
    const all = await db.listSetores();
    res.json({ data: all });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Teses ----
apiRouter.get("/teses", authenticateApiKey, async (req, res) => {
  if (!hasPermission(req, "teses:read")) {
    return res.status(403).json({ error: "Permissão insuficiente: teses:read" });
  }
  try {
    const all = await db.listTeses();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    res.json(paginate(all, page, limit));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Relatórios ----
apiRouter.get("/relatorios", authenticateApiKey, async (req, res) => {
  if (!hasPermission(req, "relatorios:read")) {
    return res.status(403).json({ error: "Permissão insuficiente: relatorios:read" });
  }
  try {
    const all = await db.listRelatorios();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    res.json(paginate(all, page, limit));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Audit Log ----
apiRouter.get("/audit", authenticateApiKey, async (req, res) => {
  if (!hasPermission(req, "audit:read")) {
    return res.status(403).json({ error: "Permissão insuficiente: audit:read" });
  }
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const entidadeTipo = req.query.entidadeTipo as string | undefined;
    const entidadeId = req.query.entidadeId ? parseInt(req.query.entidadeId as string) : undefined;
    const logs = await db.listAuditLog(limit, entidadeTipo, entidadeId);
    res.json({ data: logs });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export { apiRouter };
