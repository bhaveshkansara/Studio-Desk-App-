# 🚀 DEPLOY TO VERCEL - RIGHT NOW (5 MINUTES)

## **Your Environment Variables**

Copy these exact values to Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://hxpuchqqjtwgxzzwqgzx.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_t-VlAOLczb0LTkMlHboD0w_MK5FJuxQ

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cHVjaHFxanR3Z3h6endxZ3p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA1MzgyNCwiZXhwIjoyMTA1NjI5ODI0fQ.Y-6GwMFndjC2ZYqHpf68Dgz1bc77Cd8A6n8XCZIHdJw

ANTHROPIC_API_KEY= (leave empty if not using AI)

ANTHROPIC_MODEL=claude-opus-5 (optional)
```

---

## **QUICK CHECKLIST**

- [ ] Code committed to GitHub
- [ ] Vercel account created (vercel.com)
- [ ] GitHub connected to Vercel
- [ ] Repository selected
- [ ] Environment variables added
- [ ] Build successful
- [ ] App live!

---

## **DEPLOYMENT STEPS**

### **Step 1: Push Code (if not done)**
```bash
git add .
git commit -m "Production deployment - Studio Desk live"
git push origin main
```

### **Step 2: Vercel Setup (3 minutes)**

1. Go to **vercel.com**
2. Click **"Sign up"** → Select **"GitHub"**
3. Click **"New Project"**
4. Select **"studio-desk-app"** repo
5. Click **"Import"**

### **Step 3: Add Environment Variables (1 minute)**

In Vercel Import dialog:

1. Click **"Environment Variables"** dropdown
2. Add each variable:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://hxpuchqqjtwgxzzwqgzx.supabase.co`
   - Click "Add"

3. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `sb_publishable_t-VlAOLczb0LTkMlHboD0w_MK5FJuxQ`

4. Add `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cHVjaHFxanR3Z3h6endxZ3p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA1MzgyNCwiZXhwIjoyMTA1NjI5ODI0fQ.Y-6GwMFndjC2ZYqHpf68Dgz1bc77Cd8A6n8XCZIHdJw`

### **Step 4: Deploy (1 minute)**

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. See **"Congratulations! Your site is live"**
4. Copy your URL: `https://studio-desk-app-xxxxx.vercel.app`

---

## **AFTER DEPLOYMENT**

### **Immediate (5 minutes)**
- [ ] Test app at your Vercel URL
- [ ] Try sign up
- [ ] Try login
- [ ] Check dashboard loads

### **Custom Domain (Optional but recommended)**

Add your own domain (e.g., app.studiodesk.in):

1. In Vercel Dashboard → **Settings > Domains**
2. Add domain name
3. Update DNS at your registrar (Namecheap, GoDaddy, etc)
4. Wait 24 hours for DNS propagation
5. Vercel auto-creates SSL certificate

---

## **IF SOMETHING GOES WRONG**

### **Error: "Build failed"**
- Check environment variables are correct
- Make sure all 3 Supabase variables are added
- Rebuild by pushing to GitHub again

### **Error: "Cannot find module"**
- Missing env variable
- Re-check SUPABASE_SERVICE_ROLE_KEY value
- Make sure there are no extra spaces

### **App loads but features don't work**
- Check WhatsApp config in Settings (it's optional)
- Check Razorpay config in Settings (it's optional)
- Basic booking features work without them

### **Still stuck?**
- Email: support@studiodesk.in
- Share your Vercel project link
- We'll help debug

---

## **SUCCESS! YOUR APP IS LIVE** 🎉

Once deployed:

1. **Share your Vercel URL**
2. **Test all features**
3. **Customize domain** (optional)
4. **Add to landing page**
5. **Start inviting users!**

---

## **NEXT STEPS AFTER DEPLOYMENT**

1. ✅ Deployed to Vercel
2. ⏭️ Customize landing page domain
3. ⏭️ Create social media accounts
4. ⏭️ Send launch announcement
5. ⏭️ Invite first 50 beta users

---

**You're minutes away from going live!** 🚀

Take 5 minutes right now to deploy. I'll wait! 💅
