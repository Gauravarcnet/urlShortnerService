# URL Shortener API

Production-ready URL shortener with registration login authentication, rate limiting, and abuse prevention.

## 🚀 Quick Setup


git clone
npm install

install docker if not 
-docker compose down
-npm run build
-docker compose up --build -d --scale app=3 -d to scale 3 instance otherwise simple run app = 1

-docker compose ps
Start (Docker Compose)
API ready: http://localhost:8080
Swagger Docs:  run on swagger.json in online editor swagger open editor

## 📋 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Create user | No |
| `POST` | `/auth/login` | Get JWT token | No |
| `POST` | `/shorten` | Create short URL | Yes |
| `GET` | `/:code` | Redirect to long URL | No |
| `GET` | `/health` | Health check | No |


### 1. Register User

curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test4@example.com","password":"password123"}'

### 2. Login (Get Token)

curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test4@example.com","password":"password123"}'
**Response:** `{"token": "...", "user": {"id": "...", "email": "..."}}`

### 3. Create Short URL

curl -X POST http://localhost:8080/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUwNzEasddd5OTY0LTZjZmMtNGE3OS1hNmQ2LTAyMDEwZGY1ZjdlMCIsImVtYWlsIjoidGVzdDRAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjY0ODM2MTIsImV4cCI6MTc2NzA4ODQxMn0.yUyiYIxs9AITHdGGbe6OK8IILJMKLBSLGuLRPo8n2RQ" \
  -d '{"longUrl": "https://google.com"}'
**Response:** `{"shortUrl": "http://localhost:8080/abc123"}`

### 4. Test Redirect

curl -L http://localhost:8080/abc123
Redirects to: https://google.com

## ⚙️ Configuration

**.env file (create if missing) use .en.example: like** make changes according to your configuration

**docker-compose.yml services:**
- `app` → Node.js API (port 3000 internal)
- `postgres` → Database (urlshort/urlshort)
- `redis` → Rate limiting + cache
- `nginx` → Reverse proxy (port 8080 external)

## 🔍 Swagger Docs


## 🛠️ Development


Rebuild
npm run build
docker compose up --build --scale app=3 -d

Logs
docker compose logs -f app

Reset data
docker compose exec postgres psql -U urlshort -d urlshort -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec redis redis-cli FLUSHALL


## Ports
- **8080** → API + Swagger (nginx)
- **5432** → Postgres (exposed for debugging)
- **6379** → Redis (internal only)
