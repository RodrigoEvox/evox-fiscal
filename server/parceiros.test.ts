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
