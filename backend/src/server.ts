import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.js';
import { HttpError } from './utils/HttpError.js';

import authRoutes from './modules/auth/auth.routes.js';
import coachesRoutes from './modules/coaches/coaches.routes.js';
import availabilitiesRoutes from './modules/availabilities/availabilities.routes.js';
import bookingsRoutes from './modules/bookings/bookings.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'valorank-api', ts: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/coaches', coachesRoutes);
app.use('/availabilities', availabilitiesRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/messages', messagesRoutes);
app.use('/admin', adminRoutes);

app.use((_req, _res, next) => next(HttpError.notFound('Route inexistante')));
app.use(errorHandler);

const port = env.PORT;
app.listen(port, () => {
  console.log(`🚀 Valorank API ready on http://localhost:${port}`);
});

export default app;
