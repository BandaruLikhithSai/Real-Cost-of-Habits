try { process.loadEnvFile?.('.env'); } catch {}
import app, { connectDB } from './app.js';

for (const k of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[k]) {
    console.error(`Missing env ${k}`);
    process.exit(1);
  }
}

await connectDB();
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on :${PORT}`));
