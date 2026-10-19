try { process.loadEnvFile?.('.env'); } catch {}
import app, { connectDB } from './app.js';

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
  connectDB().catch(err => {
    console.error('Initial MongoDB connection error:', err.message);
  });
});
