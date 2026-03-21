export interface HistoryRecord {
  id: string;
  timestamp: string;
  patient_name: string;
  patient_age: number;
  condition: string;
  esi_level: number;
  acuity: string;
  symptoms: string[];
}