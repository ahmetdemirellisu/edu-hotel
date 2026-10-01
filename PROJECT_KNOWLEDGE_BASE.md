# EDU Hotel — Proje Bilgi Bankası (Knowledge Base)

> Bu doküman projeyi sıfırdan kurabilmek, hata ayıklayabilmek veya devam ettirebilmek için  
> gereken **tüm** bilgileri içerir. Son güncelleme: 30 Eylül 2026.

---

## 1. Genel Mimari

```
┌─────────────────────────────────────────────────────┐
│                   Kullanıcı Tarayıcı                │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
        ┌───────────────▼───────────────┐
        │   Üniversite Reverse Proxy    │
        │   student-projects.sabanciuniv│
        │   /ehp/* → localhost:8004     │
        └───────────────┬───────────────┘
                        │
          ┌─────────────▼─────────────┐
          │    Frontend (Nginx)       │
          │    Container: ehp-frontend│
          │    Port: 8004             │
          │    React 18 + Vite + TS   │
          ├───────────────────────────┤
          │  /ehp/api/* → backend:9004│
          │  /api/*     → backend:9004│
          └─────────────┬─────────────┘
                        │
          ┌─────────────▼─────────────┐
          │    Backend (Node.js)      │
          │    Container: ehp-backend │
          │    Port: 9004             │
          │    Express + Prisma ORM   │
          └─────────────┬─────────────┘
                        │
          ┌─────────────▼─────────────┐
          │    PostgreSQL 16           │
          │    Container: ehp-db      │
          │    Port: 7004 (internal)  │
          └───────────────────────────┘
```

**Stack:** React 18 + TypeScript + Vite (frontend) / Node.js + Express + Prisma (backend) / PostgreSQL 16

---

## 2. Repository ve Git Yapısı

| Remote | URL | Branch | Açıklama |
|--------|-----|--------|----------|
| `origin` (GitHub) | `https://github.com/ahmetdemirellisu/edu-hotel` | `main` | Ana repo. GitHub Actions ile deploy |
| `gitlab` (SGS) | `https://sgs.sabanciuniv.edu/student/ehp` | `development` | Üniversite GitLab. `main → development` olarak push |

**Çalışma kuralı:** Tek branch (`main`) üzerinde çalış. Push yaparken:
```bash
git push origin main          # GitHub → deploy tetiklenir
git push gitlab main:development  # GitLab SGS
```

---

## 3. Dual Deployment (ÇOK ÖNEMLİ)

Proje iki farklı yerde çalışıyor ve path yapıları farklı:

| Ortam | URL | Base Path | API Path |
|-------|-----|-----------|----------|
| **GitHub (student-projects)** | `https://student-projects.sabanciuniv.edu/ehp/` | `/ehp` | `/ehp/api` |
| **GitLab SGS (root)** | `https://example.com/` | `/` | `/api` |

### Nasıl çalışıyor:

**Frontend:**
- `vite.config.ts` → `base: env.VITE_BASE_PATH || '/ehp/'`
- `App.tsx` → `<Router basename={import.meta.env.VITE_BASE_PATH || "/"}>`
- Her component'te → `const API_BASE = (import.meta as any).env?.VITE_API_URL || "/ehp/api"`
- GitHub Actions Dockerfile build → `--build-arg VITE_API_URL=/ehp/api --build-arg VITE_BASE_PATH=/ehp`
- Root deploy → Dockerfile default: `VITE_API_URL=/api`, `VITE_BASE_PATH=/`

**Backend:**
- E-posta linkleri: `CLIENT_URL` + `CLIENT_BASE_PATH` env var ile
- `docker-compose-server.yml` → `CLIENT_BASE_PATH: /ehp`
- Root deploy → `CLIENT_BASE_PATH` boş bırakılır

**Nginx (`frontend/nginx.conf`):**
- `/ehp/api/` → `proxy_pass http://backend:9004/`
- `/api/` → `proxy_pass http://backend:9004/`
- `/ehp/` → SPA fallback
- `/` → SPA fallback

> ⚠️ **Yeni bir API endpoint veya frontend route eklerken her iki path yapısını da test et!**

---

## 4. Environment Variables

