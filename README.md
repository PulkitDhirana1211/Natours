# 🌍 Natours — Tour Booking Platform

> MEN stack (MongoDB, Express, Node.js) tour booking app built from Jonas Schmedtmann's Udemy bootcamp. Deployed on Heroku · Migrating to AWS EC2 + PostgreSQL.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)

---

## Stack

| | Current | Target |
|---|---|---|
| **Database** | MongoDB Atlas + Mongoose | PostgreSQL 15 + Prisma |
| **Hosting** | Heroku | AWS EC2 (Ubuntu 22.04) |
| **Proxy** | — | Nginx |
| **Cache** | — | Redis |
| **Process** | — | PM2 (cluster mode) |
| **Storage** | Local / Multer | AWS S3 |

Core: Node.js · Express · Pug (SSR) · JWT · Stripe · Mapbox · Nodemailer

---

## Features

- Browse, filter, and book tours (price, difficulty, duration, ratings)
- JWT auth with HttpOnly cookies — login, signup, password reset via email
- Stripe Checkout for tour payments + webhook handler
- Mapbox interactive maps with tour waypoints
- Role-based access: `user` · `guide` · `lead-guide` · `admin`
- Profile photo upload + Sharp resizing
- Tour reviews (one per user per tour), geospatial queries, aggregation stats

---

## Getting Started

```bash
git clone https://github.com/yourusername/natours.git
cd natours
npm install
cp .env.example .env          # fill in values
node dev-data/data/import-dev-data.js --import
npm run dev                   # http://localhost:3000
```

**Scripts**

```bash
npm run dev          # nodemon dev server
npm start            # production
npm run db:migrate   # Prisma migrations
npm run db:studio    # Prisma GUI
```

---

## Environment Variables

```env
NODE_ENV=development
PORT=3000

# MongoDB (current)
DATABASE=mongodb+srv://<user>:<pass>@cluster.mongodb.net/natours
DATABASE_PASSWORD=

# PostgreSQL (migration target)
DATABASE_URL=postgresql://user:pass@localhost:5432/natours

# JWT
JWT_SECRET=min-32-char-secret
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Email
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USERNAME=
EMAIL_PASSWORD=
EMAIL_FROM=Natours <noreply@natours.io>
SENDGRID_PASSWORD=SG.xxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Mapbox
MAPBOX_TOKEN=pk.eyJ1...

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=natours-uploads
AWS_REGION=us-east-1

# Redis
REDIS_URL=redis://localhost:6379
```

---

## Security

| Layer | Implementation |
|---|---|
| Headers | `helmet` with strict CSP (Mapbox + Stripe whitelisted) |
| CORS | Origin whitelist via `process.env.CORS_ORIGIN` |
| Rate limiting | 100 req/hr global · 10 req/15min on auth routes (Redis store for EC2) |
| Injection | `express-mongo-sanitize` + `xss-clean` |
| Pollution | `hpp` with query param whitelist |
| Body size | JSON + URL-encoded limited to `10kb` |
| Passwords | bcrypt cost factor 12 |
| Cookies | `HttpOnly + Secure + SameSite=Strict` |
| Reset tokens | `crypto.randomBytes(32)` → SHA-256, expires in 10 min |

```js
// Key middleware order in app.js
app.use(helmet({ contentSecurityPolicy: { /* Mapbox + Stripe directives */ } }));
app.use(cors(corsOptions));
app.use('/api', rateLimit({ windowMs: 3600000, max: 100 }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: ['duration', 'price', 'difficulty', 'ratingsAverage'] }));
app.use(express.json({ limit: '10kb' }));
app.use(compression());
```

---

## PostgreSQL Migration

**Prisma schema highlights:**

```prisma
model Review {
  tourId String
  userId String
  @@unique([tourId, userId])   // one review per user per tour
}

model UsersOnTours {
  userId String
  tourId String
  @@id([userId, tourId])       // guide assignments
}

enum Role       { USER GUIDE LEAD_GUIDE ADMIN }
enum Difficulty { EASY MEDIUM DIFFICULT }
```

**Steps:**

```bash
npm install prisma @prisma/client
npx prisma init
# populate schema.prisma
npx prisma migrate dev --name init
node scripts/migrate-mongo-to-pg.js   # one-time data migration
npx prisma generate
```

---

## EC2 Deployment

**1. Server setup (Ubuntu 22.04)**

```bash
# Node 20, PostgreSQL 15, Redis, Nginx, PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql redis-server nginx
sudo npm i -g pm2
```

**2. PM2 cluster mode**

```js
// ecosystem.config.js
module.exports = {
  apps: [{ name: 'natours', script: 'server.js',
           instances: 'max', exec_mode: 'cluster',
           env_production: { NODE_ENV: 'production', PORT: 3000 } }]
};
```

**3. Nginx — reverse proxy + DDoS + gzip**

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
  listen 443 ssl http2;
  server_name yourdomain.com;

  gzip on; gzip_comp_level 6;
  gzip_types text/css application/json application/javascript;

  limit_req zone=api burst=20 nodelay;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;

  location /public/ { alias /var/www/natours/public/; expires 30d; }
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;
  }
}
```

**4. Redis distributed rate limiting**

```js
const limiter = rateLimit({
  windowMs: 3600000, max: 100,
  store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
});
```

**5. GitHub Actions deploy**

```yaml
- name: Deploy
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ubuntu
    key: ${{ secrets.EC2_SSH_KEY }}
    script: |
      cd /var/www/natours && git pull
      npm install --production
      npx prisma migrate deploy
      pm2 reload natours --update-env
```

**6. SSL**

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Roadmap

- [x] MEN stack + Heroku deployment
- [ ] PostgreSQL migration with Prisma
- [ ] AWS EC2 + Nginx + PM2 cluster
- [ ] Redis distributed rate limiting
- [ ] AWS S3 for media storage
- [ ] Docker Compose for dev parity
- [ ] Jest + Supertest test suite

---

## Credits

Built following [Node.js, Express, MongoDB Bootcamp](https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/) by **Jonas Schmedtmann**. Extended with production security and AWS scaling.

---

MIT License
