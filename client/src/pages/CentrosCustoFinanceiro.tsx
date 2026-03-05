import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CentrosCustoFinanceiro() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Centros de Custo</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Centro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Centros de Custo Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum centro de custo cadastrado ainda.</p>
            <p className="text-sm">Clique em "Novo Centro" para adicionar.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
