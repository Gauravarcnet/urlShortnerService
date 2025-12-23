import { AppDataSource } from '../lib/typeorm';
import { User } from '../entities/User';
import { hashPassword, verifyPassword } from '../middlewares/auth';
import jwt from 'jsonwebtoken';

const userRepo = AppDataSource.getRepository(User);
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export async function register(email: string, password: string) {
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) throw new Error('User exists');

  const user = new User();
  user.email = email;
  user.passwordHash = await hashPassword(password);
  return await userRepo.save(user);
}

export async function login(email: string, password: string) {
  const user = await userRepo.findOne({ where: { email } });
  if (!user || !await verifyPassword(password, user.passwordHash)) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token, user: { id: user.id, email: user.email } };
}
