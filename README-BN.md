# DRAGONOV Secure Website — সেটআপ গাইড

## এই প্যাকেজে কী আছে
- Public website: Events/Seminar/Webinar, Courses, Quizzes
- Admin login: Supabase Auth
- Primary owner: প্রথমে একজন Owner
- Email invitation: Owner/Admin dashboard থেকে অন্য Admin-কে invite
- Quiz link: Google Form বা যেকোনো HTTPS quiz link যোগ করা যাবে
- Database security: Supabase Row Level Security (RLS)

## ১. Supabase Project তৈরি
1. https://supabase.com/dashboard এ গিয়ে নতুন project তৈরি করুন।
2. SQL Editor খুলে `supabase/schema.sql`-এর সম্পূর্ণ SQL চালান।
3. Authentication → URL Configuration-এ আপনার GitHub Pages URL যোগ করুন:
   - Site URL: `https://YOUR-USERNAME.github.io/YOUR-REPO`
   - Redirect URLs: `https://YOUR-USERNAME.github.io/YOUR-REPO/admin/login.html`
4. Authentication → Providers → Email চালু রাখুন।

## ২. Primary Owner তৈরি
1. Supabase → Authentication → Users → Add user থেকে আপনার নিজের email/password দিয়ে user তৈরি করুন।
2. তৈরি হওয়া user-এর UUID এবং email কপি করুন।
3. SQL Editor-এ `schema.sql`-এর শেষে থাকা INSERT statement uncomment করে UUID/email বসিয়ে চালান।
4. এই প্রথম account-টিই Primary Owner হবে। Owner-কে dashboard থেকে disable করা যায় না।

## ৩. Frontend কনফিগার
1. `assets/config.example.js`-কে কপি করে একই folder-এ `config.js` নামে রাখুন।
2. Supabase → Project Settings → API থেকে Project URL এবং anon/public key বসান।
3. এখানে কখনো `service_role` key বসাবেন না।
4. `index.html`-এ public content এবং `admin/login.html`-এ admin login থাকবে।

## ৪. Email invitation function deploy
Service role key শুধু Edge Function-এর server-side secret হিসেবে থাকবে।

Supabase CLI দিয়ে project link করুন, তারপর:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set SITE_URL=https://YOUR-USERNAME.github.io/YOUR-REPO
supabase functions deploy invite-admin
```
Supabase Edge Function-এর built-in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` secrets ব্যবহার হবে। এগুলো frontend-এ দেবেন না।

Dashboard → Authentication → URL Configuration-এ redirect URL-ও allowlist-এ যোগ করুন। Email template-এ confirmation/invite link সঠিকভাবে কাজ করছে কিনা পরীক্ষা করুন।

## ৫. GitHub Pages publish
1. সব ফাইল GitHub repository-তে upload করুন।
2. `assets/config.js`-এ public URL এবং anon key বসান।
3. Repository Settings → Pages → Deploy from branch → `main` / root নির্বাচন করুন।
4. কয়েক মিনিট পর public URL খুলুন।

## ৬. Admin ব্যবহার
- Owner: `admin/login.html` থেকে login করবেন।
- Dashboard → Invite admin-এ অন্য ব্যক্তির email দিন।
- Invitee email-এর invitation link খুলে Supabase account setup/accept করবেন।
- তারপর admin login page থেকে login করতে পারবেন।
- Owner dashboard থেকে অন্য admin disable/enable করতে পারবেন।
- Admin content create/update/delete করতে পারবে; Owner membership control করতে পারবে।

## ৭. Quiz / Google Form যোগ
Dashboard → Manage content:
- Content type: Quiz
- Title/Description দিন
- Registration / Google Form / Quiz URL-এ `https://forms.gle/...` দিন
- Publish checkbox নির্বাচন করে Save করুন।

## গুরুত্বপূর্ণ নিরাপত্তা
- Supabase anon key browser-এ থাকা স্বাভাবিক; RLS-ই access control।
- `service_role` key কখনো HTML/JS/GitHub repository-তে দেবেন না।
- GitHub Pages static hosting; এখানে password বা secret রেখে server-side security করা যায় না।
- Production-এ deploy করার আগে RLS policies, email invite, owner bootstrap এবং unauthorized user test করুন।
- এই starter-এ event, course, quiz একই `content_items` table-এ রাখা হয়েছে; event category দিয়ে Seminar/Webinar আলাদা করা যায়।
- If your project already has tables/policies, don't blindly run this schema over the existing database. Use a fresh Supabase project or review/merge policies first.
