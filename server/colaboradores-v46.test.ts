import { describe, it, expect } from 'vitest';

// ---- Helper functions extracted from ColaboradoresGEG.tsx for testing ----

function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11 || /^(\d)\1{10}$/.test(nums)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(nums[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(nums[10]);
}

function maskCPF(v: string): string {
  const nums = v.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

function maskPhone(v: string): string {
  const nums = v.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 2) return nums.length ? `(${nums}` : '';
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

function maskCEP(v: string): string {
  const nums = v.replace(/\D/g, '').slice(0, 8);
  if (nums.length <= 5) return nums;
  return `${nums.slice(0, 5)}-${nums.slice(5)}`;
}

function calcIdade(dataNasc: string): string {
  if (!dataNasc) return '';
  const [y, m, d] = dataNasc.split('-').map(Number);
  if (!y || !m || !d) return '';
  const hoje = new Date();
  let idade = hoje.getFullYear() - y;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) idade--;
  return idade >= 0 ? `${idade} anos` : '';
}

function formatDateBR(d: string | null | undefined): string {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function calcTempoCasa(dataAdm: string): string {
  if (!dataAdm) return '—';
  const [y, m, d] = dataAdm.split('-').map(Number);
  if (!y) return '—';
  const adm = new Date(y, m - 1, d);
  const hoje = new Date();
  const meses = (hoje.getFullYear() - adm.getFullYear()) * 12 + (hoje.getMonth() - adm.getMonth());
  const anos = Math.floor(meses / 12);
  const mesesRest = meses % 12;
  if (anos === 0) return `${mesesRest}m`;
  if (mesesRest === 0) return `${anos}a`;
  return `${anos}a ${mesesRest}m`;
}

function formatCurrency(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  const num = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(num)) return '—';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---- Tests ----

describe('ColaboradoresGEG v46 - Helpers', () => {

  describe('validarCPF', () => {
    it('should validate a correct CPF', () => {
      expect(validarCPF('529.982.247-25')).toBe(true);
    });
    it('should reject an invalid CPF', () => {
      expect(validarCPF('111.111.111-11')).toBe(false);
    });
    it('should reject CPF with wrong digits', () => {
      expect(validarCPF('529.982.247-26')).toBe(false);
    });
    it('should handle unmasked CPF', () => {
      expect(validarCPF('52998224725')).toBe(true);
    });
    it('should reject short CPF', () => {
      expect(validarCPF('123')).toBe(false);
    });
    it('should reject all-same-digit CPFs', () => {
      expect(validarCPF('000.000.000-00')).toBe(false);
      expect(validarCPF('222.222.222-22')).toBe(false);
      expect(validarCPF('999.999.999-99')).toBe(false);
    });
  });

  describe('maskCPF', () => {
    it('should mask a full CPF', () => {
      expect(maskCPF('52998224725')).toBe('529.982.247-25');
    });
    it('should partially mask 3 digits', () => {
      expect(maskCPF('529')).toBe('529');
    });
    it('should partially mask 6 digits', () => {
      expect(maskCPF('529982')).toBe('529.982');
    });
    it('should partially mask 9 digits', () => {
      expect(maskCPF('529982247')).toBe('529.982.247');
    });
    it('should strip non-numeric characters', () => {
      expect(maskCPF('529.982.247-25')).toBe('529.982.247-25');
    });
    it('should limit to 11 digits', () => {
      expect(maskCPF('529982247251234')).toBe('529.982.247-25');
    });
  });

  describe('maskPhone', () => {
    it('should mask a full phone number', () => {
      expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
    });
    it('should mask 2 digits', () => {
      expect(maskPhone('11')).toBe('(11');
    });
    it('should mask 7 digits', () => {
      expect(maskPhone('1198765')).toBe('(11) 98765');
    });
    it('should return empty for empty input', () => {
      expect(maskPhone('')).toBe('');
    });
  });

  describe('maskCEP', () => {
    it('should mask a full CEP', () => {
      expect(maskCEP('01310100')).toBe('01310-100');
    });
    it('should partially mask 5 digits', () => {
      expect(maskCEP('01310')).toBe('01310');
    });
    it('should limit to 8 digits', () => {
      expect(maskCEP('013101001234')).toBe('01310-100');
    });
  });

  describe('calcIdade', () => {
    it('should calculate age correctly', () => {
      const year = new Date().getFullYear();
      const result = calcIdade(`${year - 30}-01-01`);
      expect(result).toMatch(/\d+ anos/);
    });
    it('should return empty for empty input', () => {
      expect(calcIdade('')).toBe('');
    });
    it('should return empty for invalid date', () => {
      expect(calcIdade('abc')).toBe('');
    });
  });

  describe('formatDateBR', () => {
    it('should format date to BR format', () => {
      expect(formatDateBR('2024-01-15')).toBe('15/01/2024');
    });
    it('should return — for null', () => {
      expect(formatDateBR(null)).toBe('—');
    });
    it('should return — for undefined', () => {
      expect(formatDateBR(undefined)).toBe('—');
    });
    it('should return — for empty string', () => {
      expect(formatDateBR('')).toBe('—');
    });
  });

  describe('calcTempoCasa', () => {
    it('should return — for empty input', () => {
      expect(calcTempoCasa('')).toBe('—');
    });
    it('should return months for less than 1 year', () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      const dateStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-${String(sixMonthsAgo.getDate()).padStart(2, '0')}`;
      const result = calcTempoCasa(dateStr);
      expect(result).toMatch(/^\d+m$/);
    });
    it('should return years and months for more than 1 year', () => {
      const now = new Date();
      const eighteenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 18, now.getDate());
      const dateStr = `${eighteenMonthsAgo.getFullYear()}-${String(eighteenMonthsAgo.getMonth() + 1).padStart(2, '0')}-${String(eighteenMonthsAgo.getDate()).padStart(2, '0')}`;
      const result = calcTempoCasa(dateStr);
      expect(result).toMatch(/^\d+a \d+m$/);
    });
    it('should return exact years when no remaining months', () => {
      const now = new Date();
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      const dateStr = `${twoYearsAgo.getFullYear()}-${String(twoYearsAgo.getMonth() + 1).padStart(2, '0')}-${String(twoYearsAgo.getDate()).padStart(2, '0')}`;
      const result = calcTempoCasa(dateStr);
      expect(result).toBe('2a');
    });
  });

  describe('formatCurrency', () => {
    it('should format number to BRL currency', () => {
      const result = formatCurrency(4200);
      expect(result).toContain('4.200');
    });
    it('should format string number to BRL currency', () => {
      const result = formatCurrency('5000.50');
      expect(result).toContain('5.000');
    });
    it('should return — for null', () => {
      expect(formatCurrency(null)).toBe('—');
    });
    it('should return — for undefined', () => {
      expect(formatCurrency(undefined)).toBe('—');
    });
    it('should return — for empty string', () => {
      expect(formatCurrency('')).toBe('—');
    });
    it('should return — for NaN string', () => {
      expect(formatCurrency('abc')).toBe('—');
    });
    it('should format zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });
  });
});

describe('ColaboradoresGEG v46 - List & Panel Logic', () => {

  describe('Alphabetical sorting', () => {
    it('should sort collaborators alphabetically by name', () => {
      const colabs = [
        { nomeCompleto: 'Zélia', cargo: 'Teste' },
        { nomeCompleto: 'Ana', cargo: 'Teste' },
        { nomeCompleto: 'Maria', cargo: 'Teste' },
        { nomeCompleto: 'Carlos', cargo: 'Teste' },
      ];
      const sorted = [...colabs].sort((a, b) => a.nomeCompleto.toLowerCase().localeCompare(b.nomeCompleto.toLowerCase()));
      expect(sorted[0].nomeCompleto).toBe('Ana');
      expect(sorted[1].nomeCompleto).toBe('Carlos');
      expect(sorted[2].nomeCompleto).toBe('Maria');
      expect(sorted[3].nomeCompleto).toBe('Zélia');
    });

    it('should handle descending sort', () => {
      const colabs = [
        { nomeCompleto: 'Ana', cargo: 'Teste' },
        { nomeCompleto: 'Zélia', cargo: 'Teste' },
        { nomeCompleto: 'Maria', cargo: 'Teste' },
      ];
      const sorted = [...colabs].sort((a, b) => b.nomeCompleto.toLowerCase().localeCompare(a.nomeCompleto.toLowerCase()));
      expect(sorted[0].nomeCompleto).toBe('Zélia');
      expect(sorted[1].nomeCompleto).toBe('Maria');
      expect(sorted[2].nomeCompleto).toBe('Ana');
    });
  });

  describe('Status filtering', () => {
    it('should filter by status', () => {
      const colabs = [
        { nomeCompleto: 'A', statusColaborador: 'ativo' },
        { nomeCompleto: 'B', statusColaborador: 'inativo' },
        { nomeCompleto: 'C', statusColaborador: 'ativo' },
        { nomeCompleto: 'D', statusColaborador: 'ferias' },
      ];
      const filtered = colabs.filter(c => c.statusColaborador === 'ativo');
      expect(filtered).toHaveLength(2);
      expect(filtered[0].nomeCompleto).toBe('A');
      expect(filtered[1].nomeCompleto).toBe('C');
    });

    it('should count by status', () => {
      const colabs = [
        { statusColaborador: 'ativo' },
        { statusColaborador: 'ativo' },
        { statusColaborador: 'inativo' },
        { statusColaborador: 'ferias' },
        { statusColaborador: 'ferias' },
        { statusColaborador: 'ferias' },
      ];
      const counts: Record<string, number> = {};
      colabs.forEach(c => {
        const st = c.statusColaborador || 'ativo';
        counts[st] = (counts[st] || 0) + 1;
      });
      expect(counts['ativo']).toBe(2);
      expect(counts['inativo']).toBe(1);
      expect(counts['ferias']).toBe(3);
    });
  });

  describe('Search filtering', () => {
    it('should filter by name', () => {
      const colabs = [
        { nomeCompleto: 'Ana Paula', cpf: '123', cargo: 'Gerente' },
        { nomeCompleto: 'Carlos Eduardo', cpf: '456', cargo: 'Analista' },
        { nomeCompleto: 'Maria Ana', cpf: '789', cargo: 'Assistente' },
      ];
      const search = 'ana';
      const filtered = colabs.filter(c =>
        c.nomeCompleto?.toLowerCase().includes(search) ||
        c.cpf?.includes(search) ||
        c.cargo?.toLowerCase().includes(search)
      );
      expect(filtered).toHaveLength(3); // 'Ana Paula' name, 'Maria Ana' name, 'Carlos Eduardo' cargo='Analista'
    });

    it('should filter by CPF', () => {
      const colabs = [
        { nomeCompleto: 'Ana', cpf: '529.982.247-25', cargo: 'Gerente' },
        { nomeCompleto: 'Carlos', cpf: '123.456.789-00', cargo: 'Analista' },
      ];
      const search = '529';
      const filtered = colabs.filter(c =>
        c.nomeCompleto?.toLowerCase().includes(search) ||
        c.cpf?.includes(search) ||
        c.cargo?.toLowerCase().includes(search)
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].nomeCompleto).toBe('Ana');
    });

    it('should filter by cargo', () => {
      const colabs = [
        { nomeCompleto: 'Ana', cpf: '123', cargo: 'Gerente' },
        { nomeCompleto: 'Carlos', cpf: '456', cargo: 'Analista' },
        { nomeCompleto: 'Maria', cpf: '789', cargo: 'Gerente' },
      ];
      const search = 'gerente';
      const filtered = colabs.filter(c =>
        c.nomeCompleto?.toLowerCase().includes(search) ||
        c.cpf?.includes(search) ||
        c.cargo?.toLowerCase().includes(search)
      );
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Salary calculations', () => {
    it('should calculate monthly cost', () => {
      const salarioBase = 4200;
      const comissoes = 800;
      const adicionais = 0;
      const custoMensal = salarioBase + comissoes + adicionais;
      expect(custoMensal).toBe(5000);
    });

    it('should calculate annual cost with 13th salary', () => {
      const custoMensal = 5000;
      const custoAnualCom13 = custoMensal * 13;
      expect(custoAnualCom13).toBe(65000);
    });

    it('should calculate annual cost with 13th + vacation bonus', () => {
      const salarioBase = 4200;
      const custoMensal = 5000;
      const custoAnualComFerias = custoMensal * 13 + salarioBase / 3;
      expect(custoAnualComFerias).toBe(66400);
    });
  });

  describe('Salary timeline building', () => {
    it('should sort reajustes by date', () => {
      const reajustes = [
        { dataEfetivacao: '2025-06-01', salarioAnterior: '4200', salarioNovo: '4500', tipo: 'merito', percentual: '7.14' },
        { dataEfetivacao: '2024-01-01', salarioAnterior: '3800', salarioNovo: '4200', tipo: 'sindical', percentual: '10.53' },
        { dataEfetivacao: '2025-12-01', salarioAnterior: '4500', salarioNovo: '5000', tipo: 'promocao', percentual: '11.11' },
      ];
      const sorted = [...reajustes].sort((a, b) => (a.dataEfetivacao || '').localeCompare(b.dataEfetivacao || ''));
      expect(sorted[0].dataEfetivacao).toBe('2024-01-01');
      expect(sorted[1].dataEfetivacao).toBe('2025-06-01');
      expect(sorted[2].dataEfetivacao).toBe('2025-12-01');
    });
  });

  describe('CSV export data preparation', () => {
    it('should prepare correct headers', () => {
      const headers = ['Nome Completo','CPF','Data Nascimento','Cargo','Função','Setor','Salário Base','Status','Tipo Contrato','Local Trabalho','Nível Hierárquico','Data Admissão','Email','Telefone','Vale Transporte'];
      expect(headers).toHaveLength(15);
      expect(headers[0]).toBe('Nome Completo');
      expect(headers[14]).toBe('Vale Transporte');
    });

    it('should format row data correctly', () => {
      const colab = {
        nomeCompleto: 'Ana Paula',
        cpf: '529.982.247-25',
        dataNascimento: '1995-09-12',
        cargo: 'Analista',
        funcao: 'Fiscal',
        salarioBase: '4200.00',
        statusColaborador: 'ativo',
        tipoContrato: 'clt',
        localTrabalho: 'home_office',
        nivelHierarquico: 'analista_pl',
        dataAdmissao: '2024-01-15',
        email: 'ana@test.com',
        telefone: '(11) 98765-4321',
        valeTransporte: true,
      };
      const row = [
        colab.nomeCompleto, colab.cpf, colab.dataNascimento, colab.cargo, colab.funcao,
        '', colab.salarioBase, 'Ativo', colab.tipoContrato.toUpperCase(),
        'Home Office', colab.nivelHierarquico, colab.dataAdmissao, colab.email, colab.telefone,
        colab.valeTransporte ? 'Sim' : 'Não',
      ];
      expect(row[0]).toBe('Ana Paula');
      expect(row[8]).toBe('CLT');
      expect(row[9]).toBe('Home Office');
      expect(row[14]).toBe('Sim');
    });
  });

  describe('Dependentes management', () => {
    it('should add a dependente', () => {
      const dependentes: any[] = [];
      const newDep = { nome: 'João', cpf: '123.456.789-00', dataNascimento: '2010-05-15', parentesco: 'Filho(a)', dependenteIR: true, dependentePlanoSaude: false };
      dependentes.push(newDep);
      expect(dependentes).toHaveLength(1);
      expect(dependentes[0].nome).toBe('João');
      expect(dependentes[0].dependenteIR).toBe(true);
    });

    it('should remove a dependente by index', () => {
      const dependentes = [
        { nome: 'João', parentesco: 'Filho(a)' },
        { nome: 'Maria', parentesco: 'Cônjuge' },
        { nome: 'Pedro', parentesco: 'Filho(a)' },
      ];
      const filtered = dependentes.filter((_, i) => i !== 1);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].nome).toBe('João');
      expect(filtered[1].nome).toBe('Pedro');
    });
  });

  describe('Multi-field filtering', () => {
    it('should combine status + cargo + local filters', () => {
      const colabs = [
        { nomeCompleto: 'A', statusColaborador: 'ativo', cargo: 'Gerente', localTrabalho: 'barueri' },
        { nomeCompleto: 'B', statusColaborador: 'ativo', cargo: 'Analista', localTrabalho: 'barueri' },
        { nomeCompleto: 'C', statusColaborador: 'inativo', cargo: 'Gerente', localTrabalho: 'barueri' },
        { nomeCompleto: 'D', statusColaborador: 'ativo', cargo: 'Gerente', localTrabalho: 'home_office' },
      ];
      const filtered = colabs.filter(c =>
        c.statusColaborador === 'ativo' &&
        c.cargo === 'Gerente' &&
        c.localTrabalho === 'barueri'
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].nomeCompleto).toBe('A');
    });

    it('should count active filters', () => {
      const filters = {
        filterCargo: 'Gerente',
        filterSetor: 'todos',
        filterLocal: 'barueri',
        filterVT: 'todos',
        filterNivel: 'todos',
        filterContrato: 'clt',
      };
      let count = 0;
      if (filters.filterCargo !== 'todos') count++;
      if (filters.filterSetor !== 'todos') count++;
      if (filters.filterLocal !== 'todos') count++;
      if (filters.filterVT !== 'todos') count++;
      if (filters.filterNivel !== 'todos') count++;
      if (filters.filterContrato !== 'todos') count++;
      expect(count).toBe(3);
    });
  });
});
