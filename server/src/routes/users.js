import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware.js';
import { matchScore, publicUser } from '../utils.js';
const router=Router(); router.use(requireAuth);
const profileFields=['first_name','last_name','phone','avatar_url','bio','city','province','occupation','date_of_birth','gender'];
router.get('/me/profile',async(req,res,next)=>{try{
 const {rows}=await query('SELECT u.*,row_to_json(p) preferences FROM users u LEFT JOIN roommate_preferences p ON p.user_id=u.id WHERE u.id=$1',[req.user.id]); res.json(publicUser(rows[0]));
}catch(e){next(e);}});
router.patch('/me/profile',async(req,res,next)=>{try{
 const body=z.record(z.any()).parse(req.body); const keys=profileFields.filter(k=>Object.hasOwn(body,k));
 if(!keys.length)return res.status(400).json({error:'No supported profile fields supplied'});
 const values=keys.map(k=>body[k]); const sets=keys.map((k,i)=>`${k}=$${i+1}`).join(','); values.push(req.user.id);
 const {rows}=await query(`UPDATE users SET ${sets},updated_at=now() WHERE id=$${values.length} RETURNING *`,values); res.json(publicUser(rows[0]));
}catch(e){next(e);}});
router.put('/me/preferences',async(req,res,next)=>{try{
 const d=z.object({budget_min:z.coerce.number().min(0).optional(),budget_max:z.coerce.number().min(0).optional(),preferred_city:z.string().max(120).optional(),preferred_province:z.string().max(80).optional(),move_in_date:z.string().optional(),cleanliness:z.number().int().min(1).max(5).optional(),social_level:z.number().int().min(1).max(5).optional(),sleep_schedule:z.string().max(40).optional(),smoking_ok:z.boolean().optional(),pets_ok:z.boolean().optional(),preferred_gender:z.string().max(40).optional(),interests:z.array(z.string().max(50)).max(20).optional()}).parse(req.body);
 const keys=Object.keys(d), vals=keys.map(k=>d[k]); const cols=keys.join(','), args=keys.map((_,i)=>`$${i+2}`).join(','), updates=keys.map(k=>`${k}=EXCLUDED.${k}`).join(',');
 const {rows}=await query(`INSERT INTO roommate_preferences(user_id${cols?','+cols:''}) VALUES($1${args?','+args:''}) ON CONFLICT(user_id) DO UPDATE SET ${updates}${updates?',':''}updated_at=now() RETURNING *`,[req.user.id,...vals]); res.json(rows[0]);
}catch(e){next(e);}});
router.get('/matches',async(req,res,next)=>{try{
 const mine=(await query('SELECT * FROM roommate_preferences WHERE user_id=$1',[req.user.id])).rows[0]||{};
 const {rows}=await query(`SELECT u.*,row_to_json(p) preferences FROM users u LEFT JOIN roommate_preferences p ON p.user_id=u.id WHERE u.id<>$1 AND u.status='active' AND NOT EXISTS(SELECT 1 FROM blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=u.id) OR (b.blocker_id=u.id AND b.blocked_id=$1)) LIMIT 100`,[req.user.id]);
 res.json(rows.map(u=>({...publicUser(u),match_score:matchScore({...req.user,preferences:mine},u)})).sort((a,b)=>b.match_score-a.match_score));
}catch(e){next(e);}});
router.post('/:id/block',async(req,res,next)=>{try{await query('INSERT INTO blocks(blocker_id,blocked_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.user.id,req.params.id]);res.status(204).end();}catch(e){next(e);}});
router.delete('/:id/block',async(req,res,next)=>{try{await query('DELETE FROM blocks WHERE blocker_id=$1 AND blocked_id=$2',[req.user.id,req.params.id]);res.status(204).end();}catch(e){next(e);}});
export default router;
