import cors from 'cors';
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { taskRouter } from './routes/taskRoutes';

export function createApp(clientOrigin = 'http://localhost:5173') {
  const app = express();

  app.use(cors({ origin: clientOrigin }));
  app.use(express.json({ limit: '10kb' }));

  app.use('/tasks', taskRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
