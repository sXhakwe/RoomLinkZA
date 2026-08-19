import { Router } from 'express'; import { z } from 'zod'; import { query } from '../db/pool.js'; import { requireAuth } from '../middleware.js';
const router=Router();router.use(requireAuth);
router.get('/notifications',async(req,res,next)=>{try{const {rows}=await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[req.user.id]);res.json(rows);}catch(e){next(e);}});
router.patch('/notifications/:id/read',async(req,res,next)=>{try{await query('UPDATE notifications SET read_at=now() WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.status(204).end();}catch(e){next(e);}});
router.post('/reports',async(req,res,next)=>{try{const d=z.object({target_type:z.enum(['user','listing','post','comment','message']),target_id:z.string().uuid(),reason:z.string().min(3).max(100),details:z.string().max(2000).default('')}).parse(req.body);const {rows}=await query('INSERT INTO reports(reporter_id,target_type,target_id,reason,details) VALUES($1,$2,$3,$4,$5) RETURNING *',[req.user.id,d.target_type,d.target_id,d.reason,d.details]);res.status(201).json(rows[0]);}catch(e){next(e);}});
export default router;