### Sunucu `.env` (~/app/.env)
```env
PROJECT_NAME=edu-hotel
GITHUB_REPOSITORY=ahmetdemirellisu/edu-hotel
FRONTEND_PORT=8004
BACKEND_PORT=9004
POSTGRES_PORT=7004
POSTGRES_USER=appuser
POSTGRES_PASSWORD=apppass
POSTGRES_DB=appdb
JWT_SECRET=<secret>
JWT_ADMIN_SECRET=<secret>
ADMIN_USER=<admin-username>
ADMIN_PASS=<admin-password>
EMAIL_USER=eduhotelsabanci@gmail.com
EMAIL_PASS=<app-password>
SMTP_USER=eduhotelsabanci@gmail.com
SMTP_PASS=<app-password>
EMAIL_PORT=587
EMAIL_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
```

### GitHub Secrets (Actions'ta kullanılır)
Deploy workflow `.env`'i bu secret'lardan oluşturur:
`JWT_SECRET`, `JWT_ADMIN_SECRET`, `ADMIN_USER`, `ADMIN_PASS`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `FRONTEND_PORT`, `BACKEND_PORT`, `DEPLOY_TOKEN`

### Backend'e geçen env var'lar (docker-compose-server.yml)
| Var | Açıklama |
|-----|----------|
| `JWT_SECRET` | Kullanıcı + admin token imzalama |
| `JWT_ADMIN_SECRET` | Fallback: `${JWT_SECRET}` |
| `ADMIN_USER` / `ADMIN_PASS` | Admin login credentials (DB'de değil, env'de) |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Seed'de oluşturulan DB admin kullanıcısı |
| `CLIENT_URL` | E-posta linklerinin origin'i |
| `CLIENT_BASE_PATH` | E-posta linklerinin subpath'i (`/ehp` veya boş) |
| `UPLOAD_DIR` | Upload dizini (default: `/app`) |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP credentials |

---

## 5. Admin Login Sistemi

**İKİ FARKLI admin mekanizması var:**

### 1. Admin Panel Login (`/admin-login`)
- **Endpoint:** `POST /auth/admin-login`
- **Credentials:** `ADMIN_USER` + `ADMIN_PASS` env var'larından
- **Token:** `JWT_SECRET` ile imzalanır, `role: "admin"` claim
- **Doğrulama:** `requireAdmin` middleware → `JWT_SECRET` ile verify, `decoded.role === "admin"` kontrolü
- **Bu DB'de bir kullanıcı DEĞİL!** Env var'dan okunan sabit credentials

### 2. Seed Admin User (Prisma DB)
- `prisma/seed.js` ile oluşturulur
- `ADMIN_SEED_EMAIL` + `ADMIN_SEED_PASSWORD` env var'ları
- Bu kullanıcı normal user gibi DB'de ama `role: "ADMIN"`, `userType: "STAFF"`
- Production'da env var yoksa seed durur

---

## 6. Veritabanı Şeması (Prisma)

```
User              → email, password(hash), name, firstName, lastName, role, userType
PasswordResetToken → userId, tokenHash, expiresAt, usedAt
Room              → name, type(SINGLE/DOUBLE), price, capacity, status, amenities
Reservation       → userId, roomId, roomIds(JSON), checkIn, checkOut, status, price, paymentStatus
IdentityDocument  → reservationId, guestIndex, fileName
Blacklist         → userId (unique), reason, createdAt
Settings          → key, value
```

**Odalar:** 49 oda (201-251), Kat 2. 47 single + 2 double (210, 242).

**Reservation status flow:** `PENDING → APPROVED → (room assigned) → COMPLETED / CANCELLED`

---

## 7. Dosya Yükleme Sistemi

Upload'lar `UPLOAD_DIR` (default: `/app`) altında:
```
/app/paymentRecieptsPending/      → Ödeme dekontları (bekleyen)
/app/paymentRecieptsPending/.tmp/ → Temp (auth öncesi)
/app/paymentRecieptsAprooved/     → Onaylanan dekontlar
/app/identityDocs/                → Kimlik belgeleri
/app/identityDocs/.tmp/           → Temp (auth öncesi)
```

> ⚠️ Dizin isimleri typo içeriyor (Reciepts, Aprooved) ama tüm kod bu isimleri kullanıyor — DEĞİŞTİRME!

**Güvenlik pattern'i:** Multer → `.tmp/` yazıyor (random isim) → auth + ownership check → `renameSync` ile final dizine → hata durumunda temp silinir. Magic bytes (JPG/PNG/PDF) + min 4 byte kontrolü var.

---

## 8. Deploy Süreci (GitHub Actions)

