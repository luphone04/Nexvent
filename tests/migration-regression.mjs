import assert from 'node:assert/strict'
import sharp from 'sharp'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100'
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname) || !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '')) throw new Error('Use a disposable local database and app')
const db = new PrismaClient(), ids = [], results = []
async function req(path, cookie = '', method = 'GET', body) {
 const r = await fetch(base + path, { method, headers: { ...(cookie ? {cookie} : {}), ...(body ? {'Content-Type':'application/json'} : {}) }, body: body ? JSON.stringify(body) : undefined, redirect:'manual' })
 const text = await r.text(); let data; try { data=JSON.parse(text) } catch { data=text }
 return {status:r.status,data}
}
async function login(user) {
 const csrf = await fetch(base+'/api/auth/csrf'), cookies = csrf.headers.getSetCookie().map(x=>x.split(';')[0])
 const {csrfToken}=await csrf.json()
 const r=await fetch(base+'/api/auth/callback/credentials',{method:'POST',headers:{cookie:cookies.join('; '),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({csrfToken,email:user.email,password:'RegressionPass123!',json:'true'}),redirect:'manual'})
 cookies.push(...r.headers.getSetCookie().map(x=>x.split(';')[0]))
 const cookie=cookies.join('; ')
 assert.equal((await req('/api/auth/session',cookie)).data.user.id,user.id)
 return cookie
}
async function test(name, fn) { try { await fn(); results.push({name,pass:true}); console.log('PASS '+name) } catch(e) { results.push({name,pass:false,error:e.message}); console.error('FAIL '+name+': '+e.message) } }
try {
 const password=await bcrypt.hash('RegressionPass123!',12), people=[]
 for (const role of ['ADMIN','ORGANIZER','ORGANIZER','ATTENDEE','ATTENDEE']) {
  const id='test-'+randomUUID(); ids.push(id)
  const u=await db.user.create({data:{id,email:id+'@nexvent.example',name:role,password,role,interests:[]}})
  people.push({...u,cookie:await login(u)})
 }
 const [admin,org,other,a,b]=people
 const event=await db.event.create({data:{title:'Regression fixture',eventDate:new Date(Date.now()+7*86400000),location:'Test',capacity:1,category:'WORKSHOP',organizerId:org.id}})
 await test('Draft list cannot bypass visibility',async()=>assert.equal((await req('/api/events?status=DRAFT')).status,403))
 await test('Private event QR is hidden',async()=>assert.equal((await req(`/api/events/${event.id}/qrcode?type=info`)).status,404))
 await test('Invalid pagination is a validation error',async()=>assert.equal((await req('/api/events?page=abc')).status,400))
 await test('Anonymous profile page requires login',async()=>assert.equal((await req('/profile')).status,307))
 await test('Partial event update retains fields',async()=>{assert.equal((await req(`/api/events/${event.id}`,org.cookie,'PUT',{status:'PUBLISHED'})).status,200);assert.equal((await db.event.findUnique({where:{id:event.id}})).title,event.title)})
 await test('Concurrent registrations respect capacity',async()=>{const rs=await Promise.all([a,b].map(u=>req('/api/registrations',u.cookie,'POST',{eventId:event.id})));assert(rs.every(r=>r.status===200),JSON.stringify(rs));assert.deepEqual(rs.map(r=>r.data.data.status).sort(),['REGISTERED','WAITLISTED'])})
 const registrations=await db.registration.findMany({where:{eventId:event.id}}), reg=registrations.find(r=>r.status==='REGISTERED'), waiter=registrations.find(r=>r.status==='WAITLISTED'), attendee=people.find(u=>u.id===reg.attendeeId)
 await test('Attendee can edit own notes',async()=>{const r=await req(`/api/registrations/${reg.id}`,attendee.cookie,'PUT',{notes:'Accessibility note'});assert.equal(r.status,200);assert.equal(r.data.data.specialRequirements,'Accessibility note')})
 await test('Attendee cannot change ticket status',async()=>assert.equal((await req(`/api/registrations/${reg.id}`,attendee.cookie,'PUT',{status:'ATTENDED'})).status,403))
 await test('Organizer cannot promote own ticket at another event',async()=>{const r=await req('/api/registrations',other.cookie,'POST',{eventId:event.id});assert.equal((await req(`/api/registrations/${r.data.data.id}`,other.cookie,'PUT',{status:'ATTENDED'})).status,403)})
 await test('Register server page loads event',async()=>{const r=await req(`/events/${event.id}/register`,a.cookie);assert.equal(r.status,200);assert(!r.data.includes('Event Not Found'))})
 await test('Organizer check-in page loads event',async()=>{const r=await req(`/events/${event.id}/check-in`,org.cookie);assert.equal(r.status,200);assert(!r.data.includes('Event not found or'))})
 await test('Cancellation promotes waitlist',async()=>{assert.equal((await req(`/api/registrations/${reg.id}`,attendee.cookie,'DELETE')).status,200);assert.equal((await db.registration.findUnique({where:{id:waiter.id}})).status,'REGISTERED')})
 await db.event.update({where:{id:event.id},data:{eventDate:new Date(Date.now()+3600000)}})
 const qrData=JSON.stringify({registrationId:waiter.id,checkInCode:waiter.checkInCode})
 await test('QR cannot check in to wrong event',async()=>assert.equal((await req('/api/registrations/check-in',org.cookie,'POST',{qrData,eventId:'wrong'})).status,400))
 await test('Valid QR check-in records attendance',async()=>{const r=await req('/api/registrations/check-in',org.cookie,'POST',{qrData,eventId:event.id});assert.equal(r.status,200);assert.equal(r.data.data.status,'ATTENDED')})
 await test('Manual check-in stores attendance time',async()=>{assert.equal((await req(`/api/events/${event.id}/checkin`,org.cookie,'POST',{code:waiter.checkInCode})).status,200);assert((await db.registration.findUnique({where:{id:waiter.id}})).checkInTime)})
 await db.event.update({where:{id:event.id},data:{status:'CANCELLED'}})
 await test('Cancelled event rejects check-in',async()=>assert.equal((await req('/api/registrations/check-in',org.cookie,'POST',{qrData,eventId:event.id})).status,400))
 await test('Private profiles are not searchable',async()=>{await db.user.update({where:{id:a.id},data:{privacy:{allowSearch:false}}});const r=await req('/api/attendees?search='+a.name+'&limit=100');assert(!r.data.data.some(u=>u.id===a.id))})
 await test('Public profile excludes ticket history',async()=>assert.equal((await req('/api/attendees/'+b.id)).data.data.registrations,undefined))
 await test('Avatar persists as a re-encoded image',async()=>{
  const original=await sharp({create:{width:12,height:12,channels:3,background:'#2457cc'}}).png().toBuffer()
  const body=new FormData();body.append('avatar',new Blob([original],{type:'image/png'}),'avatar.png')
  const response=await fetch(base+`/api/attendees/${a.id}/avatar`,{method:'POST',headers:{cookie:a.cookie},body})
  assert.equal(response.status,200)
  const saved=await db.user.findUnique({where:{id:a.id}})
  assert(saved.avatarUrl.startsWith('data:image/webp;base64,'))
 })
 await test('Invalid image bytes are rejected',async()=>{
  const body=new FormData();body.append('avatar',new Blob(['not an image'],{type:'image/png'}),'avatar.png')
  assert.equal((await fetch(base+`/api/attendees/${a.id}/avatar`,{method:'POST',headers:{cookie:a.cookie},body})).status,400)
 })
 await test('Bulk registrations respect capacity',async()=>{
  const e=await db.event.create({data:{title:'Bulk fixture',eventDate:new Date(Date.now()+7*86400000),location:'Test',capacity:1,category:'WORKSHOP',organizerId:org.id,status:'PUBLISHED'}})
  const r=await req(`/api/events/${e.id}/registrations`,org.cookie,'POST',{eventId:e.id,userIds:[a.id,b.id]})
  assert.equal(r.status,200);assert.equal(r.data.data.registered,1);assert.equal(r.data.data.waitlisted,1)
 })
 await test('Batch promotion cannot exceed event capacity',async()=>{
  const e=await db.event.create({data:{title:'Promotion fixture',eventDate:new Date(Date.now()+7*86400000),location:'Test',capacity:1,category:'WORKSHOP',organizerId:org.id,status:'PUBLISHED'}})
  const regs=await Promise.all([a,b].map((u,i)=>db.registration.create({data:{eventId:e.id,attendeeId:u.id,status:'WAITLISTED',waitlistPosition:i+1}})))
  const r=await req('/api/admin/batch',admin.cookie,'POST',{type:'registrations',action:'promote',registrationIds:regs.map(r=>r.id)})
  assert.notEqual(r.status,200);assert.equal(await db.registration.count({where:{eventId:e.id,status:'REGISTERED'}}),0)
 })
 await test('Admin cannot demote themselves',async()=>assert.equal((await req(`/api/admin/users/${admin.id}/role`,admin.cookie,'PUT',{role:'ATTENDEE'})).status,400))
 await test('Demotion revokes existing admin session',async()=>{await db.user.update({where:{id:admin.id},data:{role:'ATTENDEE'}});assert.equal((await req('/api/admin/users',admin.cookie)).status,403)})
} catch(e) { console.error(e);process.exitCode=1 }
finally {
 await db.user.deleteMany({where:{id:{in:ids}}});await db.$disconnect()
 writeFileSync('/private/tmp/nexvent-migration-results.json',JSON.stringify(results,null,2))
 if(results.some(r=>!r.pass))process.exitCode=1
 console.log(`${results.filter(r=>r.pass).length}/${results.length} checks passed`)
}
