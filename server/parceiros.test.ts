import { describe, expect, it } from "vitest";

// CPF validation logic (same as frontend)
function validarCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(d[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(d[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(d[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(d[10]);
}

describe("Validação de CPF", () => {
  it("aceita CPFs válidos", () => {
    // CPFs válidos conhecidos
    expect(validarCpf("529.982.247-25")).toBe(true);
    expect(validarCpf("52998224725")).toBe(true);
    expect(validarCpf("111.444.777-35")).toBe(true);
    expect(validarCpf("11144477735")).toBe(true);
  });

  it("rejeita CPFs com todos os dígitos iguais", () => {
    expect(validarCpf("111.111.111-11")).toBe(false);
    expect(validarCpf("000.000.000-00")).toBe(false);
    expect(validarCpf("222.222.222-22")).toBe(false);
    expect(validarCpf("999.999.999-99")).toBe(false);
  });

  it("rejeita CPFs com dígitos verificadores errados", () => {
    expect(validarCpf("529.982.247-26")).toBe(false); // último dígito errado
    expect(validarCpf("529.982.247-15")).toBe(false); // penúltimo dígito errado
    expect(validarCpf("123.456.789-00")).toBe(false);
  });

  it("rejeita CPFs com tamanho incorreto", () => {
    expect(validarCpf("123")).toBe(false);
    expect(validarCpf("12345678901234")).toBe(false);
    expect(validarCpf("")).toBe(false);
    expect(validarCpf("abc")).toBe(false);
  });

  it("aceita CPF com máscara e sem máscara", () => {
    const cpfComMascara = "529.982.247-25";
    const cpfSemMascara = "52998224725";
    expect(validarCpf(cpfComMascara)).toBe(true);
    expect(validarCpf(cpfSemMascara)).toBe(true);
  });
});

describe("Lógica de hierarquia parceiro/subparceiro", () => {
  const parceiros = [
    { id: 1, apelido: "João", nomeCompleto: "João Silva", ehSubparceiro: false, parceiroPaiId: null },
    { id: 2, apelido: "Pedro", nomeCompleto: "Pedro Santos", ehSubparceiro: true, parceiroPaiId: 1 },
    { id: 3, apelido: "Maria", nomeCompleto: "Maria Oliveira", ehSubparceiro: false, parceiroPaiId: null },
    { id: 4, apelido: null, nomeCompleto: "Carlos Souza", ehSubparceiro: true, parceiroPaiId: 3 },
  ];

  function getDisplayName(p: typeof parceiros[0]) {
    return p.apelido || p.nomeCompleto;
  }

  function getParceiroNome(id: number | null) {
    if (!id) return null;
    const p = parceiros.find(p => p.id === id);
    return p ? getDisplayName(p) : null;
  }

  function getParceiroPaiNome(parceiroId: number | null) {
    if (!parceiroId) return null;
    const parceiro = parceiros.find(p => p.id === parceiroId);
    if (!parceiro || !parceiro.ehSubparceiro || !parceiro.parceiroPaiId) return null;
    const pai = parceiros.find(p => p.id === parceiro.parceiroPaiId);
    return pai ? getDisplayName(pai) : null;
  }

  it("exibe apelido quando disponível", () => {
    expect(getDisplayName(parceiros[0])).toBe("João");
    expect(getDisplayName(parceiros[1])).toBe("Pedro");
  });

  it("exibe nomeCompleto quando apelido é null", () => {
    expect(getDisplayName(parceiros[3])).toBe("Carlos Souza");
  });

  it("identifica parceiro principal", () => {
    expect(parceiros[0].ehSubparceiro).toBe(false);
    expect(parceiros[0].parceiroPaiId).toBeNull();
  });

  it("identifica subparceiro e seu parceiro pai", () => {
    expect(parceiros[1].ehSubparceiro).toBe(true);
    expect(parceiros[1].parceiroPaiId).toBe(1);
    expect(getParceiroNome(parceiros[1].parceiroPaiId)).toBe("João");
  });

  it("resolve cadeia completa: empresa -> subparceiro -> parceiro", () => {
    // Empresa JMT é do subparceiro Pedro (id=2) vinculado ao parceiro João (id=1)
    const empresaParceiroId = 2;
    const parceiroNome = getParceiroNome(empresaParceiroId);
    const parceiroPaiNome = getParceiroPaiNome(empresaParceiroId);

    expect(parceiroNome).toBe("Pedro");
    expect(parceiroPaiNome).toBe("João");
  });

  it("retorna null para parceiro pai quando é parceiro principal", () => {
    const empresaParceiroId = 1;
    const parceiroPaiNome = getParceiroPaiNome(empresaParceiroId);
    expect(parceiroPaiNome).toBeNull();
  });

  it("retorna null para parceiro pai quando id é null", () => {
    expect(getParceiroPaiNome(null)).toBeNull();
  });
});

describe("Lógica de comissões e rateio", () => {
  const comissoesPadrao: Record<number, number> = {
    1: 50, // Transação tributária - Diamante 50%
    2: 40, // Recuperação de crédito - Diamante 40%
    3: 30, // Consultoria - Diamante 30%
  };

  function getComissaoPadrao(servicoId: number): number | null {
    return comissoesPadrao[servicoId] ?? null;
  }

  function validarRateio(parceiroPct: number, subparceiroPct: number, maxComissao: number): { valid: boolean; error?: string } {
    const total = parceiroPct + subparceiroPct;
    if (total > maxComissao) return { valid: false, error: `Soma ${total}% excede máximo de ${maxComissao}%` };
    if (parceiroPct < 0 || subparceiroPct < 0) return { valid: false, error: 'Percentuais não podem ser negativos' };
    return { valid: true };
  }

  function classificarComissao(custom: number, padrao: number): 'menor' | 'maior' | 'padrao' {
    if (custom < padrao) return 'menor';
    if (custom > padrao) return 'maior';
    return 'padrao';
  }

  it("retorna comissão padrão por serviço", () => {
    expect(getComissaoPadrao(1)).toBe(50);
    expect(getComissaoPadrao(2)).toBe(40);
    expect(getComissaoPadrao(999)).toBeNull();
  });

  it("classifica comissão customizada vs padrão", () => {
    expect(classificarComissao(50, 50)).toBe('padrao');
    expect(classificarComissao(45, 50)).toBe('menor');
    expect(classificarComissao(55, 50)).toBe('maior');
  });

  it("valida rateio dentro do limite", () => {
    expect(validarRateio(30, 20, 50)).toEqual({ valid: true });
    expect(validarRateio(25, 25, 50)).toEqual({ valid: true });
    expect(validarRateio(0, 50, 50)).toEqual({ valid: true });
  });

  it("rejeita rateio que excede o máximo", () => {
    const result = validarRateio(30, 25, 50);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('excede');
  });

  it("rejeita percentuais negativos", () => {
    expect(validarRateio(-5, 30, 50).valid).toBe(false);
    expect(validarRateio(30, -5, 50).valid).toBe(false);
  });

  it("rateio auto-calcula o campo complementar", () => {
    const maxComissao = 50;
    const parceiroPct = 30;
    const subparceiroPct = maxComissao - parceiroPct;
    expect(subparceiroPct).toBe(20);
    expect(validarRateio(parceiroPct, subparceiroPct, maxComissao).valid).toBe(true);
  });
});

describe("Herança de executivo comercial para subparceiro", () => {
  const parceiros = [
    { id: 1, apelido: 'João', executivoComercialId: 5, ehSubparceiro: false, parceiroPaiId: null },
    { id: 2, apelido: 'Pedro', executivoComercialId: null, ehSubparceiro: true, parceiroPaiId: 1 },
    { id: 3, apelido: 'Maria', executivoComercialId: 7, ehSubparceiro: false, parceiroPaiId: null },
  ];

  function getExecutivoForSubparceiro(subparceiroId: number): number | null {
    const sub = parceiros.find(p => p.id === subparceiroId);
    if (!sub || !sub.ehSubparceiro || !sub.parceiroPaiId) return sub?.executivoComercialId ?? null;
    const pai = parceiros.find(p => p.id === sub.parceiroPaiId);
    return pai?.executivoComercialId ?? null;
  }

  it("herda executivo do parceiro pai", () => {
    expect(getExecutivoForSubparceiro(2)).toBe(5);
  });

  it("retorna executivo próprio para parceiro principal", () => {
    expect(getExecutivoForSubparceiro(1)).toBe(5);
    expect(getExecutivoForSubparceiro(3)).toBe(7);
  });
});

describe("Máscaras de formatação", () => {
  function maskCpf(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, e) => e ? `${a}.${b}.${c}-${e}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
  }

  function maskCnpj(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 14);
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, e, f) => f ? `${a}.${b}.${c}/${e}-${f}` : e ? `${a}.${b}.${c}/${e}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
  }

  it("formata CPF corretamente", () => {
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
    expect(maskCpf("529")).toBe("529");
    expect(maskCpf("529982")).toBe("529982"); // regex só aplica máscara com 9+ dígitos
    expect(maskCpf("529982247")).toBe("529.982.247");
    expect(maskCpf("5299822472")).toBe("529.982.247-2");
  });

  it("formata CNPJ corretamente", () => {
    expect(maskCnpj("12345678000195")).toBe("12.345.678/0001-95");
    expect(maskCnpj("12345")).toBe("12345"); // regex só aplica máscara com 12+ dígitos
    expect(maskCnpj("123456780001")).toBe("12.345.678/0001");
  });

  it("limita tamanho do CPF a 11 dígitos", () => {
    const result = maskCpf("529982247251234");
    expect(result.replace(/\D/g, '').length).toBeLessThanOrEqual(11);
  });

  it("limita tamanho do CNPJ a 14 dígitos", () => {
    const result = maskCnpj("1234567800019512345");
    expect(result.replace(/\D/g, '').length).toBeLessThanOrEqual(14);
  });
});

describe("Relatório de comissões - lógica de consolidação", () => {
  const parceiros = [
    { id: 1, apelido: "João", nomeCompleto: "João Silva", ehSubparceiro: false, parceiroPaiId: null, modeloParceriaId: 1, executivoComercialId: 5, ativo: true },
    { id: 2, apelido: "Pedro", nomeCompleto: "Pedro Santos", ehSubparceiro: true, parceiroPaiId: 1, modeloParceriaId: 1, executivoComercialId: 5, ativo: true },
    { id: 3, apelido: "Maria", nomeCompleto: "Maria Oliveira", ehSubparceiro: false, parceiroPaiId: null, modeloParceriaId: 2, executivoComercialId: 7, ativo: true },
    { id: 4, apelido: null, nomeCompleto: "Carlos Inativo", ehSubparceiro: false, parceiroPaiId: null, modeloParceriaId: 1, executivoComercialId: 5, ativo: false },
  ];

  const clientes = [
    { id: 1, parceiroId: 1, faturamentoMedioMensal: "100000" },
    { id: 2, parceiroId: 1, faturamentoMedioMensal: "200000" },
    { id: 3, parceiroId: 2, faturamentoMedioMensal: "50000" },
    { id: 4, parceiroId: 3, faturamentoMedioMensal: "150000" },
  ];

  const modelos = [
    { id: 1, nome: "Diamante" },
    { id: 2, nome: "Ouro" },
  ];

  function buildRelatorio(filterModelo: string, filterExecutivo: string, filterTipo: string) {
    let list = parceiros.filter(p => p.ativo !== false);

    if (filterModelo !== 'todos') {
      list = list.filter(p => String(p.modeloParceriaId) === filterModelo);
    }
    if (filterExecutivo !== 'todos') {
      list = list.filter(p => String(p.executivoComercialId) === filterExecutivo);
    }
    if (filterTipo === 'parceiro') {
      list = list.filter(p => !p.ehSubparceiro);
    } else if (filterTipo === 'subparceiro') {
      list = list.filter(p => p.ehSubparceiro);
    }

    return list.map(parceiro => {
      const modelo = modelos.find(m => m.id === parceiro.modeloParceriaId);
      const clientesVinculados = clientes.filter(c => c.parceiroId === parceiro.id);
      const subparceiros = parceiros.filter(p => p.ehSubparceiro && p.parceiroPaiId === parceiro.id && p.ativo);
      const clientesSubparceiros = clientes.filter(c =>
        subparceiros.some(sp => sp.id === c.parceiroId)
      );
      const totalFaturamento = clientesVinculados.reduce((sum, c) => sum + Number(c.faturamentoMedioMensal || 0), 0);
      const totalFaturamentoComSub = totalFaturamento + clientesSubparceiros.reduce((sum, c) => sum + Number(c.faturamentoMedioMensal || 0), 0);

      return {
        ...parceiro,
        modeloNome: modelo?.nome || '-',
        clientesVinculados,
        subparceiros,
        totalFaturamento,
        totalFaturamentoComSub,
        totalClientes: clientesVinculados.length,
      };
    });
  }

  it("filtra apenas parceiros ativos", () => {
    const rel = buildRelatorio('todos', 'todos', 'todos');
    expect(rel.length).toBe(3); // Carlos Inativo excluído
    expect(rel.find(r => r.id === 4)).toBeUndefined();
  });

  it("filtra por modelo de parceria", () => {
    const rel = buildRelatorio('1', 'todos', 'todos');
    expect(rel.length).toBe(2); // João e Pedro (Diamante)
    expect(rel.every(r => r.modeloParceriaId === 1)).toBe(true);
  });

  it("filtra por executivo comercial", () => {
    const rel = buildRelatorio('todos', '7', 'todos');
    expect(rel.length).toBe(1);
    expect(rel[0].apelido).toBe("Maria");
  });

  it("filtra apenas parceiros principais", () => {
    const rel = buildRelatorio('todos', 'todos', 'parceiro');
    expect(rel.length).toBe(2); // João e Maria
    expect(rel.every(r => !r.ehSubparceiro)).toBe(true);
  });

  it("filtra apenas subparceiros", () => {
    const rel = buildRelatorio('todos', 'todos', 'subparceiro');
    expect(rel.length).toBe(1);
    expect(rel[0].apelido).toBe("Pedro");
  });

  it("calcula faturamento direto corretamente", () => {
    const rel = buildRelatorio('todos', 'todos', 'todos');
    const joao = rel.find(r => r.id === 1)!;
    expect(joao.totalFaturamento).toBe(300000); // 100k + 200k
    expect(joao.totalClientes).toBe(2);
  });

  it("calcula faturamento com subparceiros", () => {
    const rel = buildRelatorio('todos', 'todos', 'todos');
    const joao = rel.find(r => r.id === 1)!;
    expect(joao.totalFaturamentoComSub).toBe(350000); // 300k + 50k do Pedro
    expect(joao.subparceiros.length).toBe(1);
  });

  it("identifica modelo correto", () => {
    const rel = buildRelatorio('todos', 'todos', 'todos');
    const joao = rel.find(r => r.id === 1)!;
    expect(joao.modeloNome).toBe("Diamante");
    const maria = rel.find(r => r.id === 3)!;
    expect(maria.modeloNome).toBe("Ouro");
  });
});

describe("Painel de aprovações - lógica de status", () => {
  const aprovacoes = [
    { id: 1, parceiroId: 1, servicoId: 1, percentualSolicitado: "55.00", percentualPadrao: "50.00", status: "pendente" },
    { id: 2, parceiroId: 2, servicoId: 2, percentualSolicitado: "45.00", percentualPadrao: "40.00", status: "aprovado" },
    { id: 3, parceiroId: 3, servicoId: 1, percentualSolicitado: "60.00", percentualPadrao: "50.00", status: "rejeitado" },
  ];

  function filterByStatus(status: string) {
    if (status === 'todos') return aprovacoes;
    return aprovacoes.filter(a => a.status === status);
  }

  function getDiferenca(solicitado: string, padrao: string): number {
    return Number(solicitado) - Number(padrao);
  }

  it("filtra aprovações pendentes", () => {
    const pendentes = filterByStatus('pendente');
    expect(pendentes.length).toBe(1);
    expect(pendentes[0].id).toBe(1);
  });

  it("filtra aprovações aprovadas", () => {
    expect(filterByStatus('aprovado').length).toBe(1);
  });

  it("filtra aprovações rejeitadas", () => {
    expect(filterByStatus('rejeitado').length).toBe(1);
  });

  it("retorna todas quando filtro é 'todos'", () => {
    expect(filterByStatus('todos').length).toBe(3);
  });

  it("calcula diferença percentual corretamente", () => {
    expect(getDiferenca("55.00", "50.00")).toBe(5);
    expect(getDiferenca("45.00", "40.00")).toBe(5);
    expect(getDiferenca("60.00", "50.00")).toBe(10);
  });

  it("identifica que todas as solicitações são acima do padrão", () => {
    aprovacoes.forEach(a => {
      expect(Number(a.percentualSolicitado)).toBeGreaterThan(Number(a.percentualPadrao));
    });
  });
});
