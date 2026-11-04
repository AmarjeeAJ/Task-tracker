import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

const port = Number(process.env.PORT ?? 5000);
const mongoUri = process.env.MONGODB_URI;

async function start(): Promise<void> {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set. Copy server/.env.example to server/.env.');
  }

  await connectDatabase(mongoUri);

  const server = createApp(process.env.CLIENT_ORIGIN).listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });

  const shutdown = () => {
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
