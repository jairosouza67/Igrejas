import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ChurchMappingConfig, ChurchMapping } from '@/components/ChurchMappingConfig';
import { ProcessingResults } from '@/components/ProcessingResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DonationProcessor } from '@/utils/donationProcessor';
import { ProcessedDonation, ChurchSummary, ProcessingStats } from '@/types/donation';
import { useToast } from '@/hooks/use-toast';
import { 
  Church, 
  FileSpreadsheet, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Download
} from 'lucide-react';

const Index = () => {
  const [mappings, setMappings] = useState<ChurchMapping[]>([
    { cents: 1, churchName: 'Igreja Central' },
    { cents: 2, churchName: 'Igreja Patagônia' },
    { cents: 3, churchName: 'Igreja Ubis V' },
  ]);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<{
    donations: ProcessedDonation[];
    summary: ChurchSummary[];
    unmappedDonations: ProcessedDonation[];
    stats: ProcessingStats;
  } | null>(null);
  
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResults(null);
  };

  const processFile = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo primeiro",
        variant: "destructive",
      });
      return;
    }

    if (mappings.length === 0) {
      toast({
        title: "Erro", 
        description: "Configure pelo menos um mapeamento de igreja",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const processor = new DonationProcessor(mappings);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await processor.processExcelFile(selectedFile);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      setResults(result);
      
      toast({
        title: "Sucesso",
        description: `${result.stats.totalProcessed} doações processadas com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar arquivo",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const downloadDetailed = () => {
    if (!results) return;
    
    const data = results.donations.map(d => ({
      data: d.date.toLocaleDateString('pt-BR'),
      doador: d.donorName || '',
      valor: d.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      centavos: d.cents.toString().padStart(2, '0'),
      igreja_atribuida: d.assignedChurch,
      descricao: d.description || '',
      duplicata: d.isDuplicate ? 'Sim' : 'Não',
      negativo: d.isNegative ? 'Sim' : 'Não',
    }));
    
    DonationProcessor.exportToCSV(data, 'doacoes_detalhadas.csv');
  };

  const downloadSummary = () => {
    if (!results) return;
    
    const data = results.summary.map(s => ({
      igreja: s.churchName,
      centavos: s.cents.toString().padStart(2, '0'),
      total: s.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      quantidade_doacoes: s.count,
      valor_medio: s.count > 0 ? (s.total / s.count).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
    }));
    
    DonationProcessor.exportToCSV(data, 'resumo_por_igreja.csv');
  };

  const downloadUnmapped = () => {
    if (!results) return;
    
    const data = results.unmappedDonations.map(d => ({
      data: d.date.toLocaleDateString('pt-BR'),
      doador: d.donorName || '',
      valor: d.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      centavos: d.cents.toString().padStart(2, '0'),
      descricao: d.description || '',
    }));
    
    DonationProcessor.exportToCSV(data, 'doacoes_nao_mapeadas.csv');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Church className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Processador de Doações
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Sistema inteligente para processar arquivos bancários e atribuir doações às igrejas 
            baseado nos centavos dos valores doados
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Church Mapping Configuration */}
          <ChurchMappingConfig 
            mappings={mappings} 
            onMappingsChange={setMappings} 
          />

          <Separator />

          {/* File Upload Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Upload do Arquivo</h2>
            </div>
            
            <FileUpload onFileSelect={handleFileSelect} />
            
            {selectedFile && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Arquivo pronto para processamento</span>
                  <Badge variant="secondary">{mappings.length} igrejas configuradas</Badge>
                </div>
                <Button 
                  onClick={processFile} 
                  disabled={isProcessing}
                  size="lg"
                  className="min-w-32"
                >
                  {isProcessing ? 'Processando...' : 'Processar Arquivo'}
                </Button>
              </div>
            )}

            {isProcessing && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Processando arquivo...</span>
                      <span className="text-sm text-muted-foreground">{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          {results && (
            <>
              <Separator />
              
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Resultados do Processamento</h2>
                </div>

                {/* Processing Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{results.stats.totalProcessed}</div>
                      <div className="text-sm text-muted-foreground">Total processadas</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-success">{results.summary.length}</div>
                      <div className="text-sm text-muted-foreground">Igrejas beneficiadas</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-warning">{results.stats.duplicatesFound}</div>
                      <div className="text-sm text-muted-foreground">Duplicatas encontradas</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-destructive">{results.stats.unmappedCount}</div>
                      <div className="text-sm text-muted-foreground">Não mapeadas</div>
                    </CardContent>
                  </Card>
                </div>

                {results.stats.negativeValuesFound > 0 && (
                  <Card className="border-warning">
                    <CardContent className="p-4 flex items-center">
                      <AlertCircle className="h-5 w-5 text-warning mr-3" />
                      <span className="text-sm">
                        <strong>{results.stats.negativeValuesFound}</strong> valores negativos (estornos) foram encontrados e processados.
                      </span>
                    </CardContent>
                  </Card>
                )}

                <ProcessingResults
                  donations={results.donations}
                  summary={results.summary}
                  unmappedDonations={results.unmappedDonations}
                  onDownloadDetailed={downloadDetailed}
                  onDownloadSummary={downloadSummary}
                  onDownloadUnmapped={downloadUnmapped}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
