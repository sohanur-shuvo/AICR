# Deployment Guide - AICR API Service

## Quick Start - Deploy for Customer API Access

This guide helps you deploy AICR as an API service that customers can use.

## Prerequisites

- Server with Docker installed (or Python 3.10+)
- OpenAI API key (for OpenAI mode)
- Domain name (optional, for production)

## Deployment Options

### Option 1: Docker Deployment (Recommended)

1. **Prepare files:**
   ```bash
   # Ensure these exist:
   - .env (with OPENAI_API_KEY)
   - models/ directory (for YOLO model, optional)
   - data/ directory (auto-created for customer keys)
   ```

2. **Build and run:**
   ```bash
   docker-compose up -d
   ```

   Or manually:
   ```bash
   docker build -t aicr-api .
   docker run -d -p 8000:8000 \
     -v $(pwd)/models:/app/models \
     -v $(pwd)/data:/app/data \
     -v $(pwd)/.env:/app/.env \
     --name aicr-api aicr-api
   ```

3. **Verify:**
   ```bash
   curl http://localhost:8000/
   ```

### Option 2: Direct Python Deployment

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set environment:**
   ```bash
   export OPENAI_API_KEY=your_key_here
   ```

3. **Run with production server:**
   ```bash
   cd backend
   uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
   ```

## Create Your First Customer

**Example using curl:**
```bash
curl -X POST http://localhost:8000/admin/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "api_key": "aicr_xxxxxxxxxxxxxxxxxxxxx",
  "customer": {
    "customer_id": "customer_1",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T12:00:00"
  },
  "message": "Customer created successfully. Save the API key - it won't be shown again!"
}
```

**⚠️ Save the API key** - give it to your customer!

## View All Customers

```bash
curl http://localhost:8000/admin/customers
```

## Production Deployment (Cloud)

### AWS EC2 / DigitalOcean / Linode

1. **SSH to server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone repository:**
   ```bash
   git clone your-repo-url
   cd AICR
   ```

3. **Configure environment:**
   ```bash
   # Create .env
   echo "OPENAI_API_KEY=your_key" > .env
   ```

4. **Deploy with Docker:**
   ```bash
   docker-compose up -d
   ```

5. **Set up reverse proxy (Nginx):**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **Add SSL (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Cloud Platforms

**Heroku:**
```bash
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your_key
git push heroku main
```

**Railway:**
1. Connect GitHub repo
2. Set `OPENAI_API_KEY` in environment variables
3. Deploy

**Fly.io:**
```bash
fly launch
fly secrets set OPENAI_API_KEY=your_key
fly deploy
```

## Customer Onboarding

1. **Create customer account:**
   ```bash
   POST /admin/customers
   ```

2. **Send them:**
   - API key (e.g., `aicr_xxxxx...`)
   - Base URL (e.g., `https://api.yourdomain.com`)
   - API documentation (`CUSTOMER_API_DOCS.md`)

3. **They use it like:**
   ```python
   import requests
   
   response = requests.post(
       "https://api.yourdomain.com/v1/detect",
       headers={"Authorization": "aicr_their_key"},
       json={"image": "base64_image", "detection_mode": "openai"}
   )
   ```

## Security Recommendations

### 1. Protect Admin Endpoints

Add authentication to `/admin/*` endpoints:

```python
# In api.py, add admin auth
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN', 'change-this-in-production')

def verify_admin(authorization: str = Security(api_key_header)):
    if authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(403, "Admin access required")
```

### 2. CORS Configuration

Update CORS for production:

```python
# In api.py
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # ['https://yourdomain.com']
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### 3. Rate Limiting

Add rate limiting middleware (install `slowapi`):

```bash
pip install slowapi
```

### 4. Environment Variables

Never commit `.env` file. Use:
- Docker secrets
- Cloud provider secrets managers
- Environment variables

## Monitoring

### Check API Status:
```bash
curl http://localhost:8000/status
```

### View Customer Usage:
```bash
curl http://localhost:8000/admin/customers
```

### Logs (Docker):
```bash
docker logs aicr-api
```

## Troubleshooting

**API not accessible:**
- Check firewall: `ufw allow 8000`
- Check Docker logs: `docker logs aicr-api`

**Customer API key not working:**
- Verify key exists: Check `data/customer_keys.json`
- Verify key is active: `active: true` in customer data

**OpenAI errors:**
- Check `.env` has valid `OPENAI_API_KEY`
- Verify OpenAI account has credits

## Example Production Setup

```bash
# 1. Server setup
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose nginx

# 2. Deploy app
git clone your-repo
cd AICR
echo "OPENAI_API_KEY=sk-..." > .env
docker-compose up -d

# 3. Configure Nginx
sudo nano /etc/nginx/sites-available/aicr-api
# (Add reverse proxy config)

# 4. SSL
sudo certbot --nginx -d api.yourdomain.com
```

## Cost Estimation

- **Server:** $5-20/month (VPS)
- **OpenAI API:** ~$0.01-0.05 per detection
- **Domain:** $10-15/year (optional)
- **Total:** ~$10-50/month depending on usage

---

**Your API is now ready for customers! 🚀**

See `CUSTOMER_API_DOCS.md` for customer-facing documentation.

