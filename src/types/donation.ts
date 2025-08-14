export interface RawDonation {
  date: Date;
  donorName?: string;
  amount: number;
  description?: string;
}

export interface ProcessedDonation extends RawDonation {
  cents: number;
  assignedChurch: string;
  isDuplicate?: boolean;
  isNegative?: boolean;
}

export interface ChurchSummary {
  churchName: string;
  cents: number;
  total: number;
  count: number;
}

export interface ProcessingStats {
  totalProcessed: number;
  duplicatesFound: number;
  negativeValuesFound: number;
  unmappedCount: number;
}