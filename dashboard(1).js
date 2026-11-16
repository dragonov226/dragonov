const cfg=window.DRAGONOV_CONFIG||{};
const db=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
let currentUser=null,currentAdmin=null,items=[];
const $=id=>document.getElementById(id), msg=(id,s)=>$(id).textContent=s;
async function guard(){
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user){location.replace("login.html");return false;}
 const {data:admin,error:e}=await db.from("admin_members").select("role,active").eq("user_id",user.id).maybeSingle();
 if(e||!admin||!admin.active){await db.auth.signOut();location.replace("login.html");return false;}
 currentUser=user;currentAdmin=admin;$("admin-body").classList.remove("hidden");$("whoami").textContent=user.email;$("role").textContent=admin.role;return true;
}
async function refresh(){
 const {data,error}=await db.from("content_items").select("*").order("created_at",{ascending:false});
 if(error){msg("content-message","Could not load content: "+error.message);return;}
 items=data||[];$("published-count").textContent=items.filter(x=>x.published).length;$("draft-count").textContent=items.filter(x=>!x.published).length;
 $("content-rows").innerHTML=items.map(x=>`<tr><td>${escapeHtml(x.title)}</td><td>${x.kind}</td><td>${x.published?"Published":"Draft"}</td><td><button class="small-btn" data-edit="${x.id}">Edit</button> <button class="small-btn danger" data-delete="${x.id}">Delete</button></td></tr>`).join("");
 $("content-rows").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editItem(b.dataset.edit));
 $("content-rows").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteItem(b.dataset.delete));
 await loadMembers();
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function editItem(id){const x=items.find(i=>i.id===id);if(!x)return;$("item-id").value=x.id;$("kind").value=x.kind;$("category").value=x.category||"";$("title").value=x.title;$("description").value=x.description||"";$("event-date").value=x.event_date?new Date(x.event_date).toISOString().slice(0,16):"";$("location").value=x.location||"";$("link-url").value=x.link_url||"";$("published").checked=x.published;window.scrollTo({top:0,behavior:"smooth"});}
async function deleteItem(id){if(!confirm("Delete this item?"))return;const {error}=await db.from("content_items").delete().eq("id",id);msg("content-message",error?error.message:"Deleted.");refresh();}
$("content-form").addEventListener("submit",async e=>{e.preventDefault();const id=$("item-id").value;const payload={kind:$("kind").value,category:$("category").value.trim(),title:$("title").value.trim(),description:$("description").value.trim(),event_date:$("event-date").value?new Date($("event-date").value).toISOString():null,location:$("location").value.trim(),link_url:$("link-url").value.trim()||null,published:$("published").checked};
 const result=id?await db.from("content_items").update(payload).eq("id",id):await db.from("content_items").insert(payload);
 msg("content-message",result.error?"Save failed: "+result.error.message:"Saved successfully.");if(!result.error){$("content-form").reset();$("item-id").value="";refresh();}
});
$("reset-form").onclick=()=>{$("content-form").reset();$("item-id").value="";};
$("refresh").onclick=refresh;
$("logout").onclick=async()=>{await db.auth.signOut();location.replace("login.html");};
$("invite-form").addEventListener("submit",async e=>{e.preventDefault();msg("invite-message","Sending invitation…");const {data:{session}}=await db.auth.getSession();const {data,error}=await db.functions.invoke("invite-admin",{body:{email:$("invite-email").value.trim()},headers:{Authorization:`Bearer ${session.access_token}`}});msg("invite-message",error?"Invite failed: "+error.message:(data?.message||"Invitation sent."));if(!error)$("invite-form").reset();});
async function loadMembers(){const {data,error}=await db.from("admin_members").select("user_id,email,role,active").order("created_at");if(error){$("member-rows").innerHTML="<tr><td colspan='4'>Could not load admin list.</td></tr>";return;}
 $("member-rows").innerHTML=(data||[]).map(m=>`<tr><td>${escapeHtml(m.email||m.user_id)}</td><td>${escapeHtml(m.role)}</td><td>${m.active?"Active":"Disabled"}</td><td>${m.user_id!==currentUser.id&&currentAdmin.role==="owner"?`<button class="small-btn" data-toggle="${m.user_id}" data-active="${m.active}">${m.active?"Disable":"Enable"}</button>`:"—"}</td></tr>`).join("");
 $("member-rows").querySelectorAll("[data-toggle]").forEach(b=>b.onclick=async()=>{const {error}=await db.from("admin_members").update({active:b.dataset.active!=="true"}).eq("user_id",b.dataset.toggle);if(error)alert(error.message);loadMembers();});
}
(async()=>{if(await guard())await refresh();})();