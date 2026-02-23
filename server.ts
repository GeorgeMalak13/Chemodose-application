import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const app = express();
const PORT = 3000;
const db = new Database("meddose.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS drugs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    imageUrl TEXT,
    type TEXT NOT NULL,
    fields TEXT NOT NULL, -- JSON array of fields
    formulas TEXT NOT NULL, -- JSON array of { label, formula, unit, description }
    sort_order INTEGER DEFAULT 0
  )
`);

// Migration: Add sort_order if missing
try {
  db.prepare("SELECT sort_order FROM drugs LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE drugs ADD COLUMN sort_order INTEGER DEFAULT 0");
}

app.use(express.json());

// API Routes
app.get("/api/drugs", (req, res) => {
  const drugs = db.prepare("SELECT * FROM drugs ORDER BY sort_order ASC, name ASC").all();
  res.json(drugs.map(d => ({
    ...d,
    fields: JSON.parse(d.fields as string),
    formulas: JSON.parse(d.formulas as string)
  })));
});

app.post("/api/drugs", (req, res) => {
  const { id, name, category, description, imageUrl, type, fields, formulas, sort_order } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO drugs (id, name, category, description, imageUrl, type, fields, formulas, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, category, description, imageUrl, type, JSON.stringify(fields), JSON.stringify(formulas), sort_order || 0);
    res.status(201).json({ message: "Drug created" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/drugs/:id", (req, res) => {
  const { id: newId, name, category, description, imageUrl, type, fields, formulas, sort_order } = req.body;
  const { id: oldId } = req.params;
  try {
    db.transaction(() => {
      if (newId !== oldId) {
        const exists = db.prepare("SELECT id FROM drugs WHERE id = ?").get(newId);
        if (exists) throw new Error("New ID already exists");
        
        db.prepare(`
          UPDATE drugs 
          SET id = ?, name = ?, category = ?, description = ?, imageUrl = ?, type = ?, fields = ?, formulas = ?, sort_order = ?
          WHERE id = ?
        `).run(newId, name, category, description, imageUrl, type, JSON.stringify(fields), JSON.stringify(formulas), sort_order || 0, oldId);
      } else {
        db.prepare(`
          UPDATE drugs 
          SET name = ?, category = ?, description = ?, imageUrl = ?, type = ?, fields = ?, formulas = ?, sort_order = ?
          WHERE id = ?
        `).run(name, category, description, imageUrl, type, JSON.stringify(fields), JSON.stringify(formulas), sort_order || 0, oldId);
      }
    })();
    res.json({ message: "Drug updated" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/drugs/reorder", (req, res) => {
  const { orders } = req.body; // Array of { id, sort_order }
  try {
    const stmt = db.prepare("UPDATE drugs SET sort_order = ? WHERE id = ?");
    const updateMany = db.transaction((items) => {
      for (const item of items) stmt.run(item.sort_order, item.id);
    });
    updateMany(orders);
    res.json({ message: "Reordered successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/drugs/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM drugs WHERE id = ?").run(id);
  res.json({ message: "Drug deleted" });
});

// Seed initial data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM drugs").get() as { count: number };
if (count.count === 0) {
  const initialDrugs = [
  {
    "id": "006",
    "name": "Adriamycin ",
    "category": "Doxorubicin(50mg/25mL)",
    "description": "",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Doxorubicin dose in mgs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg"
      },
      {
        "label": "Doxorubicin dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.5",
        "unit": "mL"
      },
      {
        "label": "Maximum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.2)",
        "unit": "mL"
      },
      {
        "label": "Minimum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/1)",
        "unit": "mL"
      },
      {
        "label": "Zofran max. dose in mLs",
        "formula": "(weight*0.3)*0.5",
        "unit": "mL"
      },
      {
        "label": "Zofran min. dose in mLs",
        "formula": "(weight*0.15)*0.5",
        "unit": ""
      }
    ],
    "sort_order": 0
  },
  {
    "id": "007",
    "name": "Ara-C",
    "category": "Cytarabine (1000mg/10mL)",
    "description": "",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Cytarabine dose in mgs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg"
      },
      {
        "label": "Cytarabine dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.01",
        "unit": "mL"
      },
      {
        "label": "Maximum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.1)",
        "unit": ""
      },
      {
        "label": "Minimum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.2)",
        "unit": ""
      },
      {
        "label": "Zofran max. dose in mLs",
        "formula": "(weight*0.3)*0.5",
        "unit": "mL"
      },
      {
        "label": "Zofran min. dose in mLs",
        "formula": "(weight*0.15)*0.5",
        "unit": "mL"
      }
    ],
    "sort_order": 1
  },
  {
    "id": "001",
    "name": "Cytoxan",
    "category": "Cyclophosphamide (1gm/50mL)",
    "description": "vmlsdmvl",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Cytoxan dose in mgs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg"
      },
      {
        "label": "Cytoxan dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.05",
        "unit": "mL"
      },
      {
        "label": "Maximum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/2)",
        "unit": "mL"
      },
      {
        "label": "Minimum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/5)",
        "unit": "mL"
      },
      {
        "label": "Mesna total dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)/100",
        "unit": "mL"
      },
      {
        "label": "Mesna/ 2 dose ",
        "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/2",
        "unit": "mL"
      },
      {
        "label": "Mesna/ 3 dose ",
        "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/3",
        "unit": "mL"
      },
      {
        "label": "Mesna/ 4 dose ",
        "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/4",
        "unit": "mL"
      },
      {
        "label": "Mesna/ 5 dose ",
        "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/5",
        "unit": "mL"
      }
    ],
    "sort_order": 2
  },
  {
    "id": "002",
    "name": "Ifos",
    "category": "Ifosfamide (1gm/20mL)",
    "description": "",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Ifosfamide dose in mgs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg"
      },
      {
        "label": "Ifosfamide dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.02",
        "unit": "mL"
      },
      {
        "label": "Maximum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.6)",
        "unit": "mL"
      },
      {
        "label": "Minimum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/20)",
        "unit": "mL"
      },
      {
        "label": "Mesna total dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)/100",
        "unit": "mL"
      },
      {
        "label": "Mesna/ 2 dose ",
        "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/2",
        "unit": "mL"
      },
      {
        "label": "Mesna/ 3 dose ",
        "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/3",
        "unit": "mL"
      },
      {
        "label": "Mesna/ 4 dose ",
        "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/4",
        "unit": "mL"
      },
      {
        "label": "Mesna/ 5 dose ",
        "formula": "((((4*weight)+7)/(weight+90)*dose_m2)/100)/5",
        "unit": "mL"
      }
    ],
    "sort_order": 3
  },
  {
    "id": "005",
    "name": "L-Aspar",
    "category": "L-asparaginase E.coli (10,000 IU/2mL)",
    "description": "",
    "imageUrl": "",
    "type": "IM",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "L-asparaginase dose in  mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.0002",
        "unit": "mLs"
      }
    ],
    "sort_order": 4
  },
  {
    "id": "004",
    "name": "Oncovin ",
    "category": "Vincristine (1 mg/mL)",
    "description": "",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Vincristine dose in mgs & mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg&mLs"
      },
      {
        "label": "Zofran max. dose in mLs",
        "formula": "(weight*0.3)*0.5",
        "unit": "mL"
      },
      {
        "label": "Zofran min. dose in mLs",
        "formula": "(weight*0.15)*0.5",
        "unit": "mL"
      }
    ],
    "sort_order": 5
  },
  {
    "id": "003",
    "name": "Vepesid",
    "category": "Etoposide (100mg/5mL)",
    "description": "",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Etoposide dose in mgs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg"
      },
      {
        "label": "Etoposide dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.05",
        "unit": "mL"
      },
      {
        "label": "Maximum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.2)",
        "unit": ""
      },
      {
        "label": "Minimum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.4)",
        "unit": ""
      },
      {
        "label": "Zofran max. dose in mLs",
        "formula": "(weight*0.3)*0.5",
        "unit": "mL"
      },
      {
        "label": "Zofran min. dose in mLs",
        "formula": "(weight*0.15)*0.5",
        "unit": "mL"
      }
    ],
    "sort_order": 6
  },
  {
    "id": "009",
    "name": "Carboplat",
    "category": "Carboplatin (150mg/15mL)",
    "description": "",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Carboplatin dose in mgs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg"
      },
      {
        "label": "Carboplatin dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.1",
        "unit": "mL"
      },
      {
        "label": "Maximum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.5)",
        "unit": ""
      },
      {
        "label": "Minimum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/2)",
        "unit": ""
      },
      {
        "label": "Zofran max. dose in mLs",
        "formula": "(weight*0.3)*0.5",
        "unit": "mL"
      },
      {
        "label": "Zofran min. dose in mLs",
        "formula": "(weight*0.15)*0.5",
        "unit": "mL"
      }
    ],
    "sort_order": 7
  },
  {
    "id": "010",
    "name": "Cisplat",
    "category": "Cisplatin (50mg/50mL)",
    "description": "",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Cisplatin dose in mgs & mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg & mLs"
      },
      {
        "label": "Maximum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.5)",
        "unit": ""
      },
      {
        "label": "Minimum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/1)",
        "unit": ""
      },
      {
        "label": "Zofran max. dose in mLs",
        "formula": "(weight*0.3)*0.5",
        "unit": "mL"
      },
      {
        "label": "Zofran min. dose in mLs",
        "formula": "(weight*0.15)*0.5",
        "unit": "mL"
      },
      {
        "label": "90% Cisplatin dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.9",
        "unit": "mLs"
      },
      {
        "label": "10% Cisplatin dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.1",
        "unit": "mLs"
      }
    ],
    "sort_order": 7
  },
  {
    "id": "008",
    "name": "Fludara ",
    "category": "Fludarabine (50mg/2mL)",
    "description": "",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Fludarabine dose in mgs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg"
      },
      {
        "label": "Fludarabine dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.04",
        "unit": "mL"
      },
      {
        "label": "Maximum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.5)",
        "unit": ""
      },
      {
        "label": "Minimum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/1)",
        "unit": ""
      },
      {
        "label": "Zofran max. dose in mLs",
        "formula": "(weight*0.3)*0.5",
        "unit": "mL"
      },
      {
        "label": "Zofran min. dose in mLs",
        "formula": "(weight*0.15)*0.5",
        "unit": "mL"
      }
    ],
    "sort_order": 7
  },
  {
    "id": "011",
    "name": "Irinotecan ",
    "category": "Irinotecan (40mg/2mL)",
    "description": "",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Irinotecan dose in mgs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg"
      },
      {
        "label": "Irinotecan dose in mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)*0.05",
        "unit": "mL"
      },
      {
        "label": "Maximum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.12)",
        "unit": ""
      },
      {
        "label": "Minimum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/2.8)",
        "unit": ""
      },
      {
        "label": "Zofran max. dose in mLs",
        "formula": "(weight*0.3)*0.5",
        "unit": "mL"
      },
      {
        "label": "Zofran min. dose in mLs",
        "formula": "(weight*0.15)*0.5",
        "unit": "mL"
      }
    ],
    "sort_order": 7
  },
  {
    "id": "012",
    "name": "Topotecan",
    "category": "Topotecan (4mg/4mL)",
    "description": "",
    "imageUrl": "",
    "type": "IV",
    "fields": [
      {
        "id": "weight",
        "label": "Weight",
        "unit": "kg",
        "defaultValue": 0
      },
      {
        "id": "dose_m2",
        "label": "Dose",
        "unit": "mg/m2",
        "defaultValue": 0
      },
      {
        "id": "dose_adj",
        "label": "Dose adustment",
        "unit": "max. 1",
        "defaultValue": 1
      }
    ],
    "formulas": [
      {
        "label": "BSA",
        "formula": "((4*weight)+7)/(weight+90)",
        "unit": "m2"
      },
      {
        "label": "Topotecan dose in mgs & mLs",
        "formula": "(((4*weight)+7)/(weight+90)*dose_m2)",
        "unit": "mg & mLs"
      },
      {
        "label": "Maximum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.025)",
        "unit": ""
      },
      {
        "label": "Minimum dilution",
        "formula": "ceil((((4*weight)+7)/(weight+90)*dose_m2)/0.5)",
        "unit": ""
      },
      {
        "label": "Zofran max. dose in mLs",
        "formula": "(weight*0.3)*0.5",
        "unit": "mL"
      },
      {
        "label": "Zofran min. dose in mLs",
        "formula": "(weight*0.15)*0.5",
        "unit": "mL"
      }
    ],
    "sort_order": 7
  }
];

  const insert = db.prepare(`
    INSERT INTO drugs (id, name, category, description, imageUrl, type, fields, formulas, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (let i = 0; i < initialDrugs.length; i++) {
    const drug = initialDrugs[i];
    const sortOrder = (drug as any).sort_order !== undefined ? (drug as any).sort_order : i;
    insert.run(drug.id, drug.name, drug.category, drug.description, drug.imageUrl, drug.type, JSON.stringify(drug.fields), JSON.stringify(drug.formulas), sortOrder);
  }
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
