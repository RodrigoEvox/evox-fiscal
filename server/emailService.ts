import nodemailer from 'nodemailer';
import { ENV } from './_core/env';

// Email transporter - configured via environment variables
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    console.warn('[Email] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export function getFromEmail(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@evoxfiscal.com';
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.warn('[Email] Skipping email send - SMTP not configured');
    return false;
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    await t.sendMail({
      from: `"Evox Fiscal" <${getFromEmail()}>`,
      to: recipients,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`[Email] Sent to ${recipients}: ${options.subject}`);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send:', err);
    return false;
  }
}

// ===== OVERDUE TASKS EMAIL TEMPLATES =====

const FILA_LABELS: Record<string, string> = {
  apuracao: 'Apuração',
  onboarding: 'Onboarding',
  retificacao: 'Retificação',
  compensacao: 'Compensação',
  ressarcimento: 'Ressarcimento',
  restituicao: 'Restituição',
  revisao: 'Revisão',
  chamados: 'Chamados',
};

interface OverdueTask {
  id: number;
  codigo: string;
  fila: string;
  titulo: string;
  status: string;
  responsavelNome: string | null;
  clienteNome: string | null;
  dataVencimento: string | null;
  slaHoras: number | null;
}

interface OverdueSummary {
  total: number;
  porFila: Record<string, number>;
  porResponsavel: Record<string, number>;
}

