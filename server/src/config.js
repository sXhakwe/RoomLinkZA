import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me-immediately',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production'
};

