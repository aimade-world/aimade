// Public download gateway. No signing URLs: every new request re-checks moderation.
// Deploy with verify_jwt=false. This function is intentionally anonymous/read-only.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'https://aimade.world','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'GET, OPTIONS'};
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='GET')return new Response('Method not allowed',{status:405,headers});
 const id=new URL(req.url).searchParams.get('id');
 if(!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return new Response('Not found',{status:404,headers});
 try{
  const base=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db=createClient(base,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.rpc('claim_apk_download',{p_id:id});
  if(error)return new Response('Download unavailable or pilot limit reached',{status:503,headers});
  const p=data?.[0];if(!p)return new Response('Not available',{status:404,headers});
  if(p.size_bytes<4||p.size_bytes>26214400||!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.apk$/i.test(p.object_path))throw Error('Invalid object');
  const file=await fetch(base+'/storage/v1/object/authenticated/apk-quarantine/'+p.object_path,{headers:{Authorization:'Bearer '+key,apikey:key},signal:AbortSignal.timeout(20000)});
  if(!file.ok||Number(file.headers.get('content-length'))!==p.size_bytes){await file.body?.cancel();throw Error('File unavailable')}
  // Streaming prevents whole APKs filling the function memory. Never execute uploaded code.
  return new Response(file.body,{headers:{...headers,'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="aimade-${id}.apk"`,'Content-Length':String(p.size_bytes),'Content-Security-Policy':"default-src 'none'; sandbox"}});
 }catch{return new Response('Download temporarily unavailable',{status:503,headers})}
});