export function buildOverdueEmailHtml(
  tasks: OverdueTask[],
  summary: OverdueSummary,
  recipientName: string,
  isPersonal: boolean = false,
): string {
  const filaRows = Object.entries(summary.porFila)
    .sort((a, b) => b[1] - a[1])
    .map(([fila, count]) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${FILA_LABELS[fila] || fila}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold; color: #dc2626;">${count}</td>
      </tr>
    `).join('');

  const taskRows = tasks.slice(0, 15).map(t => `
    <tr>
      <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px; font-family: monospace;">${t.codigo}</td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px;">${FILA_LABELS[t.fila] || t.fila}</td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px;">${t.titulo?.slice(0, 60) || '-'}</td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px;">${t.clienteNome || '-'}</td>
      <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px;">${t.dataVencimento ? new Date(t.dataVencimento).toLocaleDateString('pt-BR') : '-'}</td>
    </tr>
  `).join('');

  const greeting = isPersonal
    ? `Olá ${recipientName}, você possui <strong>${summary.total} tarefa(s)</strong> de crédito tributário em atraso atribuídas a você.`
    : `Olá ${recipientName}, existem <strong>${summary.total} tarefa(s)</strong> de crédito tributário em atraso no sistema.`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 20px;">
  <div style="max-width: 680px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 24px 32px; color: white;">
      <h1 style="margin: 0; font-size: 20px;">⚠️ Alerta de Tarefas em Atraso</h1>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Evox Fiscal — Setor de Crédito Tributário</p>
    </div>

    <!-- Content -->
    <div style="padding: 28px 32px;">
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">${greeting}</p>

      <!-- Summary by Queue -->
      <h3 style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px;">Resumo por Fila</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Fila</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #6b7280; text-transform: uppercase;">Atrasadas</th>
          </tr>
        </thead>
        <tbody>${filaRows}</tbody>
      </table>

      <!-- Task List -->
      <h3 style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px;">Tarefas em Atraso</h3>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #fef2f2;">
              <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #991b1b; text-transform: uppercase;">Código</th>
              <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #991b1b; text-transform: uppercase;">Fila</th>
              <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #991b1b; text-transform: uppercase;">Título</th>
              <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #991b1b; text-transform: uppercase;">Cliente</th>
              <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #991b1b; text-transform: uppercase;">Vencimento</th>
            </tr>
          </thead>
          <tbody>${taskRows}</tbody>
        </table>
      </div>
      ${tasks.length > 15 ? `<p style="font-size: 13px; color: #6b7280; margin-top: 8px;">... e mais ${tasks.length - 15} tarefa(s)</p>` : ''}

      <!-- CTA -->
      <div style="text-align: center; margin: 28px 0 8px;">
        <p style="font-size: 13px; color: #6b7280;">Acesse o sistema para regularizar as tarefas pendentes.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0; text-align: center;">
        Este é um email automático do Evox Fiscal. Enviado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function buildOverdueEmailText(
  tasks: OverdueTask[],
  summary: OverdueSummary,
  recipientName: string,
  isPersonal: boolean = false,
): string {
  const greeting = isPersonal
    ? `Olá ${recipientName}, você possui ${summary.total} tarefa(s) de crédito tributário em atraso atribuídas a você.`
    : `Olá ${recipientName}, existem ${summary.total} tarefa(s) de crédito tributário em atraso no sistema.`;

  const filaLines = Object.entries(summary.porFila)
    .sort((a, b) => b[1] - a[1])
    .map(([fila, count]) => `  • ${FILA_LABELS[fila] || fila}: ${count} tarefa(s)`)
    .join('\n');

  const taskLines = tasks.slice(0, 15)
    .map(t => `  • [${t.codigo}] ${FILA_LABELS[t.fila] || t.fila} - ${t.titulo?.slice(0, 60) || '-'} (${t.clienteNome || '-'})`)
    .join('\n');

  return `${greeting}\n\nResumo por Fila:\n${filaLines}\n\nTarefas em Atraso:\n${taskLines}${tasks.length > 15 ? `\n  ... e mais ${tasks.length - 15} tarefa(s)` : ''}\n\nAcesse o sistema para regularizar as tarefas pendentes.\n\n---\nEvox Fiscal - Email automático`;
}

/**
 * Send overdue task notifications by email to all relevant users.
 * - Sends a summary email to admins/coordinators
 * - Sends personal emails to each responsible user with their specific overdue tasks
 */
export async function sendOverdueEmails(
  overdueTasks: OverdueTask[],
  summary: OverdueSummary,
  allUsers: Array<{ id: number; name: string | null; email: string | null; role: string; nivelAcesso: string }>,
): Promise<number> {
  const t = getTransporter();
  if (!t) return 0;

  let emailsSent = 0;

  // 1. Send summary email to admins and coordinators
  const adminEmails = allUsers
    .filter(u => u.email && (u.role === 'admin' || u.nivelAcesso === 'diretor' || u.nivelAcesso === 'gerente' || u.nivelAcesso === 'coordenador'))
    .map(u => u.email!)
    .filter(Boolean);

  if (adminEmails.length > 0) {
    const sent = await sendEmail({
      to: adminEmails,
      subject: `⚠️ ${summary.total} Tarefa(s) de Crédito em Atraso — Evox Fiscal`,
      text: buildOverdueEmailText(overdueTasks, summary, 'Gestor'),
      html: buildOverdueEmailHtml(overdueTasks, summary, 'Gestor'),
    });
    if (sent) emailsSent++;
  }

  // 2. Send personal emails to each responsible user with their specific tasks
  const tasksByResponsavel = new Map<string, OverdueTask[]>();
  for (const task of overdueTasks) {
    const key = task.responsavelNome || 'Sem responsável';
    if (!tasksByResponsavel.has(key)) tasksByResponsavel.set(key, []);
    tasksByResponsavel.get(key)!.push(task);
  }

  for (const [responsavelNome, tasks] of Array.from(tasksByResponsavel.entries())) {
    if (responsavelNome === 'Sem responsável') continue;

    // Find user by name match
    const user = allUsers.find(u => u.name === responsavelNome || u.name?.includes(responsavelNome));
    if (!user?.email) continue;

    // Skip if already received admin email
    if (adminEmails.includes(user.email)) continue;

    const personalSummary: OverdueSummary = {
      total: tasks.length,
      porFila: {},
      porResponsavel: { [responsavelNome]: tasks.length },
    };
    tasks.forEach((t: OverdueTask) => {
      personalSummary.porFila[t.fila] = (personalSummary.porFila[t.fila] || 0) + 1;
    });

    const sent = await sendEmail({
      to: user.email,
      subject: `⚠️ Você possui ${tasks.length} tarefa(s) em atraso — Evox Fiscal`,
      text: buildOverdueEmailText(tasks, personalSummary, responsavelNome, true),
      html: buildOverdueEmailHtml(tasks, personalSummary, responsavelNome, true),
    });
    if (sent) emailsSent++;
  }

  console.log(`[Email] Sent ${emailsSent} overdue notification email(s)`);
  return emailsSent;
}
