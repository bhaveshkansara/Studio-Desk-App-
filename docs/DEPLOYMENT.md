# Deployment Guide - Studio Desk to Production

## **OPTION 1: Vercel (RECOMMENDED - 5 minutes)**

Vercel is the best platform for Next.js apps. It's free for the hobby tier and auto-deploys on every git push.

### **Step 1: Connect GitHub**
1. Push your code to GitHub: `git push origin main`
2. Go to vercel.com
3. Click "New Project"
4. Select your GitHub repository
5. Click "Import"

### **Step 2: Add Environment Variables**
1. In Vercel Dashboard, go to **Settings > Environment Variables**
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_api_key (optional)
```

3. Click "Save"

### **Step 3: Deploy**
1. Click "Deploy"
2. Wait 2-3 minutes
3. **Your app is live!** Get the URL from Vercel dashboard

### **Step 4: Custom Domain (Optional)**
1. In Vercel, go to **Settings > Domains**
2. Add your domain (e.g., app.studiodesk.in)
3. Update DNS settings with your registrar
4. Vercel handles SSL automatically

---

## **OPTION 2: AWS Lightsail**

### **Step 1: Create Lightsail Instance**
1. Go to aws.amazon.com
2. Navigate to Lightsail
3. Click "Create instance"
4. Choose Ubuntu 22.04 LTS
5. Select $5/month plan (or higher)
6. Name it "studio-desk"
7. Click "Create"

### **Step 2: Connect via SSH**
```bash
# Download the private key from AWS console
ssh -i ~/key.pem ubuntu@your-instance-ip

# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### **Step 3: Deploy Code**
```bash
# Clone repository
git clone https://github.com/yourusername/studio-desk-app.git
cd studio-desk-app

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start "npm start" --name studio-desk
pm2 startup
pm2 save
```

### **Step 4: Configure Nginx**
```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/default
```

Add this config:
```nginx
server {
    listen 80;
    server_name app.studiodesk.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then:
```bash
# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Get SSL certificate
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.studiodesk.in
```

---

## **OPTION 3: DigitalOcean App Platform**

### **Step 1: Connect GitHub**
1. Go to digitalocean.com
2. Click "Create > App"
3. Select your GitHub repository
4. DigitalOcean auto-detects Next.js
5. Click "Next"

### **Step 2: Configure**
1. Add environment variables (same as Vercel)
2. Select pricing plan ($5+/month)
3. Review & Create

### **Step 3: Deploy**
1. Click "Create Resources"
2. Wait for deployment (5-10 minutes)
3. Get your app URL
4. Add custom domain in settings

---

## **ENVIRONMENT VARIABLES (All Platforms)**

Required for production:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Optional: AI Features
ANTHROPIC_API_KEY=sk-...

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_id
```

---

## **POST-DEPLOYMENT CHECKLIST**

After deployment, verify everything works:

- [ ] App loads (visit your URL)
- [ ] Sign up works
- [ ] Login works
- [ ] Can create a lead
- [ ] Can send a quotation
- [ ] WhatsApp integration works (test sending a message)
- [ ] Razorpay payment works (test mode)
- [ ] Analytics page loads
- [ ] Team features work

---

## **MONITORING & MAINTENANCE**

### **Set up Error Tracking**
Use Sentry for error monitoring:
```bash
npm install @sentry/nextjs

# Add to next.config.mjs
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

### **Monitor Database**
1. Go to Supabase dashboard
2. Check "Usage" tab
3. Monitor connections, storage, bandwidth
4. Set up alerts

### **Backup Strategy**
1. Enable Supabase automated backups (Settings > Backups)
2. Set backup frequency to daily
3. Test restore monthly

---

## **SCALING**

As you grow:

1. **Add CDN** (Cloudflare)
   - Improves performance globally
   - Caches static assets
   - DDoS protection

2. **Add caching**
   - Redis cache layer
   - ISR (Incremental Static Regeneration)

3. **Upgrade database**
   - Upgrade Supabase plan
   - Add read replicas

4. **Add worker processes**
   - Process reminders in background
   - Handle payments asynchronously

---

## **TROUBLESHOOTING**

### **App won't load**
- Check environment variables are set
- Check database connection
- Check logs in Vercel/AWS/DigitalOcean

### **WhatsApp not sending**
- Verify API credentials in settings
- Check WhatsApp config saved in database
- Test with Postman: `curl -X POST https://graph.instagram.com/v18.0/{phone_id}/messages`

### **Payment errors**
- Verify Razorpay credentials
- Check if in test/live mode
- Test with Razorpay test numbers

### **Slow performance**
- Check database query performance
- Add indexes (done in schema.sql)
- Enable caching
- Upgrade server plan

---

## **SUPPORT**

Deployment issues?
- Vercel: Support built-in
- AWS/DigitalOcean: Check their docs
- Code issues: support@studiodesk.in

---

**Deploy time: 5-30 minutes depending on platform chosen**

**Recommended: Use Vercel for fastest setup!** 🚀
