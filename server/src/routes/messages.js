import {Router} from 'express';
import {z} from 'zod';
import {query,pool} from '../db/pool.js';
import {requireAuth} from '../middleware.js';

const router=Router();
router.use(requireAuth);

router.get('/unread-count',async(req,res,next)=>{try{
 const {rows}=await query('SELECT count(*)::int count FROM messages m JOIN conversation_members cm ON cm.conversation_id=m.conversation_id AND cm.user_id=$1 WHERE m.sender_id<>$1 AND m.read_at IS NULL',[req.user.id]);
 res.json({count:rows[0].count});
}catch(e){next(e);}});

router.get('/conversations',async(req,res,next)=>{try{
 const {rows}=await query(`SELECT c.id,c.updated_at,
   jsonb_agg(DISTINCT jsonb_build_object('id',u.id,'name',u.first_name||' '||u.last_name,'avatar_url',u.avatar_url)) FILTER(WHERE u.id<>$1) members,
   last.body last_message,last.created_at last_message_at,last.sender_id last_sender_id,
   count(DISTINCT unread.id)::int unread_count
  FROM conversations c
  JOIN conversation_members mine ON mine.conversation_id=c.id AND mine.user_id=$1
  JOIN conversation_members cm ON cm.conversation_id=c.id
  JOIN users u ON u.id=cm.user_id
  LEFT JOIN LATERAL (SELECT body,created_at,sender_id FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) last ON true
  LEFT JOIN messages unread ON unread.conversation_id=c.id AND unread.sender_id<>$1 AND unread.read_at IS NULL
  GROUP BY c.id,last.body,last.created_at,last.sender_id
  ORDER BY COALESCE(last.created_at,c.updated_at) DESC`,[req.user.id]);
 res.json(rows);
}catch(e){next(e);}});

router.post('/conversations',async(req,res,next)=>{const client=await pool.connect();try{
 const {user_id}=z.object({user_id:z.string().uuid()}).parse(req.body);
 if(user_id===req.user.id)return res.status(400).json({error:'You cannot message yourself'});
 const target=await client.query(`SELECT id FROM users WHERE id=$1 AND status='active'`,[user_id]);
 if(!target.rowCount)return res.status(404).json({error:'This member is unavailable'});
 const blocked=await client.query('SELECT 1 FROM blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)',[req.user.id,user_id]);
 if(blocked.rowCount)return res.status(403).json({error:'Messaging is unavailable between these users'});
 const existing=await client.query(`SELECT cm.conversation_id FROM conversation_members cm JOIN conversation_members other ON other.conversation_id=cm.conversation_id AND other.user_id=$2 WHERE cm.user_id=$1 AND (SELECT count(*) FROM conversation_members x WHERE x.conversation_id=cm.conversation_id)=2 LIMIT 1`,[req.user.id,user_id]);
 if(existing.rows[0])return res.json({id:existing.rows[0].conversation_id});
 await client.query('BEGIN');const c=await client.query('INSERT INTO conversations DEFAULT VALUES RETURNING id');await client.query('INSERT INTO conversation_members(conversation_id,user_id) VALUES($1,$2),($1,$3)',[c.rows[0].id,req.user.id,user_id]);await client.query('COMMIT');res.status(201).json(c.rows[0]);
}catch(e){await client.query('ROLLBACK');next(e);}finally{client.release();}});

router.get('/conversations/:id/messages',async(req,res,next)=>{try{
 const member=await query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2',[req.params.id,req.user.id]);
 if(!member.rowCount)return res.status(403).json({error:'Not a conversation member'});
 await query('UPDATE messages SET read_at=now() WHERE conversation_id=$1 AND sender_id<>$2 AND read_at IS NULL',[req.params.id,req.user.id]);
 const {rows}=await query(`SELECT m.id,m.conversation_id,m.sender_id,m.body,m.read_at,m.created_at,u.first_name||' '||u.last_name sender_name,u.avatar_url sender_avatar,COALESCE((SELECT json_agg(json_build_object('reaction',mr.reaction,'user_id',mr.user_id)) FROM message_reactions mr WHERE mr.message_id=m.id),'[]') reactions FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.conversation_id=$1 ORDER BY m.created_at,m.id`,[req.params.id]);
 res.json(rows);
}catch(e){next(e);}});

router.post('/conversations/:id/messages',async(req,res,next)=>{try{
 const {body}=z.object({body:z.string().trim().min(1).max(4000)}).parse(req.body);
 const allowed=await query(`SELECT 1 FROM conversation_members mine WHERE mine.conversation_id=$1 AND mine.user_id=$2 AND NOT EXISTS(SELECT 1 FROM conversation_members other JOIN blocks b ON (b.blocker_id=$2 AND b.blocked_id=other.user_id) OR (b.blocker_id=other.user_id AND b.blocked_id=$2) WHERE other.conversation_id=$1)`,[req.params.id,req.user.id]);
 if(!allowed.rowCount)return res.status(403).json({error:'Message cannot be sent'});
 const {rows}=await query(`INSERT INTO messages(conversation_id,sender_id,body) VALUES($1,$2,$3) RETURNING id,conversation_id,sender_id,body,read_at,created_at`,[req.params.id,req.user.id,body]);
 await query('UPDATE conversations SET updated_at=now() WHERE id=$1',[req.params.id]);
 const senderName=`${req.user.first_name} ${req.user.last_name}`;
 await query(`INSERT INTO notifications(user_id,type,title,body,link) SELECT user_id,'message',$2,$3,'/messages/'||$1 FROM conversation_members WHERE conversation_id=$1 AND user_id<>$4`,[req.params.id,`New message from ${senderName}`,body.slice(0,120),req.user.id]);
 res.status(201).json({...rows[0],sender_name:senderName,sender_avatar:req.user.avatar_url});
}catch(e){next(e);}});
router.put('/messages/:id/reactions',async(req,res,next)=>{try{const reaction=z.enum(['👍','❤️','😂','🎉']).parse(req.body.reaction);const allowed=await query(`SELECT 1 FROM messages m JOIN conversation_members cm ON cm.conversation_id=m.conversation_id WHERE m.id=$1 AND cm.user_id=$2`,[req.params.id,req.user.id]);if(!allowed.rowCount)return res.status(404).json({error:'Message not found'});const old=await query('SELECT 1 FROM message_reactions WHERE message_id=$1 AND user_id=$2 AND reaction=$3',[req.params.id,req.user.id,reaction]);if(old.rowCount)await query('DELETE FROM message_reactions WHERE message_id=$1 AND user_id=$2 AND reaction=$3',[req.params.id,req.user.id,reaction]);else await query('INSERT INTO message_reactions(message_id,user_id,reaction) VALUES($1,$2,$3)',[req.params.id,req.user.id,reaction]);res.status(204).end()}catch(e){next(e)}});

export default router;
