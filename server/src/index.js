try { process.loadEnvFile?.('.env'); } catch {}
import app, { connectDB } from './app.js';

for (const k of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[k]) {
    console.error(`Missing env ${k}`);
    process.exit(1);
  }
}

await connectDB();
app.listen(4000, () => console.log('API on :4000'));
