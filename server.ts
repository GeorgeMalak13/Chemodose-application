import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { DEFAULT_DRUGS } from "./src/data/defaultDrugs";

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
  const insert = db.prepare(`
    INSERT INTO drugs (id, name, category, description, imageUrl, type, fields, formulas, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (let i = 0; i < DEFAULT_DRUGS.length; i++) {
    const drug = DEFAULT_DRUGS[i] as any;
    const sortOrder = drug.sort_order !== undefined ? drug.sort_order : i;
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
