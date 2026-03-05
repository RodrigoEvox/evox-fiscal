import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { FinanceiroModal } from "@/components/FinanceiroModal";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function FornecedoresFinanceiro() {
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    email: "",
    telefone: "",
    agencia: "",
    conta: "",
    banco: "",
  });

  const { data: fornecedores, isLoading } = trpc.financeiro.listFornecedores.useQuery();
  const createMutation = trpc.financeiro.createFornecedor.useMutation();
  const updateMutation = trpc.financeiro.updateFornecedor.useMutation();
  const deleteMutation = trpc.financeiro.deleteFornecedor.useMutation();

  const handleOpenModal = (fornecedor?: any) => {
    if (fornecedor) {
      setEditingId(fornecedor.id);
      setFormData(fornecedor);
    } else {
      setEditingId(null);
      setFormData({
        razaoSocial: "",
        nomeFantasia: "",
        cnpj: "",
        email: "",
        telefone: "",
        agencia: "",
        conta: "",
        banco: "",
      });
    }
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Fornecedor criado com sucesso!");
      }
      setOpenModal(false);
    } catch (error) {
      toast.error("Erro ao salvar fornecedor");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Fornecedor excluído com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir fornecedor");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cadastro de Fornecedores</h1>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Fornecedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fornecedores Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : fornecedores && fornecedores.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-4">Razão Social</th>
                    <th className="text-left py-2 px-4">CNPJ</th>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Telefone</th>
                    <th className="text-right py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {fornecedores.map((fornecedor: any) => (
                    <tr key={fornecedor.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{fornecedor.razaoSocial}</td>
                      <td className="py-2 px-4">{fornecedor.cnpj}</td>
                      <td className="py-2 px-4">{fornecedor.email || "-"}</td>
                      <td className="py-2 px-4">{fornecedor.telefone || "-"}</td>
                      <td className="py-2 px-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(fornecedor)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(fornecedor.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum fornecedor cadastrado ainda.</p>
              <p className="text-sm">Clique em "Novo Fornecedor" para adicionar.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <FinanceiroModal
        open={openModal}
        onOpenChange={setOpenModal}
        title={editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Razão Social *</label>
            <Input
              value={formData.razaoSocial}
              onChange={(e) =>
                setFormData({ ...formData, razaoSocial: e.target.value })
              }
              placeholder="Nome da empresa"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Nome Fantasia</label>
            <Input
              value={formData.nomeFantasia}
              onChange={(e) =>
                setFormData({ ...formData, nomeFantasia: e.target.value })
              }
              placeholder="Nome comercial"
            />
          </div>
          <div>
            <label className="text-sm font-medium">CNPJ *</label>
            <Input
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@fornecedor.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Telefone</label>
            <Input
              value={formData.telefone}
              onChange={(e) =>
                setFormData({ ...formData, telefone: e.target.value })
              }
              placeholder="(11) 9999-9999"
            />
          </div>
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Dados Bancários</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Banco</label>
                <Input
                  value={formData.banco}
                  onChange={(e) =>
                    setFormData({ ...formData, banco: e.target.value })
                  }
                  placeholder="Banco do Brasil"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Agência</label>
                  <Input
                    value={formData.agencia}
                    onChange={(e) =>
                      setFormData({ ...formData, agencia: e.target.value })
                    }
                    placeholder="0001"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Conta</label>
                  <Input
                    value={formData.conta}
                    onChange={(e) =>
                      setFormData({ ...formData, conta: e.target.value })
                    }
                    placeholder="123456-7"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </FinanceiroModal>
    </div>
  );
}