`.github/workflows/deploy.yml`:

1. Push to `main` → workflow tetiklenir
2. Backend Docker image build → `ghcr.io/ahmetdemirellisu/edu-hotel/backend:latest`
3. Frontend Docker image build → `ghcr.io/ahmetdemirellisu/edu-hotel/frontend:latest`
   - `--build-arg VITE_API_URL=/ehp/api --build-arg VITE_BASE_PATH=/ehp`
4. Images push to GHCR
5. SSH ile sunucuya bağlan (`self-hosted` runner)
6. `.env` dosyasını GitHub Secrets'tan oluştur
7. `docker-compose-server.yml`'i kopyala
8. `podman-compose up --remove-orphans --force-recreate`

**Sunucu:** `student-projects.sabanciuniv.edu`
- Podman (Docker değil, podman-compose Python 3.9)
- Systemd user service: `ehp-app.service`
- Deploy dizini: `~/app/`
- **DİKKAT:** `${VAR:?error}` syntax'ı podman-compose'da var boşsa RuntimeError verir

---

## 9. Frontend Sayfa Yapısı

| Route | Sayfa | Auth |
|-------|-------|------|
| `/` | LandingPage | Hayır |
| `/login` | Login | Hayır |
| `/signup` | Signup | Hayır |
| `/forgot-password` | ForgotPassword | Hayır |
| `/reset-password` | ResetPassword | Hayır |
| `/main` | Dashboard | Evet |
| `/book-room` | BookRoomPage | Evet |
| `/reservations` | Myreservations | Evet |
| `/payment` | Payment | Evet |
| `/profile` | MyAccount | Evet |
| `/notifications` | NotificationsPage | Evet |
| `/contact` | ContactSupportPage | Evet |
| `/admin-login` | AdminLogin | Hayır |
| `/admin` | AdminDashboard | Admin |

### API Base Pattern
Her component'te:
```tsx
const API_BASE = (import.meta as any).env?.VITE_API_URL || "/ehp/api";
```
Ardından: `fetch(\`\${API_BASE}/auth/login\`, ...)`

---

## 10. Backend API Endpoints

| Route | Dosya | Auth | Açıklama |
|-------|-------|------|----------|
| `/auth/*` | auth.js | Çeşitli | Login, register, forgot/reset password, admin-login |
| `/users/*` | users.js | requireAuth | User CRUD |
| `/rooms/*` | rooms.js | Çeşitli | Oda listesi, availability (public + admin) |
| `/reservations/*` | reservations.js | requireAuth | Rezervasyon CRUD, room assignment |
| `/payment/*` | payment.js | requireAuth | Dekont upload |
| `/admin/*` | admin.js | requireAdmin | Admin işlemleri, onay, raporlar |
| `/blacklist/*` | blacklist.js | requireAdmin | Kara liste yönetimi |
| `/notifications/*` | notifications.js | requireAuth | Bildirim sistemi |
| `/settings/*` | settings.js | requireAdmin | Uygulama ayarları |

### Middleware zinciri
```
requireAuth  → JWT verify (JWT_SECRET) → req.user = { userId, email, ... }
requireAdmin → JWT verify (JWT_SECRET) → decoded.role === "admin" → req.admin
checkBlacklist → req.user.userId ile blacklist kontrolü (fail-closed)
```

---

## 11. Güvenlik Düzeltmeleri Özeti

| ID | Sorun | Çözüm |
|----|-------|-------|
| G01 | Multer auth'dan önce yazıyor | Temp + move pattern |
| G02 | Availability'de PII sızıntısı | Public endpoint'te user data yok |
| G03 | Password hash API'de görünüyor | `user: { select: {...} }` |
| G04 | Race condition (oda atama) | Serializable transaction |
| G05 | Blacklist body.userId bypass | Sadece JWT userId + fail-closed |
| D01 | Node 20 (destek dışı) | Node 22 LTS |
| D02 | Upload dizini root'ta | `/app/` altında, UPLOAD_DIR env |

---

## 12. E-posta Sistemi

- **Provider:** Gmail SMTP (`smtp.gmail.com:587`)
- **Credentials:** `EMAIL_USER` / `EMAIL_PASS` (App Password)
- **Template:** `backend/services/mailTemplate.js` — Bilingual (EN/TR)
- **XSS koruması:** `escapeHtml()` tüm helper'larda uygulanıyor
- **Gönderim:** `backend/services/mail.js` → `sendMailAsync()`

