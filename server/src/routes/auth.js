import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { config } from '../config.js';
import { publicUser } from '../utils.js';
import { requireAuth } from '../middleware.js';
const router = Router();
const registerSchema = z.object({ email:z.string().email(), password:z.string().min(8).max(72), firstName:z.string().min(2).max(80), lastName:z.string().min(2).max(80), phone:z.string().min(7).max(30), city:z.string().min(2).max(120), province:z.string().min(2).max(80), dateOfBirth:z.string().optional() });
const tokenFor = (user) => jwt.sign({ sub:user.id, role:user.role }, config.jwtSecret, { expiresIn:'7d' });
router.post('/register', async (req,res,next) => { try {
  const data=registerSchema.parse(req.body); const hash=await bcrypt.hash(data.password,12);
  const {rows}=await query('INSERT INTO users(email,password_hash,first_name,last_name,phone,city,province,date_of_birth) VALUES(lower($1),$2,$3,$4,$5,$6,$7,$8) RETURNING *',[data.email,hash,data.firstName,data.lastName,data.phone,data.city,data.province,data.dateOfBirth||null]);
  res.status(201).json({token:tokenFor(rows[0]),user:publicUser(rows[0])});
} catch(e){next(e);} });
router.post('/login', async (req,res,next) => { try {
  const data=z.object({email:z.string().email(),password:z.string().min(1)}).parse(req.body);
  const {rows}=await query('SELECT * FROM users WHERE email=lower($1)',[data.email]); const user=rows[0];
  if(!user || !await bcrypt.compare(data.password,user.password_hash)) return res.status(401).json({error:'Invalid email or password'});
  if(user.status!=='active') return res.status(403).json({error:'Account is '+user.status});
  res.json({token:tokenFor(user),user:publicUser(user)});
} catch(e){next(e);} });
router.get('/me',requireAuth,(req,res)=>res.json({user:publicUser(req.user)}));
export default router;
