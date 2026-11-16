const cfg=window.DRAGONOV_CONFIG||{};
const db=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
const form=document.getElementById("login-form"),msg=document.getElementById("message");
form.addEventListener("submit",async e=>{
 e.preventDefault();msg.classList.remove("hidden");msg.textContent="Signing in…";
 const {error}=await db.auth.signInWithPassword({email:document.getElementById("email").value.trim(),password:document.getElementById("password").value});
 if(error){msg.textContent="Login failed: "+error.message;return;}
 const {data:{user}}=await db.auth.getUser();
 const {data:admin,error:checkError}=await db.from("admin_members").select("role,active").eq("user_id",user.id).maybeSingle();
 if(checkError||!admin||!admin.active){await db.auth.signOut();msg.textContent="This account is not an active DRAGONOV administrator.";return;}
 location.replace("dashboard.html");
});