E-postalardaki linkler `clientUrl()` fonksiyonu ile oluşturulur:
```js
CLIENT_URL + CLIENT_BASE_PATH + "/reset-password?token=..."
```

---

## 13. Sık Karşılaşılan Problemler ve Çözümleri

### Container başlamıyor — `RuntimeError: JWT_ADMIN_SECRET is required`
→ `.env`'de `JWT_ADMIN_SECRET` eksik. `docker-compose-server.yml`'de fallback var (`${JWT_ADMIN_SECRET:-${JWT_SECRET}}`), ama `.env`'de hiç tanımlanmamışsa podman hata verir. `.env`'e ekle veya GitHub Secrets'a ekle.

### Admin login çalışmıyor — "Invalid credentials"
→ `ADMIN_USER` ve `ADMIN_PASS` container'a geçirilmemiş olabilir. `docker-compose-server.yml`'de environment bölümünde olmalı.

### Reset password linki yanlış
→ `CLIENT_BASE_PATH` env var'ını kontrol et. `/ehp` deploy'da `/ehp`, root deploy'da boş olmalı.

### npm install hata — "No matching version"
→ `package.json`'da var olmayan sürüm yazılmış. npm registry'de gerçek mevcut sürümü kontrol et:
```bash
npm view <package> version
```

### Build başarısız — peer dep conflict
→ Frontend'de `--legacy-peer-deps` kullan:
```bash
npm install --legacy-peer-deps
```

### Branch değiştirirken değişiklikler kayboluyor
→ Commit etmeden branch değiştirme! Önce commit veya `git stash`.

### Upload yetkisi yok
→ Dockerfile'da dizinler `/app/` altında olmalı ve `chown -R node:node /app` yapılmalı. `UPLOAD_DIR` env var'ı ayarlanabilir.

---

## 14. Lokal Geliştirme

```bash
# Backend
cd backend
cp ../.env .env  # veya kendi .env'ini oluştur
npm install
npx prisma migrate dev
npx prisma db seed
npm start        # → localhost:9004

# Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev      # → localhost:5173 (Vite dev server)

# Docker ile tümü
docker-compose up --build  # → localhost:8004
```

### Lokal .env örneği
```env
DATABASE_URL=postgresql://appuser:apppass@localhost:5440/appdb
JWT_SECRET=localdev123
JWT_ADMIN_SECRET=localdev123
ADMIN_USER=admin
ADMIN_PASS=admin123
EMAIL_USER=test@example.com
EMAIL_PASS=test
EMAIL_PORT=587
EMAIL_HOST=smtp.gmail.com
ADMIN_SEED_EMAIL=admin@test.com
ADMIN_SEED_PASSWORD=Test1234!
```

---

## 15. Dosya Yapısı

```
edu-hotel/
├── .github/workflows/deploy.yml     ← GitHub Actions CI/CD
├── .systemd/                        ← GitLab SGS deploy dosyaları
│   ├── .Dockerfile.ehp.production   ← Backend (Node 22)
│   ├── .Dockerfile.ehp.development
│   ├── .Dockerfile.ehp-frontend.*
│   └── ci/.gitlab-ci-*.yml
├── backend/
│   ├── Dockerfile                   ← GitHub deploy için
│   ├── app.js                       ← Express app + middleware
│   ├── bin/www                      ← HTTP server
│   ├── prismaClient.js
│   ├── prisma/
│   │   ├── schema.prisma            ← DB şeması
│   │   ├── seed.js                  ← Oda + admin seed
│   │   └── migrations/
│   ├── routes/                      ← API endpoints
│   ├── middleware/                   ← Auth, admin, blacklist
│   ├── services/                    ← Mail, template
│   └── utils/                       ← sanitize.js
├── frontend/
│   ├── Dockerfile                   ← Multi-stage (build + nginx)
│   ├── nginx.conf                   ← Dual-path proxy + SPA
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx                  ← Router + routes
│       ├── api/                     ← API client functions
│       ├── assets/                  ← Logo PNG'leri
│       ├── components/              ← Tüm sayfalar
│       │   ├── admin/               ← Admin panel
│       │   └── layout/              ← Navbar, Footer
│       └── locales/                 ← i18n (tr/en)
├── docker-compose.yml               ← Lokal geliştirme
└── docker-compose-server.yml        ← Üretim deploy
```
