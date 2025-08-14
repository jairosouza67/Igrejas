import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { ProcessedDonation, ChurchSummary } from '@/types/donation';

interface ProcessingResultsProps {
  donations: ProcessedDonation[];
  summary: ChurchSummary[];
  unmappedDonations: ProcessedDonation[];
  onDownloadDetailed: () => void;
  onDownloadSummary: () => void;
  onDownloadUnmapped: () => void;
}

export function ProcessingResults({ 
  donations, 
  summary, 
  unmappedDonations, 
  onDownloadDetailed, 
  onDownloadSummary, 
  onDownloadUnmapped 
}: ProcessingResultsProps) {
  const totalAmount = summary.reduce((sum, church) => sum + church.total, 0);
  const totalDonations = summary.reduce((sum, church) => sum + church.count, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-primary mr-4" />
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              <p className="text-muted-foreground">Total arrecadado</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-accent mr-4" />
            <div>
              <p className="text-2xl font-bold">{totalDonations}</p>
              <p className="text-muted-foreground">Total de doações</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-warning mr-4" />
            <div>
              <p className="text-2xl font-bold">{unmappedDonations.length}</p>
              <p className="text-muted-foreground">Não mapeadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Resumo por Igreja</TabsTrigger>
          <TabsTrigger value="detailed">Doações Detalhadas</TabsTrigger>
          <TabsTrigger value="unmapped">Não Mapeadas</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Resumo por Igreja</CardTitle>
                <CardDescription>
                  Total arrecadado e número de doações por igreja
                </CardDescription>
              </div>
              <Button onClick={onDownloadSummary}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Igreja</TableHead>
                    <TableHead>Centavos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Doações</TableHead>
                    <TableHead className="text-right">Média</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((church) => (
                    <TableRow key={church.churchName}>
                      <TableCell className="font-medium">{church.churchName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          ,{church.cents.toString().padStart(2, '0')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(church.total)}
                      </TableCell>
                      <TableCell className="text-right">{church.count}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(church.total / church.count)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Doações Detalhadas</CardTitle>
                <CardDescription>
                  Lista completa de todas as doações processadas
                </CardDescription>
              </div>
              <Button onClick={onDownloadDetailed}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Doador</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Igreja</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.slice(0, 100).map((donation, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(donation.date)}</TableCell>
                        <TableCell>{donation.donorName || '-'}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(donation.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {donation.assignedChurch}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {donation.description || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {donations.length > 100 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Mostrando primeiras 100 doações. Download completo via CSV.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unmapped" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Doações Não Mapeadas</CardTitle>
                <CardDescription>
                  Doações que não puderam ser atribuídas a nenhuma igreja
                </CardDescription>
              </div>
              {unmappedDonations.length > 0 && (
                <Button onClick={onDownloadUnmapped}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {unmappedDonations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Todas as doações foram mapeadas com sucesso!
                </div>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Doador</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Centavos</TableHead>
                        <TableHead>Descrição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unmappedDonations.map((donation, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(donation.date)}</TableCell>
                          <TableCell>{donation.donorName || '-'}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(donation.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              ,{Math.floor((donation.amount * 100) % 100).toString().padStart(2, '0')}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {donation.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}