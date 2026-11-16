(function(){
 const cfg=window.DRAGONOV_CONFIG||{};
 if(!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY||cfg.SUPABASE_URL.includes("YOUR-PROJECT")) {
   document.querySelectorAll(".card-grid").forEach(x=>x.innerHTML='<p class="empty">Connect Supabase by creating assets/config.js from config.example.js.</p>');
   return;
 }
 const db=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
 document.getElementById("year").textContent=new Date().getFullYear();
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function load(type,target){
   const {data,error}=await db.from("content_items").select("id,title,description,category,event_date,location,link_url").eq("kind",type).eq("published",true).order("created_at",{ascending:false});
   const el=document.getElementById(target);
   if(error){el.innerHTML='<p class="empty">Could not load content. Check Supabase setup.</p>';return;}
   if(!data.length){el.innerHTML='<p class="empty">No published '+esc(type)+' yet. Check back soon.</p>';return;}
   el.innerHTML=data.map(x=>`<article class="item-card"><span class="tag">${esc(x.category||type)}</span><h3>${esc(x.title)}</h3><p>${esc(x.description||"")}</p>${x.event_date?`<p>📅 ${esc(new Date(x.event_date).toLocaleString())}</p>`:""}${x.location?`<p>📍 ${esc(x.location)}</p>`:""}${x.link_url?`<a class="button" href="${esc(x.link_url)}" target="_blank" rel="noopener noreferrer">${type==="quiz"?"Open quiz":"Learn more"}</a>`:""}</article>`).join("");
 }
 load("event","events-list");load("course","courses-list");load("quiz","quizzes-list");
})();