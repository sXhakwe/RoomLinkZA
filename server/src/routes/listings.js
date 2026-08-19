import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware.js';
import { pagination } from '../utils.js';
const router=Router(); router.use(requireAuth);
const listingSchema=z.object({title:z.string().min(5).max(160),description:z.string().min(20).max(5000),property_type:z.string().min(2).max(50),room_type:z.string().min(2).max(50),address_line:z.string().min(3).max(180),suburb:z.string().max(100).optional().nullable(),city:z.string().min(2).max(120),province:z.string().min(2).max(80),postal_code:z.string().max(10).optional().nullable(),monthly_rent:z.coerce.number().min(0),deposit:z.coerce.number().min(0).default(0),available_from:z.string(),bedrooms:z.coerce.number().int().min(1).default(1),bathrooms:z.coerce.number().min(.5).default(1),furnished:z.boolean().default(false),utilities_included:z.boolean().default(false),amenities:z.array(z.string()).default([]),image_urls:z.array(z.string().url()).max(10).default([]),house_rules:z.string().max(2000).default(''),status:z.enum(['available','pending','occupied','unavailable','removed']).default('available')});
const columns=Object.keys(listingSchema.shape);
router.get('/',async(req,res,next)=>{try{
 const {page,limit,offset}=pagination(req.query), where=["l.status='available'","l.is_approved=true"],vals=[];
 const add=(sql,val)=>{vals.push(val);where.push(sql.replace('?',`$${vals.length}`));};
 if(req.query.q){vals.push(req.query.q);where.push(`(l.title ILIKE '%'||$${vals.length}||'%' OR l.description ILIKE '%'||$${vals.length}||'%' OR l.suburb ILIKE '%'||$${vals.length}||'%')`);}
 if(req.query.city)add('lower(l.city)=lower(?)',req.query.city); if(req.query.province)add('lower(l.province)=lower(?)',req.query.province);
 if(req.query.minRent)add('l.monthly_rent>=?',req.query.minRent); if(req.query.maxRent)add('l.monthly_rent<=?',req.query.maxRent);
 if(req.query.furnished==='true')where.push('l.furnished=true'); if(req.query.availableFrom)add('l.available_from<=?',req.query.availableFrom);
 vals.push(limit,offset); const {rows}=await query(`SELECT l.*,u.first_name||' '||u.last_name owner_name,u.avatar_url owner_avatar,EXISTS(SELECT 1 FROM saved_listings s WHERE s.listing_id=l.id AND s.user_id=$${vals.length+1}) saved FROM listings l JOIN users u ON u.id=l.owner_id WHERE ${where.join(' AND ')} ORDER BY l.created_at DESC LIMIT $${vals.length-1} OFFSET $${vals.length}`,[...vals,req.user.id]);
 res.json({items:rows,page,limit});
}catch(e){next(e);}});
router.get('/saved',async(req,res,next)=>{try{const {rows}=await query('SELECT l.*,true saved FROM saved_listings s JOIN listings l ON l.id=s.listing_id WHERE s.user_id=$1 ORDER BY s.created_at DESC',[req.user.id]);res.json(rows);}catch(e){next(e);}});
router.get('/mine',async(req,res,next)=>{try{const {rows}=await query('SELECT * FROM listings WHERE owner_id=$1 ORDER BY created_at DESC',[req.user.id]);res.json(rows);}catch(e){next(e);}});
router.get('/:id',async(req,res,next)=>{try{const {rows}=await query(`SELECT l.*,u.first_name||' '||u.last_name owner_name,u.avatar_url owner_avatar,u.bio owner_bio,EXISTS(SELECT 1 FROM saved_listings s WHERE s.listing_id=l.id AND s.user_id=$2) saved FROM listings l JOIN users u ON u.id=l.owner_id WHERE l.id=$1`,[req.params.id,req.user.id]);if(!rows[0])return res.status(404).json({error:'Listing not found'});res.json(rows[0]);}catch(e){next(e);}});
router.post('/',async(req,res,next)=>{try{const d=listingSchema.parse(req.body),vals=columns.map(k=>d[k]);const slots=columns.map((_,i)=>`$${i+2}`).join(',');const {rows}=await query(`INSERT INTO listings(owner_id,${columns.join(',')}) VALUES($1,${slots}) RETURNING *`,[req.user.id,...vals]);res.status(201).json(rows[0]);}catch(e){next(e);}});
router.put('/:id',async(req,res,next)=>{try{const d=listingSchema.parse(req.body),vals=columns.map(k=>d[k]),sets=columns.map((k,i)=>`${k}=$${i+1}`).join(',');vals.push(req.params.id,req.user.id);const {rows}=await query(`UPDATE listings SET ${sets},updated_at=now() WHERE id=$${vals.length-1} AND owner_id=$${vals.length} RETURNING *`,vals);if(!rows[0])return res.status(404).json({error:'Listing not found or not yours'});res.json(rows[0]);}catch(e){next(e);}});
router.delete('/:id',async(req,res,next)=>{try{const r=await query('DELETE FROM listings WHERE id=$1 AND owner_id=$2',[req.params.id,req.user.id]);if(!r.rowCount)return res.status(404).json({error:'Listing not found or not yours'});res.status(204).end();}catch(e){next(e);}});
router.post('/:id/save',async(req,res,next)=>{try{await query('INSERT INTO saved_listings(user_id,listing_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.user.id,req.params.id]);res.status(204).end();}catch(e){next(e);}});
router.delete('/:id/save',async(req,res,next)=>{try{await query('DELETE FROM saved_listings WHERE user_id=$1 AND listing_id=$2',[req.user.id,req.params.id]);res.status(204).end();}catch(e){next(e);}});
export default router;
