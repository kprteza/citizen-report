import { createApp } from "./app.js";
import { openDatabase } from "./db.js";
import { seedIfEmpty } from "./seed.js";

const PORT = Number(process.env.PORT ?? 3001);
const DB_FILE = process.env.DB_FILE ?? "data/citizen-report.db";

const db = openDatabase(DB_FILE);
seedIfEmpty(db);

const app = createApp(db);

app.listen(PORT, () => {
  console.log(`[citizen-report] API listening on http://localhost:${PORT}`);
  console.log(`[citizen-report] Using database: ${DB_FILE}`);
});
