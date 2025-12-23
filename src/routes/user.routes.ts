import { Router } from 'express';
import { register, login } from '../services/user.service';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🚀 email, password  `);
    const user = await register(email, password);
    res.status(201).json({ user: { id: user.id, email: user.email } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

export default router;
