import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ChurchMapping {
  cents: number;
  churchName: string;
}

interface ChurchMappingConfigProps {
  mappings: ChurchMapping[];
  onMappingsChange: (mappings: ChurchMapping[]) => void;
}

export function ChurchMappingConfig({ mappings, onMappingsChange }: ChurchMappingConfigProps) {
  const [newCents, setNewCents] = useState('');
  const [newChurchName, setNewChurchName] = useState('');
  const { toast } = useToast();

  const addMapping = () => {
    const cents = parseInt(newCents);
    if (isNaN(cents) || cents < 0 || cents > 99) {
      toast({
        title: "Erro",
        description: "Os centavos devem ser um número entre 00 e 99",
        variant: "destructive",
      });
      return;
    }

    if (!newChurchName.trim()) {
      toast({
        title: "Erro",
        description: "O nome da igreja é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (mappings.some(m => m.cents === cents)) {
      toast({
        title: "Erro",
        description: "Já existe um mapeamento para estes centavos",
        variant: "destructive",
      });
      return;
    }

    const newMapping: ChurchMapping = {
      cents,
      churchName: newChurchName.trim(),
    };

    onMappingsChange([...mappings, newMapping].sort((a, b) => a.cents - b.cents));
    setNewCents('');
    setNewChurchName('');
    
    toast({
      title: "Sucesso",
      description: "Mapeamento adicionado com sucesso",
    });
  };

  const removeMapping = (cents: number) => {
    onMappingsChange(mappings.filter(m => m.cents !== cents));
    toast({
      title: "Sucesso",
      description: "Mapeamento removido",
    });
  };

  const exportMappings = () => {
    const csvContent = "cents,church_name\n" + 
      mappings.map(m => `${m.cents.toString().padStart(2, '0')},${m.churchName}`).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mapeamento_igrejas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const importMappings = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        const newMappings: ChurchMapping[] = [];
        
        // Skip header if exists
        const startIndex = lines[0].toLowerCase().includes('cents') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
          const [centsStr, churchName] = lines[i].split(',');
          const cents = parseInt(centsStr.trim());
          
          if (!isNaN(cents) && cents >= 0 && cents <= 99 && churchName?.trim()) {
            newMappings.push({
              cents,
              churchName: churchName.trim(),
            });
          }
        }
        
        onMappingsChange(newMappings.sort((a, b) => a.cents - b.cents));
        toast({
          title: "Sucesso",
          description: `${newMappings.length} mapeamentos importados`,
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao importar arquivo CSV",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Configuração de Mapeamento
          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && importMappings(e.target.files[0])}
              className="hidden"
              id="import-csv"
            />
            <label htmlFor="import-csv">
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Importar CSV
              </Button>
            </label>
            <Button variant="outline" size="sm" onClick={exportMappings}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Configure qual igreja recebe doações baseado nos centavos do valor (ex.: ,01 → Igreja A)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new mapping */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="cents">Centavos (00-99)</Label>
            <Input
              id="cents"
              type="number"
              min="0"
              max="99"
              value={newCents}
              onChange={(e) => setNewCents(e.target.value)}
              placeholder="01"
            />
          </div>
          <div className="flex-2">
            <Label htmlFor="church">Nome da Igreja</Label>
            <Input
              id="church"
              value={newChurchName}
              onChange={(e) => setNewChurchName(e.target.value)}
              placeholder="Igreja Exemplo"
            />
          </div>
          <Button onClick={addMapping}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Mappings table */}
        {mappings.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Centavos</TableHead>
                  <TableHead>Igreja</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.cents}>
                    <TableCell>
                      <Badge variant="outline">
                        ,{mapping.cents.toString().padStart(2, '0')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{mapping.churchName}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMapping(mapping.cents)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {mappings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum mapeamento configurado. Adicione mapeamentos para começar.
          </div>
        )}
      </CardContent>
    </Card>
  );
}