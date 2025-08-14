import * as XLSX from 'xlsx';
import { ChurchMapping } from '@/components/ChurchMappingConfig';
import { RawDonation, ProcessedDonation, ChurchSummary, ProcessingStats } from '@/types/donation';

export class DonationProcessor {
  private mappings: Map<number, string>;

  constructor(mappings: ChurchMapping[]) {
    this.mappings = new Map(mappings.map(m => [m.cents, m.churchName]));
  }

  async processExcelFile(file: File): Promise<{
    donations: ProcessedDonation[];
    summary: ChurchSummary[];
    unmappedDonations: ProcessedDonation[];
    stats: ProcessingStats;
  }> {
    const rawDonations = await this.readExcelFile(file);
    const processedDonations = this.processDonations(rawDonations);
    const { mappedDonations, unmappedDonations } = this.separateByMapping(processedDonations);
    const summary = this.generateSummary(mappedDonations);
    const stats = this.generateStats(processedDonations, unmappedDonations);

    return {
      donations: mappedDonations,
      summary,
      unmappedDonations,
      stats,
    };
  }

  private async readExcelFile(file: File): Promise<RawDonation[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Use the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          const donations = this.parseExcelData(jsonData);
          resolve(donations);
        } catch (error) {
          reject(new Error(`Erro ao processar arquivo Excel: ${error}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  private parseExcelData(data: any[][]): RawDonation[] {
    if (data.length === 0) return [];

    // Find headers (assuming first row or search for known patterns)
    const headers = data[0].map((h: any) => String(h).toLowerCase());
    
    // Map column indices
    const dateIndex = this.findColumnIndex(headers, ['data', 'date', 'dt']);
    const amountIndex = this.findColumnIndex(headers, ['valor', 'amount', 'value', 'vlr']);
    const donorIndex = this.findColumnIndex(headers, ['doador', 'donor', 'nome', 'name']);
    const descriptionIndex = this.findColumnIndex(headers, ['descricao', 'description', 'desc', 'observacao']);

    if (dateIndex === -1 || amountIndex === -1) {
      throw new Error('Colunas obrigatórias não encontradas. Certifique-se de que há colunas de data e valor.');
    }

    const donations: RawDonation[] = [];

    // Process data rows (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      try {
        const date = this.parseDate(row[dateIndex]);
        const amount = this.parseAmount(row[amountIndex]);
        
        if (date && !isNaN(amount)) {
          donations.push({
            date,
            amount,
            donorName: donorIndex !== -1 ? String(row[donorIndex] || '').trim() || undefined : undefined,
            description: descriptionIndex !== -1 ? String(row[descriptionIndex] || '').trim() || undefined : undefined,
          });
        }
      } catch (error) {
        console.warn(`Erro ao processar linha ${i + 1}:`, error);
      }
    }

    return donations;
  }

  private findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name));
      if (index !== -1) return index;
    }
    return -1;
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;

    // Handle Excel date number
    if (typeof value === 'number') {
      return new Date((value - 25569) * 86400 * 1000);
    }

    // Handle string dates
    const dateStr = String(value);
    
    // Try common Brazilian formats
    const patterns = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern);
      if (match) {
        const [, part1, part2, part3] = match;
        
        // Check if it's YYYY-MM-DD format
        if (pattern.source.includes('(\\d{4})')) {
          return new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          return new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1));
        }
      }
    }

    // Fallback to JS Date parsing
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseAmount(value: any): number {
    if (typeof value === 'number') return value;
    
    const str = String(value || '').trim();
    if (!str) return NaN;

    // Remove currency symbols and normalize
    let normalized = str
      .replace(/[R$\s]/g, '') // Remove R$ and spaces
      .replace(/\./g, '') // Remove thousands separator (dots)
      .replace(',', '.'); // Replace decimal separator (comma to dot)

    // Handle negative values
    const isNegative = normalized.includes('-') || normalized.includes('(');
    normalized = normalized.replace(/[-()]/g, '');

    const amount = parseFloat(normalized);
    return isNegative ? -amount : amount;
  }

  private processDonations(rawDonations: RawDonation[]): ProcessedDonation[] {
    const processedDonations: ProcessedDonation[] = [];
    const seen = new Set<string>();

    for (const donation of rawDonations) {
      // Extract cents correctly using precise decimal arithmetic
      const amountInCents = Math.round(Math.abs(donation.amount) * 100);
      const cents = amountInCents % 100;

      // Create unique key for duplicate detection
      const key = `${donation.date.toISOString().split('T')[0]}_${donation.amount}_${donation.donorName || ''}_${donation.description || ''}`;
      const isDuplicate = seen.has(key);
      seen.add(key);

      // Assign church based on cents
      const assignedChurch = this.mappings.get(cents) || 'Não mapeado';

      processedDonations.push({
        ...donation,
        cents,
        assignedChurch,
        isDuplicate,
        isNegative: donation.amount < 0,
      });
    }

    return processedDonations;
  }

  private separateByMapping(donations: ProcessedDonation[]): {
    mappedDonations: ProcessedDonation[];
    unmappedDonations: ProcessedDonation[];
  } {
    const mappedDonations = donations.filter(d => d.assignedChurch !== 'Não mapeado');
    const unmappedDonations = donations.filter(d => d.assignedChurch === 'Não mapeado');

    return { mappedDonations, unmappedDonations };
  }

  private generateSummary(donations: ProcessedDonation[]): ChurchSummary[] {
    const churchMap = new Map<string, { total: number; count: number; cents: number }>();

    for (const donation of donations) {
      if (donation.assignedChurch === 'Não mapeado') continue;

      const existing = churchMap.get(donation.assignedChurch) || { total: 0, count: 0, cents: donation.cents };
      existing.total += Math.abs(donation.amount); // Use absolute value for totals
      existing.count++;
      churchMap.set(donation.assignedChurch, existing);
    }

    return Array.from(churchMap.entries()).map(([churchName, data]) => ({
      churchName,
      cents: data.cents,
      total: data.total,
      count: data.count,
    })).sort((a, b) => b.total - a.total); // Sort by total descending
  }

  private generateStats(allDonations: ProcessedDonation[], unmappedDonations: ProcessedDonation[]): ProcessingStats {
    return {
      totalProcessed: allDonations.length,
      duplicatesFound: allDonations.filter(d => d.isDuplicate).length,
      negativeValuesFound: allDonations.filter(d => d.isNegative).length,
      unmappedCount: unmappedDonations.length,
    };
  }

  static exportToCSV(data: any[], filename: string): void {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}