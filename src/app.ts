import cors from 'cors';
import express from 'express';

import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import apiRoutes from './routes';
import { sendSuccess } from './utils/response';

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin is not allowed by CORS'));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  return sendSuccess(res, {
    message: 'CoreHR backend API is running',
    data: {
      status: 'ok',
    },
  });
});

app.use('/api', apiRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
