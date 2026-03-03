import { useState, useMemo, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { SEGMENTOS_ECONOMICOS } from '@/data/segmentosEconomicos';
import { PorteDisplay } from '@/components/PorteDisplay';
import { RegimeHistoryManager, type RegimeHistory } from '@/components/RegimeHistoryManager';
import { CadastralStatusAlert } from '@/components/CadastralStatusAlert';
import {
  Plus, Search, Flag, AlertTriangle, Eye, Pencil, Trash2, Loader2,
  Building2, ArrowLeft, MoreVertical, Power, PowerOff, Filter,
  User, FileCheck, ShieldAlert, ShieldCheck, CalendarClock,
  ChevronsUpDown, Check, Users,
} from 'lucide-react';

const estadosBR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const CNAE_SEGMENTOS: Record<string, string> = {
  '49': 'Transportadora', '50': 'Transportadora', '51': 'Transportadora',
  '47': 'Comércio Varejista', '46': 'Comércio Atacadista',
  '10': 'Indústria Alimentícia', '11': 'Indústria de Bebidas',
  '56': 'Restaurante / Alimentação', '55': 'Hotelaria',
  '62': 'Tecnologia da Informação', '63': 'Tecnologia da Informação',
  '64': 'Serviços Financeiros', '65': 'Seguros',
  '86': 'Saúde', '87': 'Saúde',
  '85': 'Educação', '41': 'Construção Civil', '42': 'Construção Civil', '43': 'Construção Civil',
  '01': 'Agropecuária', '02': 'Agropecuária', '03': 'Agropecuária',
  '13': 'Indústria Têxtil', '14': 'Indústria Têxtil',
  '29': 'Indústria Automotiva', '30': 'Indústria Automotiva',
  '19': 'Combustíveis', '23': 'Mineração',
  '35': 'Energia', '36': 'Saneamento',
  '69': 'Contabilidade / Consultoria', '70': 'Consultoria Empresarial',
  '73': 'Publicidade e Marketing', '74': 'Design e Serviços Técnicos',
  '77': 'Locação de Veículos / Equipamentos',
  '80': 'Segurança Privada', '81': 'Limpeza e Conservação',
};

function inferSegmento(cnaePrincipal: string): string {
  if (!cnaePrincipal) return '';
  const prefix2 = cnaePrincipal.substring(0, 2);
  return CNAE_SEGMENTOS[prefix2] || '';
}

type CnaeSecundario = { codigo: string; descricao: string };
type QuadroSocio = { nome: string; qualificacao: string; faixaEtaria?: string };

const EMPTY_FORM = {
  tipoPessoa: 'juridica' as 'juridica' | 'fisica',
  cnpj: '', cpf: '', razaoSocial: '', nomeFantasia: '', dataAbertura: '',
  regimeTributario: '' as string, situacaoCadastral: '' as string, porte: '' as string,
  classificacaoCliente: '' as '' | 'novo' | 'base',
  cnaePrincipal: '', cnaePrincipalDescricao: '', segmentoEconomico: '',
  naturezaJuridica: '', endereco: '', complemento: '', cidade: '', estado: 'SP',
  cnaesSecundarios: [] as CnaeSecundario[],
  quadroSocietario: [] as QuadroSocio[],
  folhaPagamentoMedia: '0', faturamentoMedioMensal: '0', valorMedioGuias: '0',
  processosJudiciaisAtivos: false, parcelamentosAtivos: false,
  atividadePrincipalDescritivo: '',
  parceiroId: undefined as number | undefined,
  procuracaoHabilitada: false, procuracaoCertificado: '', procuracaoValidade: '',
  excecoesEspecificidades: '',
  regimeHistory: [] as RegimeHistory[],
};

// Check if form has been modified from defaults
function isFormDirty(form: typeof EMPTY_FORM): boolean {
  if (form.cnpj || form.cpf || form.razaoSocial || form.nomeFantasia) return true;
  if (form.regimeTributario || form.porte || form.situacaoCadastral || form.endereco || form.complemento || form.cidade) return true;
  if (form.cnaePrincipal || form.segmentoEconomico || form.naturezaJuridica) return true;
  if (form.faturamentoMedioMensal !== '0' || form.valorMedioGuias !== '0' || form.folhaPagamentoMedia !== '0') return true;
  if (form.excecoesEspecificidades || form.procuracaoValidade || form.procuracaoCertificado) return true;
  if (form.classificacaoCliente) return true;
  if (form.parceiroId !== undefined) return true;
  if (form.procuracaoHabilitada) return true;
  return false;
}

export default function Clientes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const filterPrioridade = params.get('prioridade');
  const filterRedFlags = params.get('redflags') === 'true';

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'inativos' | 'sem_atribuicao'>('todos');
  const [filterParceiro, setFilterParceiro] = useState<string>('todos');
  const [filterTipoCliente, setFilterTipoCliente] = useState<'todos' | 'novo' | 'base' | 'sem_atribuicao'>('todos');
  const [filterProcuracao, setFilterProcuracao] = useState<'todos' | 'habilitada' | 'vencida' | 'vencendo' | 'desabilitada' | 'sem_atribuicao'>('todos');
  const [filterPrioridadeLocal, setFilterPrioridadeLocal] = useState<'todos' | 'alta' | 'media' | 'baixa' | 'sem_atribuicao'>('todos');
  const [filterSegmento, setFilterSegmento] = useState<string>('todos');
  const [filterRegime, setFilterRegime] = useState<string>('todos'); // 'todos' | 'sem_atribuicao' | value
  const [showFilters, setShowFilters] = useState(false);
  const [parceiroFilterOpen, setParceiroFilterOpen] = useState(false);
  const [parceiroFilterSearch, setParceiroFilterSearch] = useState('');
  const [segmentoFilterOpen, setSegmentoFilterOpen] = useState(false);
  const [segmentoFilterSearch, setSegmentoFilterSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [parceiroTouched, setParceiroTouched] = useState(false);
  const [procuracaoTouched, setProcuracaoTouched] = useState(false);
  const [segmentoOpen, setSegmentoOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading } = trpc.clientes.list.useQuery();
  const { data: parceiros = [] } = trpc.parceiros.list.useQuery();
  const { data: executivos = [] } = trpc.executivos.list.useQuery();
  const createCliente = trpc.clientes.create.useMutation({
    onSuccess: (data) => {
      utils.clientes.list.invalidate();
      utils.dashboard.stats.invalidate();
      const nomeCliente = form.razaoSocial || 'Cliente';
      const codigoGerado = data?.codigo || '';
      toast.success(
        `${nomeCliente} foi cadastrado com sucesso! Código: ${codigoGerado}`,
        { duration: 8000 }
      );
      setShowForm(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateCliente = trpc.clientes.update.useMutation({
    onSuccess: () => { utils.clientes.list.invalidate(); toast.success('Cliente atualizado!'); setShowForm(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteCliente = trpc.clientes.delete.useMutation({
    onSuccess: () => { utils.clientes.list.invalidate(); utils.dashboard.stats.invalidate(); toast.success('Cliente removido!'); },
  });
  const toggleCliente = trpc.clientes.toggleActive.useMutation({
    onSuccess: (_, vars) => { utils.clientes.list.invalidate(); toast.success(vars.ativo ? 'Cliente ativado!' : 'Cliente inativado!'); },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setJustificativas({});
    setParceiroTouched(false);
    setProcuracaoTouched(false);
    setSegmentoOpen(false);
    setCnpjFonte(null);
  }

  // Attempt to close the form — show confirmation if dirty
  function tryCloseForm() {
    if (isFormDirty(form) || editingId) {
      setShowCancelConfirm(true);
    } else {
      setShowForm(false);
      resetForm();
    }
  }

  function confirmCloseForm() {
    setShowCancelConfirm(false);
    setShowForm(false);
    resetForm();
  }

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (form.tipoPessoa === 'juridica') {
      if (!form.dataAbertura) missing.push('dataAbertura');
      if (!form.cnaePrincipal) missing.push('cnaePrincipal');
    }
    if (!form.faturamentoMedioMensal || form.faturamentoMedioMensal === '0') missing.push('faturamentoMedioMensal');
    if (!form.valorMedioGuias || form.valorMedioGuias === '0') missing.push('valorMedioGuias');
    if (!form.folhaPagamentoMedia || form.folhaPagamentoMedia === '0') missing.push('folhaPagamentoMedia');
    if (!form.segmentoEconomico) missing.push('segmentoEconomico');
    return missing;
  }, [form]);

  const [cnpjFonte, setCnpjFonte] = useState<{ api: string; atualizacao: string } | null>(null);

  const consultarCNPJ = async () => {
    const cnpjLimpo = form.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) { toast.error('CNPJ inválido. Deve conter 14 dígitos.'); return; }
    setConsultandoCnpj(true);
    setCnpjFonte(null);

    // Consulta cruzada entre múltiplas APIs para obter dados mais recentes
    const apis = [
      {
        name: 'BrasilAPI',
        url: `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
        parse: (data: any) => {
          // Extract PORTE from the API response
          let porte = '';
          if (data.codigo_porte === 1) porte = 'epp';
          else if (data.codigo_porte === 3) porte = 'epp';
          else if (data.codigo_porte === 2) porte = 'pme';
          else if (data.codigo_porte === 5) porte = 'demais_portes';
          
          return {
            razaoSocial: data.razao_social || '',
            nomeFantasia: data.nome_fantasia || '',
            dataAbertura: data.data_inicio_atividade || '',
            cnaePrincipal: data.cnae_fiscal?.toString() || '',
            cnaePrincipalDescricao: data.cnae_fiscal_descricao || '',
            naturezaJuridica: data.natureza_juridica || '',
            logradouro: data.logradouro || '',
            numero: data.numero || 'S/N',
            bairro: data.bairro || '',
            complemento: data.complemento || '',
            cidade: data.municipio || '',
            estado: data.uf || '',
            porte: porte,
            capitalSocial: data.capital_social || 0,
            situacaoCadastral: data.situacao_cadastral === 2 ? 'ativa' :
              data.situacao_cadastral === 3 ? 'suspensa' :
              data.situacao_cadastral === 4 ? 'inapta' :
              data.situacao_cadastral === 8 ? 'baixada' : '',
            motivoSituacao: data.motivo_situacao_cadastral || '',
            dataSituacao: data.data_situacao_cadastral || '',
            cnaesSecundarios: (data.cnaes_secundarios || []).map((c: any) => ({
              codigo: c.codigo?.toString() || '', descricao: c.descricao || '',
            })),
            quadroSocietario: (data.qsa || []).map((s: any) => ({
              nome: s.nome_socio || '', qualificacao: s.qualificacao_socio || '', faixaEtaria: s.faixa_etaria || '',
            })),
            atualizacao: data.data_situacao_cadastral || '',
          };
        },
      },
      {
        name: 'CNPJ.ws',
        url: `https://publica.cnpj.ws/cnpj/${cnpjLimpo}`,
        parse: (data: any) => {
          // Note: CNPJ.ws doesn't provide PORTE directly, so we leave it empty
          return {
            razaoSocial: data.razao_social || '',
            nomeFantasia: data.estabelecimento?.nome_fantasia || '',
            dataAbertura: data.estabelecimento?.data_inicio_atividade || '',
            cnaePrincipal: data.estabelecimento?.atividade_principal?.id?.toString() || '',
            cnaePrincipalDescricao: data.estabelecimento?.atividade_principal?.descricao || '',
            naturezaJuridica: data.natureza_juridica?.descricao || '',
            logradouro: data.estabelecimento?.logradouro || '',
            numero: data.estabelecimento?.numero || 'S/N',
            bairro: data.estabelecimento?.bairro || '',
            complemento: data.estabelecimento?.complemento || '',
            cidade: data.estabelecimento?.cidade?.nome || '',
            estado: data.estabelecimento?.estado?.sigla || '',
            porte: '',
            capitalSocial: 0,
            situacaoCadastral: data.estabelecimento?.situacao_cadastral?.toLowerCase() === 'ativa' ? 'ativa' :
              data.estabelecimento?.situacao_cadastral?.toLowerCase() === 'baixada' ? 'baixada' :
              data.estabelecimento?.situacao_cadastral?.toLowerCase() === 'inapta' ? 'inapta' :
              data.estabelecimento?.situacao_cadastral?.toLowerCase() === 'suspensa' ? 'suspensa' : '',
            motivoSituacao: '',
            dataSituacao: data.estabelecimento?.data_situacao_cadastral || '',
            cnaesSecundarios: (data.estabelecimento?.atividades_secundarias || []).map((c: any) => ({
              codigo: c.id?.toString() || '', descricao: c.descricao || '',
            })),
            quadroSocietario: (data.socios || []).map((s: any) => ({
              nome: s.nome || '', qualificacao: s.qualificacao?.descricao || '', faixaEtaria: s.faixa_etaria || '',
            })),
            atualizacao: data.atualizado_em || data.estabelecimento?.data_situacao_cadastral || '',
          };
        }
      },
    ];

    let bestResult: any = null;
    let bestApi = '';
    let bestDate = '';

    for (const api of apis) {
      try {
        const resp = await fetch(api.url);
        if (!resp.ok) continue;
        const raw = await resp.json();
        const parsed = api.parse(raw);
        const dateStr = parsed.atualizacao || parsed.dataSituacao || '';
        // Use the result with the most recent data, or the first successful one
        if (!bestResult || (dateStr && dateStr > bestDate)) {
          bestResult = parsed;
          bestApi = api.name;
          bestDate = dateStr;
        }
      } catch {
        // Continue to next API
      }
    }

    if (!bestResult) {
      toast.error('Não foi possível consultar o CNPJ em nenhuma fonte. Preencha manualmente.');
      setConsultandoCnpj(false);
      return;
    }

    const cnaePrincipal = bestResult.cnaePrincipal;

    setForm(p => ({
      ...p,
      razaoSocial: bestResult.razaoSocial || p.razaoSocial,
      nomeFantasia: bestResult.nomeFantasia || p.nomeFantasia,
      dataAbertura: bestResult.dataAbertura || p.dataAbertura,
      cnaePrincipal: cnaePrincipal || p.cnaePrincipal,
      cnaePrincipalDescricao: bestResult.cnaePrincipalDescricao || p.cnaePrincipalDescricao,
      naturezaJuridica: bestResult.naturezaJuridica || p.naturezaJuridica,
      endereco: bestResult.logradouro ? `${bestResult.logradouro}, ${bestResult.numero} - ${bestResult.bairro}` : p.endereco,
      complemento: bestResult.complemento || p.complemento,
      cidade: bestResult.cidade || p.cidade,
      estado: bestResult.estado || p.estado,
      porte: bestResult.porte || p.porte,
      faturamentoMedioMensal: bestResult.capitalSocial > 0 ? bestResult.capitalSocial / 12 : p.faturamentoMedioMensal,
      // segmentoEconomico: mantém manual
      cnaesSecundarios: bestResult.cnaesSecundarios.length > 0 ? bestResult.cnaesSecundarios : p.cnaesSecundarios,
      quadroSocietario: bestResult.quadroSocietario.length > 0 ? bestResult.quadroSocietario : p.quadroSocietario,
      situacaoCadastral: bestResult.situacaoCadastral || p.situacaoCadastral,
    }));
    // PORTE is auto-filled from the API response (bestResult.porte)
    // The PorteDisplay component will show the value from faturamentoMedioMensal

    // Calcular se dados podem estar desatualizados
    const dataAtualizacao = bestDate ? new Date(bestDate) : null;
    const diasDesdeAtualizacao = dataAtualizacao ? Math.ceil((Date.now() - dataAtualizacao.getTime()) / (1000 * 60 * 60 * 24)) : null;

    setCnpjFonte({
      api: bestApi,
      atualizacao: bestDate ? new Date(bestDate).toLocaleDateString('pt-BR') : 'Não informada',
    });

    if (diasDesdeAtualizacao && diasDesdeAtualizacao > 30) {
      toast.warning(
        `Dados obtidos via ${bestApi}. Base atualizada em ${new Date(bestDate).toLocaleDateString('pt-BR')} (${diasDesdeAtualizacao} dias atrás). A situação cadastral pode estar desatualizada.`,
        { duration: 8000 }
      );
    } else {
      toast.success(`Dados preenchidos via ${bestApi}!`);
    }

    setConsultandoCnpj(false);
  };

  function handleSave() {
    if (form.tipoPessoa === 'juridica' && (!form.cnpj || !form.razaoSocial)) {
      toast.error('CNPJ e Razão Social são obrigatórios.'); return;
    }
    if (form.tipoPessoa === 'fisica' && (!form.cpf || !form.razaoSocial)) {
      toast.error('CPF e Nome Completo são obrigatórios.'); return;
    }
    if (!form.regimeTributario) {
      toast.error('Regime Tributário é obrigatório.'); return;
    }
    if (!form.classificacaoCliente) {
      toast.error('Selecione a Classificação do Cliente (Novo ou Base).'); return;
    }
    // Segmento econômico é obrigatório
    if (!form.segmentoEconomico?.trim()) {
      toast.error('Preencha o Segmento Econômico.'); return;
    }
    // Parceiro é obrigatório
    if (form.parceiroId === undefined) {
      toast.error('Selecione o Parceiro Comercial.'); return;
    }
    // Procuração é obrigatória (deve ter sido tocada)
    if (!procuracaoTouched && !editingId) {
      toast.error('Defina o status da Procuração Eletrônica.'); return;
    }
    // Se procuração habilitada, certificado e validade são obrigatórios
    if (form.procuracaoHabilitada) {
      if (!form.procuracaoCertificado) {
        toast.error('Selecione o Certificado Vinculado à procuração.'); return;
      }
      if (!form.procuracaoValidade) {
        toast.error('Informe a Data de Validade da procuração.'); return;
      }
    }

    const unjustified = missingFields.filter(f => !justificativas[f]?.trim());
    if (unjustified.length > 0 && !editingId) {
      toast.warning('Preencha os campos faltantes ou forneça justificativa para cada um.'); return;
    }

    const payload: any = {
      ...form,
      cnpj: form.tipoPessoa === 'fisica' ? (form.cpf || 'PF') : form.cnpj,
      folhaPagamentoMedia: form.folhaPagamentoMedia || '0',
      faturamentoMedioMensal: form.faturamentoMedioMensal || '0',
      valorMedioGuias: form.valorMedioGuias || '0',
      usuarioCadastroId: user?.id,
      usuarioCadastroNome: user?.name || 'Usuário',
      alertasInformacao: missingFields.filter(f => justificativas[f]?.trim()).map(f => ({
        campo: f, justificativa: justificativas[f],
      })),
    };

    if (editingId) {
      updateCliente.mutate({ id: editingId, data: payload });
    } else {
      createCliente.mutate(payload);
    }
  }

  function startEdit(cliente: any) {
    setForm({
      tipoPessoa: cliente.tipoPessoa || 'juridica',
      cnpj: cliente.cnpj || '',
      cpf: cliente.cpf || '',
      razaoSocial: cliente.razaoSocial || '',
      nomeFantasia: cliente.nomeFantasia || '',
      dataAbertura: cliente.dataAbertura || '',
      regimeTributario: cliente.regimeTributario || '',
      situacaoCadastral: cliente.situacaoCadastral || 'ativa',
      classificacaoCliente: cliente.classificacaoCliente || '',
      cnaePrincipal: cliente.cnaePrincipal || '',
      cnaePrincipalDescricao: cliente.cnaePrincipalDescricao || '',
      segmentoEconomico: cliente.segmentoEconomico || '',
      naturezaJuridica: cliente.naturezaJuridica || '',
      endereco: cliente.endereco || '',
      complemento: cliente.complemento || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || 'SP',
      cnaesSecundarios: cliente.cnaesSecundarios || [],
      quadroSocietario: cliente.quadroSocietario || [],
      folhaPagamentoMedia: cliente.folhaPagamentoMedia || '0',
      faturamentoMedioMensal: cliente.faturamentoMedioMensal || '0',
      valorMedioGuias: cliente.valorMedioGuias || '0',
      processosJudiciaisAtivos: !!cliente.processosJudiciaisAtivos,
      parcelamentosAtivos: !!cliente.parcelamentosAtivos,
      atividadePrincipalDescritivo: cliente.atividadePrincipalDescritivo || '',
      parceiroId: cliente.parceiroId ?? undefined,
      procuracaoHabilitada: !!cliente.procuracaoHabilitada,
      procuracaoCertificado: cliente.procuracaoCertificado || '',
      procuracaoValidade: cliente.procuracaoValidade || '',
      excecoesEspecificidades: cliente.excecoesEspecificidades || '',
    });
    setEditingId(cliente.id);
    setParceiroTouched(true);
    setProcuracaoTouched(true);
    setShowForm(true);
  }

  function procuracaoStatus(cliente: any) {
    if (!cliente.procuracaoHabilitada) return 'desabilitada';
    if (!cliente.procuracaoValidade) return 'habilitada';
    const validade = new Date(cliente.procuracaoValidade);
    const hoje = new Date();
    const diffDias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias < 0) return 'vencida';
    if (diffDias <= 7) return 'vencendo';
    return 'habilitada';
  }

  // Compute unique segments and regimes for filter dropdowns
  // Parceiros ordenados para o filtro
  const sortedParceiros = useMemo(() => {
    const principais = parceiros.filter((p: any) => !p.ehSubparceiro).sort((a: any, b: any) => (a.apelido || a.nomeCompleto).localeCompare(b.apelido || b.nomeCompleto, 'pt-BR'));
    const subs = parceiros.filter((p: any) => p.ehSubparceiro).sort((a: any, b: any) => (a.apelido || a.nomeCompleto).localeCompare(b.apelido || b.nomeCompleto, 'pt-BR'));
    return [...principais, ...subs];
  }, [parceiros]);

  const parceiroFilterLabel = useMemo(() => {
    if (filterParceiro === 'todos') return 'Todos';
    if (filterParceiro === 'sem_parceiro') return 'Sem atribuição';
    const p = parceiros.find((p: any) => String(p.id) === filterParceiro);
    return p ? (p.apelido || p.nomeCompleto) : 'Todos';
  }, [filterParceiro, parceiros]);

  const segmentoFilterLabel = useMemo(() => {
    if (filterSegmento === 'todos') return 'Todos';
    if (filterSegmento === 'sem_atribuicao') return 'Sem atribuição';
    return filterSegmento;
  }, [filterSegmento]);

  const uniqueSegmentos = useMemo(() => {
    const segs = new Set<string>();
    clientes.forEach((c: any) => { if (c.segmentoEconomico) segs.add(c.segmentoEconomico); });
    return Array.from(segs).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [clientes]);

  const uniqueRegimes = useMemo(() => {
    const regs = new Set<string>();
    clientes.forEach((c: any) => { if (c.regimeTributario) regs.add(c.regimeTributario); });
    return Array.from(regs).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [clientes]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'todos') count++;
    if (filterParceiro !== 'todos') count++;
    if (filterTipoCliente !== 'todos') count++;
    if (filterProcuracao !== 'todos') count++;
    if (filterPrioridadeLocal !== 'todos') count++;
    if (filterSegmento !== 'todos') count++;
    if (filterRegime !== 'todos') count++;
    return count;
  }, [filterStatus, filterParceiro, filterTipoCliente, filterProcuracao, filterPrioridadeLocal, filterSegmento, filterRegime]);

  const clearAllFilters = () => {
    setFilterStatus('todos');
    setFilterParceiro('todos');
    setFilterTipoCliente('todos');
    setFilterProcuracao('todos');
    setFilterPrioridadeLocal('todos');
    setFilterSegmento('todos');
    setFilterRegime('todos');
  };

  const filtered = useMemo(() => {
    let list = clientes;
    if (filterPrioridade) list = list.filter((c: any) => c.prioridade === filterPrioridade);
    if (filterRedFlags) list = list.filter((c: any) => Array.isArray(c.redFlags) && c.redFlags.length > 0);
    if (filterStatus === 'ativos') list = list.filter((c: any) => c.ativo !== false && c.situacaoCadastral === 'ativa');
    if (filterStatus === 'inativos') list = list.filter((c: any) => c.ativo === false || c.situacaoCadastral !== 'ativa');
    if (filterParceiro !== 'todos') {
      if (filterParceiro === 'sem_parceiro') {
        list = list.filter((c: any) => !c.parceiroId);
      } else {
        const pid = Number(filterParceiro);
        const subIds = parceiros.filter((p: any) => p.ehSubparceiro && p.parceiroPaiId === pid).map((p: any) => p.id);
        list = list.filter((c: any) => c.parceiroId === pid || subIds.includes(c.parceiroId));
      }
    }
    if (filterTipoCliente !== 'todos') {
      if (filterTipoCliente === 'sem_atribuicao') {
        list = list.filter((c: any) => !c.classificacaoCliente);
      } else {
        list = list.filter((c: any) => c.classificacaoCliente === filterTipoCliente);
      }
    }
    if (filterProcuracao !== 'todos') {
      if (filterProcuracao === 'sem_atribuicao') {
        list = list.filter((c: any) => !c.procuracaoHabilitada);
      } else {
        list = list.filter((c: any) => procuracaoStatus(c) === filterProcuracao);
      }
    }
    if (filterPrioridadeLocal !== 'todos') {
      if (filterPrioridadeLocal === 'sem_atribuicao') {
        list = list.filter((c: any) => !c.prioridade);
      } else {
        list = list.filter((c: any) => c.prioridade === filterPrioridadeLocal);
      }
    }
    if (filterSegmento !== 'todos') {
      if (filterSegmento === 'sem_atribuicao') {
        list = list.filter((c: any) => !c.segmentoEconomico);
      } else {
        list = list.filter((c: any) => c.segmentoEconomico === filterSegmento);
      }
    }
    if (filterRegime !== 'todos') {
      if (filterRegime === 'sem_atribuicao') {
        list = list.filter((c: any) => !c.regimeTributario);
      } else {
        list = list.filter((c: any) => c.regimeTributario === filterRegime);
      }
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((c: any) =>
        c.razaoSocial?.toLowerCase().includes(s) ||
        c.cnpj?.includes(s) ||
        c.nomeFantasia?.toLowerCase().includes(s) ||
        c.cpf?.includes(s) ||
        c.codigo?.toString().includes(s)
      );
    }
    return list;
  }, [clientes, filterPrioridade, filterRedFlags, filterStatus, filterParceiro, filterTipoCliente, filterProcuracao, filterPrioridadeLocal, filterSegmento, filterRegime, search, parceiros]);

  const prioridadeBadge = (p: string) => {
    if (p === 'alta') return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Alta</Badge>;
    if (p === 'media') return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Média</Badge>;
    return <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-[10px]">Baixa</Badge>;
  };

  const activeFilter = filterPrioridade || filterRedFlags;

  // Section header component for visual separation
  const SectionHeader = ({ title, icon }: { title: string; icon?: React.ReactNode }) => (
    <div className="flex items-center gap-2 pt-2 pb-1">
      {icon}
      <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeFilter && (
            <Button variant="ghost" size="icon" onClick={() => setLocation('/clientes')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeFilter ? (
                filterPrioridade ? `Filtrando: Prioridade ${filterPrioridade}` : 'Filtrando: Com Red Flags'
              ) : activeFilterCount > 0 ? `${filtered.length} de ${clientes.length} clientes (${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''})` : `${clientes.length} clientes cadastrados`}
            </p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      <div className="space-y-3">
        {/* Barra de busca + botão de filtros */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por código, razão social, CNPJ, CPF ou nome fantasia..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2 shrink-0">
            <Filter className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge className="bg-white text-primary h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{activeFilterCount}</Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs text-muted-foreground shrink-0">
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Painel de filtros avançados */}
        {showFilters && (
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
                {/* Status Ativo/Inativo */}
                <div className="space-y-0.5 w-full min-w-0">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Status</Label>
                  <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                    <SelectTrigger className="h-9 text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativos">Ativos</SelectItem>
                      <SelectItem value="inativos">Inativos</SelectItem>
                      <SelectItem value="sem_atribuicao"><span className="italic text-muted-foreground">Sem atribuição</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Parceiro - Combobox com autocomplete */}
                <div className="space-y-0.5 w-full min-w-0">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Parceiro</Label>
                  <Popover open={parceiroFilterOpen} onOpenChange={setParceiroFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="h-9 w-full justify-between text-xs font-normal px-2 truncate">
                        <span className="truncate">{parceiroFilterLabel}</span>
                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[260px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar parceiro..." value={parceiroFilterSearch} onValueChange={setParceiroFilterSearch} className="h-8 text-xs" />
                        <CommandList className="max-h-60">
                          <CommandEmpty>Nenhum parceiro encontrado.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="todos" onSelect={() => { setFilterParceiro('todos'); setParceiroFilterOpen(false); setParceiroFilterSearch(''); }}>
                              <Check className={`mr-1.5 h-3 w-3 ${filterParceiro === 'todos' ? 'opacity-100' : 'opacity-0'}`} />
                              Todos
                            </CommandItem>
                            <CommandItem value="sem_parceiro sem atribuição" onSelect={() => { setFilterParceiro('sem_parceiro'); setParceiroFilterOpen(false); setParceiroFilterSearch(''); }}>
                              <Check className={`mr-1.5 h-3 w-3 ${filterParceiro === 'sem_parceiro' ? 'opacity-100' : 'opacity-0'}`} />
                              <span className="italic text-muted-foreground">Sem atribuição</span>
                            </CommandItem>
                            {sortedParceiros.map((p: any) => (
                              <CommandItem key={p.id} value={`${p.apelido || ''} ${p.nomeCompleto || ''}`} onSelect={() => { setFilterParceiro(String(p.id)); setParceiroFilterOpen(false); setParceiroFilterSearch(''); }}>
                                <Check className={`mr-1.5 h-3 w-3 ${filterParceiro === String(p.id) ? 'opacity-100' : 'opacity-0'}`} />
                                {p.ehSubparceiro ? '↳ ' : ''}{p.apelido || p.nomeCompleto}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Tipo Cliente */}
                <div className="space-y-0.5 w-full min-w-0">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Tipo</Label>
                  <Select value={filterTipoCliente} onValueChange={(v: any) => setFilterTipoCliente(v)}>
                    <SelectTrigger className="h-9 text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="sem_atribuicao"><span className="italic text-muted-foreground">Sem atribuição</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Procuração */}
                <div className="space-y-0.5 w-full min-w-0">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Procuração</Label>
                  <Select value={filterProcuracao} onValueChange={(v: any) => setFilterProcuracao(v)}>
                    <SelectTrigger className="h-9 text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="habilitada">Habilitada</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                      <SelectItem value="vencendo">Próx. Vencimento</SelectItem>
                      <SelectItem value="desabilitada">Desabilitada</SelectItem>
                      <SelectItem value="sem_atribuicao"><span className="italic text-muted-foreground">Sem atribuição</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prioridade */}
                <div className="space-y-0.5 w-full min-w-0">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Prioridade</Label>
                  <Select value={filterPrioridadeLocal} onValueChange={(v: any) => setFilterPrioridadeLocal(v)}>
                    <SelectTrigger className="h-9 text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="sem_atribuicao"><span className="italic text-muted-foreground">Sem atribuição</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Segmento - Combobox com autocomplete */}
                <div className="space-y-0.5 w-full min-w-0">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Segmento</Label>
                  <Popover open={segmentoFilterOpen} onOpenChange={setSegmentoFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="h-9 w-full justify-between text-xs font-normal px-2 truncate">
                        <span className="truncate">{segmentoFilterLabel}</span>
                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar segmento..." value={segmentoFilterSearch} onValueChange={setSegmentoFilterSearch} className="h-8 text-xs" />
                        <CommandList className="max-h-60">
                          <CommandEmpty>Nenhum segmento encontrado.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="todos" onSelect={() => { setFilterSegmento('todos'); setSegmentoFilterOpen(false); setSegmentoFilterSearch(''); }}>
                              <Check className={`mr-1.5 h-3 w-3 ${filterSegmento === 'todos' ? 'opacity-100' : 'opacity-0'}`} />
                              Todos
                            </CommandItem>
                            <CommandItem value="sem_atribuicao sem atribuição" onSelect={() => { setFilterSegmento('sem_atribuicao'); setSegmentoFilterOpen(false); setSegmentoFilterSearch(''); }}>
                              <Check className={`mr-1.5 h-3 w-3 ${filterSegmento === 'sem_atribuicao' ? 'opacity-100' : 'opacity-0'}`} />
                              <span className="italic text-muted-foreground">Sem atribuição</span>
                            </CommandItem>
                            {uniqueSegmentos.map(s => (
                              <CommandItem key={s} value={s} onSelect={() => { setFilterSegmento(s); setSegmentoFilterOpen(false); setSegmentoFilterSearch(''); }}>
                                <Check className={`mr-1.5 h-3 w-3 ${filterSegmento === s ? 'opacity-100' : 'opacity-0'}`} />
                                {s}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Regime Tributário */}
                <div className="space-y-0.5 w-full min-w-0">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Regime</Label>
                  <Select value={filterRegime} onValueChange={(v: any) => setFilterRegime(v)}>
                    <SelectTrigger className="h-9 text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {uniqueRegimes.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                      <SelectItem value="sem_atribuicao"><span className="italic text-muted-foreground">Sem atribuição</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo dos filtros ativos */}
        {activeFilterCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} de {clientes.length} clientes ({activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} ativo{activeFilterCount > 1 ? 's' : ''})
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((cliente: any) => {
            const redFlagCount = Array.isArray(cliente.redFlags) ? cliente.redFlags.length : 0;
            const parceiroObj = parceiros.find((p: any) => p.id === cliente.parceiroId);
            const parceiroNome = parceiroObj ? (parceiroObj.apelido || parceiroObj.nomeCompleto) : null;
            const parceiroPaiObj = parceiroObj?.ehSubparceiro && parceiroObj?.parceiroPaiId ? parceiros.find((p: any) => p.id === parceiroObj.parceiroPaiId) : null;
            const parceiroPaiNome = parceiroPaiObj ? (parceiroPaiObj.apelido || parceiroPaiObj.nomeCompleto) : null;
            const procStatus = procuracaoStatus(cliente);
            const isAtivo = cliente.ativo !== false && cliente.situacaoCadastral === 'ativa';
            return (
              <Card key={cliente.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/clientes/${cliente.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-1.5 h-12 rounded-full shrink-0 ${
                        cliente.prioridade === 'alta' ? 'bg-red-500' :
                        cliente.prioridade === 'media' ? 'bg-amber-500' : 'bg-sky-400'
                      }`} />
                      {cliente.tipoPessoa === 'fisica' ? (
                        <User className="w-8 h-8 text-muted-foreground/40 shrink-0" />
                      ) : (
                        <Building2 className="w-8 h-8 text-muted-foreground/40 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {cliente.codigo && <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">#{cliente.codigo}</span>}
                          <p className="font-semibold text-sm truncate">{cliente.razaoSocial}</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {cliente.tipoPessoa === 'fisica' ? cliente.cpf || cliente.cnpj : cliente.cnpj}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {cliente.nomeFantasia && <span className="text-xs text-muted-foreground truncate">{cliente.nomeFantasia}</span>}
                          {parceiroNome && <Badge variant="outline" className="text-[9px] h-4">{parceiroNome}{parceiroObj?.ehSubparceiro ? ' (Sub)' : ''}</Badge>}
                          {parceiroPaiNome && <Badge variant="outline" className="text-[9px] h-4 bg-blue-50 text-blue-700 border-blue-200">Parceiro: {parceiroPaiNome}</Badge>}
                          {parceiroObj?.executivoComercialId && (() => { const exec = (executivos as any[])?.find((e: any) => e.id === parceiroObj.executivoComercialId); return exec ? <Badge variant="outline" className="text-[9px] h-4 bg-emerald-50 text-emerald-700 border-emerald-200">Exec: {exec.nome}</Badge> : null; })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end" onClick={e => e.stopPropagation()}>
                      <Badge className={`text-[10px] ${cliente.classificacaoCliente === 'novo' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {cliente.classificacaoCliente === 'novo' ? 'Novo' : 'Base'}
                      </Badge>
                      {procStatus === 'vencida' && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] gap-1">
                          <ShieldAlert className="w-3 h-3" /> Proc. Vencida
                        </Badge>
                      )}
                      {procStatus === 'vencendo' && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] gap-1">
                          <CalendarClock className="w-3 h-3" /> Proc. Vencendo
                        </Badge>
                      )}
                      {procStatus === 'desabilitada' && (
                        <Badge className="bg-red-50 text-red-500 border-red-100 text-[10px] gap-1">
                          <ShieldAlert className="w-3 h-3" /> S/ Proc.
                        </Badge>
                      )}
                      {procStatus === 'habilitada' && (
                        <Badge className="bg-green-50 text-green-600 border-green-100 text-[10px] gap-1">
                          <ShieldCheck className="w-3 h-3" /> Proc. OK
                        </Badge>
                      )}
                      {redFlagCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <Flag className="w-3 h-3" /> {redFlagCount}
                        </Badge>
                      )}
                      {prioridadeBadge(cliente.prioridade)}
                      <Badge variant={isAtivo ? 'default' : 'secondary'} className={`text-[10px] ${isAtivo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                        {isAtivo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {cliente.segmentoEconomico && (
                        <Badge variant="outline" className="text-[9px] h-4 bg-purple-50 text-purple-700 border-purple-200 max-w-[120px] truncate" title={cliente.segmentoEconomico}>
                          {cliente.segmentoEconomico}
                        </Badge>
                      )}
                      {cliente.regimeTributario && (
                        <Badge variant="outline" className="text-[9px] h-4 bg-teal-50 text-teal-700 border-teal-200">
                          {cliente.regimeTributario}
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/clientes/${cliente.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startEdit(cliente)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleCliente.mutate({ id: cliente.id, ativo: !isAtivo })}>
                            {isAtivo ? <><PowerOff className="w-4 h-4 mr-2" /> Inativar</> : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => setConfirmDelete(cliente)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ==================== FORMULÁRIO ÚNICO COM ROLAGEM ==================== */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) tryCloseForm(); }}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col" onPointerDownOutside={(e) => { e.preventDefault(); tryCloseForm(); }} onEscapeKeyDown={(e) => { e.preventDefault(); tryCloseForm(); }}>
          <DialogHeader className="shrink-0 pb-2 border-b">
            <DialogTitle className="text-lg">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <p className="text-xs text-muted-foreground">Preencha todos os dados abaixo. Campos com * são obrigatórios.</p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4" style={{ minHeight: 0 }}>

            {/* ===== SEÇÃO 1: TIPO E CLASSIFICAÇÃO ===== */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Tipo de Pessoa</Label>
                <div className="flex gap-3 mt-2">
                  <Button type="button" variant={form.tipoPessoa === 'juridica' ? 'default' : 'outline'} size="sm"
                    onClick={() => setForm(f => ({ ...f, tipoPessoa: 'juridica' }))} className="gap-2">
                    <Building2 className="w-4 h-4" /> Pessoa Jurídica
                  </Button>
                  <Button type="button" variant={form.tipoPessoa === 'fisica' ? 'default' : 'outline'} size="sm"
                    onClick={() => setForm(f => ({ ...f, tipoPessoa: 'fisica' }))} className="gap-2">
                    <User className="w-4 h-4" /> Pessoa Física
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Classificação do Cliente *</Label>
                {!form.classificacaoCliente && (
                  <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Campo obrigatório — selecione se é Cliente Novo ou Cliente Base.
                  </div>
                )}
                <div className="flex gap-3 mt-2">
                  <Button type="button" variant={form.classificacaoCliente === 'novo' ? 'default' : 'outline'} size="sm"
                    onClick={() => setForm(f => ({ ...f, classificacaoCliente: 'novo' }))}
                    className={`gap-2 ${form.classificacaoCliente === 'novo' ? 'bg-blue-600 hover:bg-blue-700' : ''} ${!form.classificacaoCliente ? 'border-amber-400' : ''}`}>
                    Cliente Novo
                  </Button>
                  <Button type="button" variant={form.classificacaoCliente === 'base' ? 'default' : 'outline'} size="sm"
                    onClick={() => setForm(f => ({ ...f, classificacaoCliente: 'base' }))}
                    className={!form.classificacaoCliente ? 'border-amber-400' : ''}>
                    Cliente Base
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Clientes novos são convertidos automaticamente para "Base" após 90 dias.
                </p>
              </div>
            </div>

            <Separator />

            {/* ===== SEÇÃO 2: DADOS DA EMPRESA / PESSOA ===== */}
            <div className="space-y-4">
              <SectionHeader title={form.tipoPessoa === 'juridica' ? 'Dados da Empresa' : 'Dados Pessoais'} icon={form.tipoPessoa === 'juridica' ? <Building2 className="w-4 h-4 text-muted-foreground" /> : <User className="w-4 h-4 text-muted-foreground" />} />

              {form.tipoPessoa === 'juridica' ? (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs">CNPJ *</Label>
                    <div className="flex gap-2">
                      <Input value={form.cnpj} onChange={e => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 14);
                        if (v.length > 12) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
                        else if (v.length > 8) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
                        else if (v.length > 5) v = v.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
                        else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,3})/, '$1.$2');
                        setForm({ ...form, cnpj: v });
                      }} placeholder="00.000.000/0001-00" className="h-9 text-sm max-w-[220px]" maxLength={18} />
                      <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1 text-xs" onClick={consultarCNPJ} disabled={consultandoCnpj}>
                        {consultandoCnpj ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                        Consultar
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Razão Social *</Label>
                    <Input value={form.razaoSocial} onChange={e => setForm({ ...form, razaoSocial: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Nome Fantasia</Label>
                    <Input value={form.nomeFantasia} onChange={e => setForm({ ...form, nomeFantasia: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Data de Abertura</Label>
                    <Input type="date" value={form.dataAbertura} onChange={e => setForm({ ...form, dataAbertura: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Natureza Jurídica</Label>
                    <Input value={form.naturezaJuridica} onChange={e => setForm({ ...form, naturezaJuridica: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Situação Cadastral</Label>
                    <Select value={form.situacaoCadastral} onValueChange={v => setForm({ ...form, situacaoCadastral: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Preenchido automaticamente ao consultar CNPJ" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="baixada">Baixada</SelectItem>
                        <SelectItem value="suspensa">Suspensa</SelectItem>
                        <SelectItem value="inapta">Inapta</SelectItem>
                        <SelectItem value="nula">Nula</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">PORTE da Empresa</Label>
                    <Select value={form.porte} onValueChange={v => setForm({ ...form, porte: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Preenchido automaticamente ao consultar CNPJ" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="epp">EPP (Empresa de Pequeno Porte)</SelectItem>
                        <SelectItem value="pme">PME (Pequena e Média Empresa)</SelectItem>
                        <SelectItem value="demais_portes">Demais Portes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Regime Tributário *</Label>
                    <Select value={form.regimeTributario} onValueChange={v => setForm({ ...form, regimeTributario: v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                        <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="lucro_real">Lucro Real</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <CadastralStatusAlert situacao={form.situacaoCadastral as any} showAlert={true} />
                  </div>
                  {cnpjFonte && (
                    <div className="col-span-2">
                      <div className={`p-2.5 rounded-md text-xs flex items-start gap-2 ${
                        (() => {
                          const d = cnpjFonte.atualizacao !== 'Não informada' ? new Date(cnpjFonte.atualizacao.split('/').reverse().join('-')) : null;
                          const dias = d ? Math.ceil((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)) : null;
                          return dias && dias > 30 ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-blue-50 border border-blue-200 text-blue-700';
                        })()
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Fonte: {cnpjFonte.api} — Atualização: {cnpjFonte.atualizacao}</p>
                          <p className="mt-0.5 opacity-80">
                            APIs públicas utilizam dumps periódicos da Receita Federal. A situação cadastral pode não refletir alterações recentes. Confirme diretamente no site da Receita Federal se necessário.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">CPF *</Label>
                    <Input value={form.cpf} onChange={e => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                      if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                      else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                      else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                      setForm({ ...form, cpf: v });
                    }} placeholder="000.000.000-00" className="h-9 text-sm" maxLength={14} />
                  </div>
                  <div>
                    <Label className="text-xs">Nome Completo *</Label>
                    <Input value={form.razaoSocial} onChange={e => setForm({ ...form, razaoSocial: e.target.value })} className="h-9 text-sm" placeholder="Nome completo" />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* ===== SEÇÃO 2B: HISTÓRICO DE REGIMES TRIBUTÁRIOS ===== */}
            {form.tipoPessoa === 'juridica' && (
              <div className="space-y-3">
                <RegimeHistoryManager
                  currentRegime={form.regimeTributario}
                  history={form.regimeHistory}
                  onHistoryChange={(history) => setForm({ ...form, regimeHistory: history })}
                  maxMonths={60}
                />
              </div>
            )}

            <Separator />

            {/* ===== SEÇÃO 3: ENDEREÇO ===== */}
            <div className="space-y-3">
              <SectionHeader title="Endereço" />
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Logradouro, Número, Bairro</Label>
                  <Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} className="h-9 text-sm" placeholder="Rua, número, bairro" />
                </div>
                <div>
                  <Label className="text-xs">Complemento</Label>
                  <Input value={form.complemento} onChange={e => setForm({ ...form, complemento: e.target.value })} className="h-9 text-sm" placeholder="Sala, andar, bloco..." />
                </div>
                <div>
                  <Label className="text-xs">Cidade</Label>
                  <Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Estado (UF)</Label>
                  <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {estadosBR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* ===== SEÇÃO 4: PARCEIRO COMERCIAL (OBRIGATÓRIO) ===== */}
            <div className="space-y-3">
              <SectionHeader title="Parceiro Comercial *" />
              {form.parceiroId === undefined && !editingId && (
                <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Campo obrigatório — selecione o parceiro comercial responsável.
                </div>
              )}
              <Select
                value={form.parceiroId?.toString() || ''}
                onValueChange={v => {
                  setForm({ ...form, parceiroId: Number(v) });
                  setParceiroTouched(true);
                }}
              >
                <SelectTrigger className={`h-9 text-sm ${form.parceiroId === undefined && !editingId ? 'border-amber-400 ring-1 ring-amber-200' : ''}`}>
                  <SelectValue placeholder="Selecione o parceiro..." />
                </SelectTrigger>
                <SelectContent>
                  {parceiros.filter((p: any) => p.ativo).map((p: any) => {
                    const nome = p.apelido || p.nomeCompleto;
                    const tipo = p.ehSubparceiro ? ' (Subparceiro)' : '';
                    return <SelectItem key={p.id} value={p.id.toString()}>{nome}{tipo}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* ===== SEÇÃO 5: CNAE E SEGMENTO ===== */}
            {form.tipoPessoa === 'juridica' && (
              <>
                <div className="space-y-3">
                  <SectionHeader title="CNAE e Segmento" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">CNAE Principal</Label>
                      <Input value={form.cnaePrincipal} onChange={e => setForm({ ...form, cnaePrincipal: e.target.value })} className="h-9 text-sm" placeholder="Ex: 4711302" />
                    </div>
                    <div>
                      <Label className="text-xs">Descrição CNAE</Label>
                      <Input value={form.cnaePrincipalDescricao} onChange={e => setForm({ ...form, cnaePrincipalDescricao: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Segmento Econômico *</Label>
                      <Popover open={segmentoOpen} onOpenChange={setSegmentoOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={segmentoOpen}
                            className="w-full h-9 justify-between text-sm font-normal"
                          >
                            <span className={form.segmentoEconomico ? 'text-foreground truncate' : 'text-muted-foreground truncate'}>
                              {form.segmentoEconomico || 'Selecione o segmento...'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command filter={(value, search) => {
                            if (!search) return 1;
                            const normalizedValue = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                            const normalizedSearch = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                            const words = normalizedSearch.split(/\s+/);
                            return words.every(w => normalizedValue.includes(w)) ? 1 : 0;
                          }}>
                            <CommandInput placeholder="Digite para buscar..." />
                            <CommandList className="max-h-[250px]">
                              <CommandEmpty>Nenhum segmento encontrado.</CommandEmpty>
                              <CommandGroup>
                                {SEGMENTOS_ECONOMICOS.map((seg) => (
                                  <CommandItem
                                    key={seg}
                                    value={seg}
                                    onSelect={(val) => {
                                      setForm(f => ({ ...f, segmentoEconomico: val === form.segmentoEconomico ? '' : val }));
                                      setSegmentoOpen(false);
                                    }}
                                  >
                                    <Check className={`mr-2 h-4 w-4 ${form.segmentoEconomico === seg ? 'opacity-100' : 'opacity-0'}`} />
                                    <span className="text-xs">{seg}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* CNAEs Secundários */}
                  {form.cnaesSecundarios.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2">CNAEs Secundários ({form.cnaesSecundarios.length})</h4>
                      <div className="max-h-36 overflow-y-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow><TableHead className="text-xs">Código</TableHead><TableHead className="text-xs">Descrição</TableHead></TableRow>
                          </TableHeader>
                          <TableBody>
                            {form.cnaesSecundarios.map((c, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-xs py-1 font-mono">{c.codigo}</TableCell>
                                <TableCell className="text-xs py-1">{c.descricao}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Quadro Societário */}
                  {form.quadroSocietario.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2">Quadro Societário ({form.quadroSocietario.length})</h4>
                      <div className="max-h-36 overflow-y-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Nome</TableHead>
                              <TableHead className="text-xs">Qualificação</TableHead>
                              <TableHead className="text-xs w-[100px]">Faixa Etária</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {form.quadroSocietario.map((socio, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-xs py-1">{socio.nome}</TableCell>
                                <TableCell className="text-xs py-1">{socio.qualificacao}</TableCell>
                                <TableCell className="text-xs py-1">{socio.faixaEtaria || '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* ===== SEÇÃO 6: DADOS FINANCEIROS ===== */}
            <div className="space-y-3">
              <SectionHeader title="Dados Financeiros" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Faturamento Médio (R$)</Label>
                  <Input type="number" value={form.faturamentoMedioMensal} onChange={e => setForm({ ...form, faturamentoMedioMensal: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Valor Médio Guias (R$)</Label>
                  <Input type="number" value={form.valorMedioGuias} onChange={e => setForm({ ...form, valorMedioGuias: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Folha Pagamento Média (R$)</Label>
                  <Input type="number" value={form.folhaPagamentoMedia} onChange={e => setForm({ ...form, folhaPagamentoMedia: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>

              {/* Missing fields alerts */}
              {missingFields.length > 0 && !editingId && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">Campos com informações faltantes</span>
                  </div>
                  <p className="text-xs text-amber-700 mb-3">
                    Forneça uma justificativa para cada campo faltante para prosseguir com o cadastro.
                  </p>
                  <div className="space-y-2">
                    {missingFields.map(field => (
                      <div key={field} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] shrink-0 w-32 justify-center">{fieldLabel(field)}</Badge>
                        <Input
                          placeholder="Justificativa..."
                          value={justificativas[field] || ''}
                          onChange={e => setJustificativas({ ...justificativas, [field]: e.target.value })}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* ===== SEÇÃO 8: PROCURAÇÃO ELETRÔNICA (OBRIGATÓRIA) ===== */}
            <div className="space-y-3">
              <SectionHeader title="Procuração Eletrônica *" icon={<FileCheck className="w-4 h-4 text-muted-foreground" />} />

              {!procuracaoTouched && !editingId && (
                <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Campo obrigatório — defina o status da procuração eletrônica.
                </div>
              )}

              <div className={`flex items-center gap-3 p-4 rounded-lg border ${!procuracaoTouched && !editingId ? 'border-amber-400 ring-1 ring-amber-200' : ''}`}>
                <Switch
                  checked={form.procuracaoHabilitada}
                  onCheckedChange={v => {
                    setForm({ ...form, procuracaoHabilitada: v });
                    setProcuracaoTouched(true);
                  }}
                />
                <div>
                  <Label className="text-sm font-medium">
                    {form.procuracaoHabilitada ? (
                      <span className="text-green-600 flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Habilitada</span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Desabilitada</span>
                    )}
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    {form.procuracaoHabilitada ? 'Procuração eletrônica está ativa para este cliente.' : 'Procuração eletrônica não está habilitada. Ative para configurar.'}
                  </p>
                </div>
                {!procuracaoTouched && !editingId && (
                  <Button type="button" variant="outline" size="sm" className="ml-auto text-xs h-7"
                    onClick={() => setProcuracaoTouched(true)}>
                    Confirmar Desabilitada
                  </Button>
                )}
              </div>

              {form.procuracaoHabilitada && (
                <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-green-50/50 border border-green-100">
                  <div>
                    <Label className="text-xs">Certificado Vinculado *</Label>
                    <Select value={form.procuracaoCertificado || 'none'} onValueChange={v => setForm({ ...form, procuracaoCertificado: v === 'none' ? '' : v })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecione...</SelectItem>
                        <SelectItem value="Gercino Neto">Gercino Neto</SelectItem>
                        <SelectItem value="Evox Fiscal">Evox Fiscal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Data de Validade *</Label>
                    <Input type="date" value={form.procuracaoValidade} onChange={e => setForm({ ...form, procuracaoValidade: e.target.value })} className="h-9 text-sm" />
                  </div>
                  {form.procuracaoValidade && (() => {
                    const validade = new Date(form.procuracaoValidade);
                    const hoje = new Date();
                    const diffDias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDias < 0) return (
                      <div className="col-span-2 p-3 rounded-lg bg-red-100 border border-red-200 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-sm font-semibold text-red-700">Procuração Vencida</p>
                          <p className="text-xs text-red-600">Venceu há {Math.abs(diffDias)} dias. Renove imediatamente.</p>
                        </div>
                      </div>
                    );
                    if (diffDias <= 7) return (
                      <div className="col-span-2 p-3 rounded-lg bg-amber-100 border border-amber-200 flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-amber-700">Próximo ao Vencimento</p>
                          <p className="text-xs text-amber-600">Vence em {diffDias} dia{diffDias !== 1 ? 's' : ''}. Providencie a renovação.</p>
                        </div>
                      </div>
                    );
                    return (
                      <div className="col-span-2 p-3 rounded-lg bg-green-100 border border-green-200 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-semibold text-green-700">Procuração Válida</p>
                          <p className="text-xs text-green-600">Vence em {diffDias} dias ({validade.toLocaleDateString('pt-BR')}).</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <Separator />

            {/* ===== SEÇÃO 9: EXCEÇÕES ===== */}
            <div className="space-y-3">
              <SectionHeader title="Exceções / Especificidades" />
              <Textarea value={form.excecoesEspecificidades} onChange={e => setForm({ ...form, excecoesEspecificidades: e.target.value })} rows={3} className="text-sm" placeholder="Descreva exceções ou especificidades do cliente..." />
            </div>

          </div>

          {/* FOOTER FIXO */}
          <DialogFooter className="pt-4 border-t shrink-0">
            <Button variant="outline" onClick={tryCloseForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createCliente.isPending || updateCliente.isPending}>
              {(createCliente.isPending || updateCliente.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== ALERTA DE CONFIRMAÇÃO DE CANCELAMENTO ==================== */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem dados preenchidos no formulário. Se sair agora, todas as informações serão perdidas. Deseja realmente cancelar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseForm} className="bg-red-600 hover:bg-red-700">
              Descartar e Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== CONFIRM DELETE ==================== */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o cliente <strong>{confirmDelete?.razaoSocial}</strong>? Esta ação não pode ser desfeita. Considere inativar o cliente ao invés de excluir.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { deleteCliente.mutate({ id: confirmDelete.id }); setConfirmDelete(null); }} disabled={deleteCliente.isPending}>
              {deleteCliente.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Excluir Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    dataAbertura: 'Data de Abertura',
    cnaePrincipal: 'CNAE Principal',
    faturamentoMedioMensal: 'Faturamento Médio',
    valorMedioGuias: 'Valor Médio Guias',
    folhaPagamentoMedia: 'Folha Pagamento',
    segmentoEconomico: 'Segmento',
  };
  return labels[field] || field;
}
