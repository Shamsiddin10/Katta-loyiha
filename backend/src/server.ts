// ============================================
// EduSys - Express Server
// ============================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { prisma } from './config/database';

// Routes
import authRoutes from './routes/authRoutes';
import directorRoutes from './routes/directorRoutes';

const app = express();

// ---- Xavfsizlik Middleware ----
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Rate Limiting ----
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { success: false, message: 'Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.' },
});

const loginLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.LOGIN_RATE_LIMIT_MAX,
  message: { success: false, message: 'Juda ko\'p login urinish. 15 daqiqadan keyin urinib ko\'ring.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/director', directorRoutes);

// ---- Health Check ----
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'EduSys API ishlayapti! 🚀',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint topilmadi',
  });
});

// ---- Error Handler ----
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server xatosi:', err);
  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'development' ? err.message : 'Server xatosi',
  });
});

// ---- Server ishga tushirish ----
const startServer = async () => {
  try {
    // Database ulanishni tekshirish
    await prisma.$connect();
    console.log('✅ Ma\'lumotlar bazasiga ulanildi');

    app.listen(env.PORT, () => {
      console.log(`🚀 EduSys API ishga tushdi: http://localhost:${env.PORT}`);
      console.log(`📊 Muhit: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Serverni ishga tushirishda xatolik:', error);
    process.exit(1);
  }
};

startServer();

export default app;
