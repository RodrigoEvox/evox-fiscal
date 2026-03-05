import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import {
  createFornecedor,
  listFornecedores,
  updateFornecedor,
  deleteFornecedor,
  createCentroCusto,
  listCentrosCusto,
  createCategoriaFinanceira,
  listCategoriasFinanceiras,
} from "./db";

describe("Módulo Financeiro", () => {
  let db: any;
  let fornecedorId: number;

  beforeAll(async () => {
    db = await getDb();
  });

  describe("Fornecedores", () => {
    it("deve criar um novo fornecedor", async () => {
      const fornecedor = await createFornecedor(db, {
        razaoSocial: "Empresa Teste LTDA",
        nomeFantasia: "Empresa Teste",
        cnpj: "12.345.678/0001-90",
        email: "contato@empresa.com",
        telefone: "(11) 9999-9999",
        agencia: "0001",
        conta: "123456-7",
        banco: "Banco do Brasil",
      });

      expect(fornecedor).toBeDefined();
      expect(fornecedor.razaoSocial).toBe("Empresa Teste LTDA");
      expect(fornecedor.cnpj).toBe("12.345.678/0001-90");
      fornecedorId = fornecedor.id;
    });

    it("deve listar fornecedores", async () => {
      const fornecedores = await listFornecedores(db);
      expect(Array.isArray(fornecedores)).toBe(true);
      expect(fornecedores.length).toBeGreaterThan(0);
    });

    it("deve atualizar um fornecedor", async () => {
      const fornecedorAtualizado = await updateFornecedor(db, {
        id: fornecedorId,
        razaoSocial: "Empresa Teste Atualizada LTDA",
        nomeFantasia: "Empresa Teste Atualizada",
        cnpj: "12.345.678/0001-90",
        email: "novo@empresa.com",
        telefone: "(11) 8888-8888",
        agencia: "0001",
        conta: "123456-7",
        banco: "Banco do Brasil",
      });

      expect(fornecedorAtualizado.razaoSocial).toBe("Empresa Teste Atualizada LTDA");
      expect(fornecedorAtualizado.email).toBe("novo@empresa.com");
    });

    it("deve deletar um fornecedor", async () => {
      await deleteFornecedor(db, { id: fornecedorId });
      const fornecedores = await listFornecedores(db);
      const fornecedorDeletado = fornecedores.find((f: any) => f.id === fornecedorId);
      expect(fornecedorDeletado).toBeUndefined();
    });
  });

  describe("Centros de Custo", () => {
    it("deve criar um novo centro de custo", async () => {
      const centroCusto = await createCentroCusto(db, {
        codigo: "CC001",
        nome: "Centro de Custo Principal",
        descricao: "Centro de custo principal da empresa",
        ativo: true,
      });

      expect(centroCusto).toBeDefined();
      expect(centroCusto.codigo).toBe("CC001");
      expect(centroCusto.nome).toBe("Centro de Custo Principal");
    });

    it("deve listar centros de custo", async () => {
      const centrosCusto = await listCentrosCusto(db);
      expect(Array.isArray(centrosCusto)).toBe(true);
      expect(centrosCusto.length).toBeGreaterThan(0);
    });
  });

  describe("Categorias Financeiras", () => {
    it("deve criar uma nova categoria financeira", async () => {
      const categoria = await createCategoriaFinanceira(db, {
        nome: "Despesa com Fornecedores",
        tipo: "despesa",
        descricao: "Despesas com fornecedores diversos",
        ativo: true,
      });

      expect(categoria).toBeDefined();
      expect(categoria.nome).toBe("Despesa com Fornecedores");
      expect(categoria.tipo).toBe("despesa");
    });

    it("deve listar categorias financeiras", async () => {
      const categorias = await listCategoriasFinanceiras(db);
      expect(Array.isArray(categorias)).toBe(true);
      expect(categorias.length).toBeGreaterThan(0);
    });
  });
});
