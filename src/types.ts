export enum DrugType {
  IV = 'IV',
  IM = 'IM',
  SQ = 'SQ',
  ORAL = 'ORAL',
}

export interface DrugField {
  id: string;
  label: string;
  unit: string;
  defaultValue?: number;
  placeholder?: string;
}

export interface CalculationResult {
  label: string;
  value: string;
  unit: string;
  description?: string;
}

export interface DrugFormula {
  label: string;
  formula: string;
  unit: string;
  description?: string;
}

export interface Drug {
  id: string;
  name: string;
  type: DrugType;
  category: string;
  description: string;
  imageUrl?: string;
  fields: DrugField[];
  formulas: DrugFormula[];
  sort_order?: number;
}
