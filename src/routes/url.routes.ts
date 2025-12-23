import { Router } from 'express';
import { 
  healthHandler, 
  shortenUrlHandler, 
  redirectHandler 
} from '../controllers/url.controller';
import { rateLimiter } from '../middlewares/rateLimiter';
import { authMiddleware } from '../middlewares/auth';
import { abusePrevention } from '../middlewares/abusePrevention';

const router = Router();

// Health check
router.get('/health', healthHandler);

// Rate limited shortening (30/min per IP)
router.post(
  '/shorten',
  authMiddleware,  //  PROTECTED
  abusePrevention,                   // Block bad URLs + IP bans
  rateLimiter({ keyPrefix: 'shorten:min',  limit: 15,  windowSec: 60 }),   // 15/min
  rateLimiter({ keyPrefix: 'shorten:hour', limit: 150, windowSec: 3600 }), // 150/
  shortenUrlHandler
);

// Redirect
router.get('/:code', 
  authMiddleware,  //  PROTECTED
  abusePrevention,                   // Block bad URLs + IP bans
  rateLimiter({ keyPrefix: 'code:min',  limit: 15,  windowSec: 60 }),   // 15/min
  rateLimiter({ keyPrefix: 'code:hour', limit: 150, windowSec: 3600 }), // 150/
  redirectHandler);

export default router;
