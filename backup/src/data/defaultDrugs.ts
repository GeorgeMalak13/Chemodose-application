import { Drug, DrugType } from '../types';

export const DEFAULT_DRUGS: Drug[] = [
  {
    "id": "006",
    "name": "Adriamycin ",
    "category": "Doxorubicin(50mg/25mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Doxorubicin dose in mgs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg" },
      { "label": "Doxorubicin dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.5", "unit": "mL" },
      { "label": "Maximum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.2)", "unit": "mL" },
      { "label": "Minimum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/1)", "unit": "mL" },
      { "label": "Zofran max. dose in mLs", "formula": "(weight*0.3)*0.5", "unit": "mL" },
      { "label": "Zofran min. dose in mLs", "formula": "(weight*0.15)*0.5", "unit": "" }
    ],
    "sort_order": 0
  },
  {
    "id": "007",
    "name": "Ara-C",
    "category": "Cytarabine (1000mg/10mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Cytarabine dose in mgs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg" },
      { "label": "Cytarabine dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.01", "unit": "mL" },
      { "label": "Maximum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.1)", "unit": "" },
      { "label": "Minimum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.2)", "unit": "" },
      { "label": "Zofran max. dose in mLs", "formula": "(weight*0.3)*0.5", "unit": "mL" },
      { "label": "Zofran min. dose in mLs", "formula": "(weight*0.15)*0.5", "unit": "mL" }
    ],
    "sort_order": 1
  },
  {
    "id": "001",
    "name": "Cytoxan",
    "category": "Cyclophosphamide (1gm/50mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Cytoxan dose in mgs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg" },
      { "label": "Cytoxan dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.05", "unit": "mL" },
      { "label": "Maximum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/2)", "unit": "mL" },
      { "label": "Minimum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/5)", "unit": "mL" },
      { "label": "Mesna total dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)/100", "unit": "mL" },
      { "label": "Mesna/ 2 dose ", "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/2", "unit": "mL" },
      { "label": "Mesna/ 3 dose ", "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/3", "unit": "mL" },
      { "label": "Mesna/ 4 dose ", "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/4", "unit": "mL" },
      { "label": "Mesna/ 5 dose ", "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/5", "unit": "mL" }
    ],
    "sort_order": 2
  },
  {
    "id": "002",
    "name": "Ifos",
    "category": "Ifosfamide (1gm/20mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Ifosfamide dose in mgs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg" },
      { "label": "Ifosfamide dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.02", "unit": "mL" },
      { "label": "Maximum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.6)", "unit": "mL" },
      { "label": "Minimum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/20)", "unit": "mL" },
      { "label": "Mesna total dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)/100", "unit": "mL" },
      { "label": "Mesna/ 2 dose ", "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/2", "unit": "mL" },
      { "label": "Mesna/ 3 dose ", "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/3", "unit": "mL" },
      { "label": "Mesna/ 4 dose ", "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/4", "unit": "mL" },
      { "label": "Mesna/ 5 dose ", "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/5", "unit": "mL" }
    ],
    "sort_order": 3
  },
  {
    "id": "005",
    "name": "L-Aspar",
    "category": "L-asparaginase E.coli (10,000 IU/2mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IM,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "L-asparaginase dose in  mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.0002", "unit": "mLs" }
    ],
    "sort_order": 4
  },
  {
    "id": "004",
    "name": "Oncovin ",
    "category": "Vincristine (1 mg/mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Vincristine dose in mgs & mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg&mLs" },
      { "label": "Zofran max. dose in mLs", "formula": "(weight*0.3)*0.5", "unit": "mL" },
      { "label": "Zofran min. dose in mLs", "formula": "(weight*0.15)*0.5", "unit": "mL" }
    ],
    "sort_order": 5
  },
  {
    "id": "003",
    "name": "Vepesid",
    "category": "Etoposide (100mg/5mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Etoposide dose in mgs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg" },
      { "label": "Etoposide dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.05", "unit": "mL" },
      { "label": "Maximum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.2)", "unit": "" },
      { "label": "Minimum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.4)", "unit": "" },
      { "label": "Zofran max. dose in mLs", "formula": "(weight*0.3)*0.5", "unit": "mL" },
      { "label": "Zofran min. dose in mLs", "formula": "(weight*0.15)*0.5", "unit": "mL" }
    ],
    "sort_order": 6
  },
  {
    "id": "009",
    "name": "Carboplat",
    "category": "Carboplatin (150mg/15mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Carboplatin dose in mgs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg" },
      { "label": "Carboplatin dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.1", "unit": "mL" },
      { "label": "Maximum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.5)", "unit": "" },
      { "label": "Minimum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/2)", "unit": "" },
      { "label": "Zofran max. dose in mLs", "formula": "(weight*0.3)*0.5", "unit": "mL" },
      { "label": "Zofran min. dose in mLs", "formula": "(weight*0.15)*0.5", "unit": "mL" }
    ],
    "sort_order": 7
  },
  {
    "id": "010",
    "name": "Cisplat",
    "category": "Cisplatin (50mg/50mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Cisplatin dose in mgs & mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg & mLs" },
      { "label": "Maximum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.5)", "unit": "" },
      { "label": "Minimum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/1)", "unit": "" },
      { "label": "Zofran max. dose in mLs", "formula": "(weight*0.3)*0.5", "unit": "mL" },
      { "label": "Zofran min. dose in mLs", "formula": "(weight*0.15)*0.5", "unit": "mL" },
      { "label": "90% Cisplatin dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.9", "unit": "mLs" },
      { "label": "10% Cisplatin dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.1", "unit": "mLs" }
    ],
    "sort_order": 8
  },
  {
    "id": "008",
    "name": "Fludara ",
    "category": "Fludarabine (50mg/2mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Fludarabine dose in mgs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg" },
      { "label": "Fludarabine dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.04", "unit": "mL" },
      { "label": "Maximum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.5)", "unit": "" },
      { "label": "Minimum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/1)", "unit": "" },
      { "label": "Zofran max. dose in mLs", "formula": "(weight*0.3)*0.5", "unit": "mL" },
      { "label": "Zofran min. dose in mLs", "formula": "(weight*0.15)*0.5", "unit": "mL" }
    ],
    "sort_order": 9
  },
  {
    "id": "011",
    "name": "Irinotecan ",
    "category": "Irinotecan (40mg/2mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Irinotecan dose in mgs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg" },
      { "label": "Irinotecan dose in mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.05", "unit": "mL" },
      { "label": "Maximum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.12)", "unit": "" },
      { "label": "Minimum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/2.8)", "unit": "" },
      { "label": "Zofran max. dose in mLs", "formula": "(weight*0.3)*0.5", "unit": "mL" },
      { "label": "Zofran min. dose in mLs", "formula": "(weight*0.15)*0.5", "unit": "mL" }
    ],
    "sort_order": 10
  },
  {
    "id": "012",
    "name": "Topotecan",
    "category": "Topotecan (4mg/4mL)",
    "description": "",
    "imageUrl": "",
    "type": DrugType.IV,
    "fields": [
      { "id": "weight", "label": "Weight", "unit": "kg", "defaultValue": 0 },
      { "id": "dose_m2", "label": "Dose", "unit": "mg/m2", "defaultValue": 0 },
      { "id": "dose_adj", "label": "Dose adustment", "unit": "max. 1", "defaultValue": 1 }
    ],
    "formulas": [
      { "label": "BSA", "formula": "((4*weight)+7)/(weight+90)", "unit": "m2" },
      { "label": "Topotecan dose in mgs & mLs", "formula": "(((4*weight)+7)/(weight+90)*dose_m2)", "unit": "mg & mLs" },
      { "label": "Maximum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.025)", "unit": "" },
      { "label": "Minimum dilution", "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.5)", "unit": "" },
      { "label": "Zofran max. dose in mLs", "formula": "(weight*0.3)*0.5", "unit": "mL" },
      { "label": "Zofran min. dose in mLs", "formula": "(weight*0.15)*0.5", "unit": "mL" }
    ],
    "sort_order": 11
  }
];
