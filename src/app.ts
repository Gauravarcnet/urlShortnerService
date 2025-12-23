import express from 'express';
import urlRoutes from './routes/url.routes';
import userRoutes from './routes/user.routes';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/auth', userRoutes);  // /auth/register, /auth/login
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} ${req.ip}`);
  next();
});

// Routes
app.use('/', urlRoutes);

export default app;
