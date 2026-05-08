# 🔒 EduSys - Xavfsizlik Qoidalari

## 1. Autentifikatsiya (Authentication)
- Parollar **bcryptjs** bilan 12 round salt ishlatib hashlanadi
- **JWT** tokenlar 30 kunlik muddatga beriladi
- Token faqat `httpOnly` cookie yoki `Authorization: Bearer` header orqali uzatiladi
- Telegram orqali 2-bosqichli tasdiqlash (2FA) mavjud

## 2. Avtorizatsiya (Authorization)
- **RBAC** (Role-Based Access Control) — har bir endpoint uchun ruxsat etilgan rollar belgilanadi
- `protect` middleware — faqat tizimga kirganlar
- `authorizeRoles` middleware — faqat ruxsat etilgan rollar

## 3. Input Validatsiya
- **Zod** kutubxonasi orqali barcha kiritilgan ma'lumotlar tekshiriladi
- Email, telefon raqam, parol kuchi — hammasi validatsiya qilinadi
- SQL Injection va NoSQL Injection oldini olish

## 4. Rate Limiting
- Login: **5 urinish / 15 daqiqa** (brute-force himoya)
- API: **100 so'rov / 15 daqiqa** (DDoS himoya)

## 5. HTTP Xavfsizligi
- **Helmet.js** — xavfsiz HTTP headerlar
- **CORS** — faqat ruxsat etilgan domainlardan so'rov
- **Content Security Policy** (CSP) — XSS himoya

## 6. Ma'lumotlar Bazasi
- `.env` faylidagi `DATABASE_URL` hech qachon git'ga yuklanmasin
- Prisma ORM orqali parameterized queries (SQL injection himoya)
- Foydalanuvchilar orasida ma'lumot izolyatsiyasi

## 7. Frontend Xavfsizlik
- `ProtectedRoute` komponenti — ruxsatsiz sahifalarga kirish bloklash
- Token faqat xavfsiz holatda saqlanadi
- API so'rovlarida interceptor orqali avtomatik token qo'shish

## 8. Muhit O'zgaruvchilari
- `.env` fayllar `.gitignore` ga qo'shilgan
- `env.ts` da barcha muhit o'zgaruvchilari validatsiya qilinadi
- Production uchun `JWT_SECRET` kamida 64 belgi bo'lishi shart
