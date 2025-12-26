# گزارش تحلیل سیستم احراز هویت و مشکل ریدایرکت

## 🔍 مشکلات شناسایی شده

### 1. مشکل اصلی: عدم هماهنگی بین Middleware و Client-Side Auth

#### مشکل:
- **Middleware** (server-side) از **Cookie** برای بررسی token استفاده می‌کند
- **AuthContext** (client-side) از **localStorage** برای بررسی token استفاده می‌کند
- این دو منبع ممکن است هماهنگ نباشند

#### کد مشکل‌دار:
```typescript
// middleware.ts:55
const tokenFromCookie = request.cookies.get("accessToken")?.value;

// AuthContext.tsx:37
const token = localStorage.getItem("accessToken");
```

---

### 2. مشکل: Cookie ممکن است به درستی Set نشود

#### مشکل:
- Cookie در `api.ts:72` با `document.cookie` set می‌شود
- اما ممکن است در برخی مرورگرها یا شرایط خاص کار نکند
- Cookie ممکن است expire شود یا clear شود

#### کد:
```typescript
// api.ts:72
document.cookie = `accessToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
```

---

### 3. مشکل: Race Condition بین Middleware و Dashboard Layout

#### مشکل:
- **Middleware** (server-side) چک می‌کند و ریدایرکت می‌کند
- **Dashboard Layout** (client-side) هم چک می‌کند و ریدایرکت می‌کند
- این دو ممکن است با هم تداخل داشته باشند

#### کد مشکل‌دار:
```typescript
// middleware.ts:59
if (!token && isProtectedRoute) {
  return NextResponse.redirect(loginUrl);
}

// dashboard/layout.tsx:15
if (!isLoading && !isAuthenticated) {
  router.push("/login?redirect=/dashboard");
}
```

---

### 4. مشکل: Admin Login Flow ناقص است

#### مشکل:
- بعد از `admin/login` → `otp` → token set می‌شود
- اما ممکن است cookie به درستی set نشود
- یا ممکن است middleware قبل از set شدن cookie اجرا شود

#### Flow فعلی:
```
/admin/login → API login → /otp → verifyOtp → setToken → redirect
```

---

### 5. مشکل: Token در AuthContext.login() Set نمی‌شود

#### مشکل:
- `AuthContext.login()` فقط user را در localStorage می‌گذارد
- اما token را نمی‌گذارد (token قبلاً در `verifyOtp` set شده)
- این ممکن است باعث inconsistency شود

#### کد:
```typescript
// AuthContext.tsx:67
const login = async (userData: User) => {
  setUser(userData);
  localStorage.setItem("user", JSON.stringify(userData));
  // ❌ Token set نمی‌شود!
};
```

---

## 🔧 راه‌حل‌های پیشنهادی

### راه‌حل 1: بهبود Cookie Setting

```typescript
// api.ts - بهبود setToken
private setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
    
    // Cookie با تنظیمات بهتر
    const expires = new Date();
    expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    
    document.cookie = `accessToken=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
    
    // Force cookie update
    document.cookie = `accessToken=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  }
}
```

### راه‌حل 2: هماهنگ‌سازی Middleware و Client

```typescript
// middleware.ts - بهبود token check
const tokenFromCookie = request.cookies.get("accessToken")?.value;
const tokenFromHeader = authHeader?.replace("Bearer ", "");

// اگر cookie نیست، از header استفاده کن
const token = tokenFromCookie || tokenFromHeader;

// اگر هنوز token نیست، بگذار client-side handle کند
if (!token && isProtectedRoute) {
  // فقط برای initial load redirect کن
  // بعد client-side handle می‌کند
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}
```

### راه‌حل 3: بهبود AuthContext

```typescript
// AuthContext.tsx - بهبود login
const login = async (userData: User, token?: string) => {
  setUser(userData);
  localStorage.setItem("user", JSON.stringify(userData));
  
  // اگر token داده شده، آن را هم set کن
  if (token) {
    localStorage.setItem("accessToken", token);
    // Cookie را هم update کن
    const expires = new Date();
    expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000));
    document.cookie = `accessToken=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  }
  
  window.dispatchEvent(new Event("storage"));
};
```

### راه‌حل 4: اضافه کردن Route برای Admin Login

```typescript
// middleware.ts - اضافه کردن admin/login به public routes
const publicRoutes = [
  "/",
  "/login",
  "/admin/login", // ✅ اضافه شود
  "/register",
  "/otp",
  // ...
];
```

---

## 📊 فلوچارت جریان احراز هویت فعلی

```
User → /dashboard/admin
  ↓
Middleware Check (Server-side)
  ├─ Cookie موجود؟ → Yes → Check Role → ADMIN? → Allow
  └─ Cookie موجود؟ → No → Redirect to /login?redirect=/dashboard/admin
      ↓
User → /login
  ↓
User → /admin/login (Manual)
  ↓
Admin Login Form Submit
  ├─ API: POST /auth/login
  └─ Response: { message: "OTP sent" }
      ↓
Redirect to /otp?phone=...&admin=true&redirect=/dashboard/admin
  ↓
OTP Verification
  ├─ API: POST /auth/verify-otp
  └─ Response: { accessToken: "...", user: {...} }
      ↓
setToken() called
  ├─ localStorage.setItem('accessToken', token)
  └─ document.cookie = 'accessToken=...'
      ↓
login(userData) called
  ├─ localStorage.setItem('user', userData)
  └─ ❌ Token set نمی‌شود (قبلاً set شده)
      ↓
Redirect to /dashboard/admin
  ↓
Middleware Check (Server-side)
  ├─ Cookie موجود؟ → ❌ ممکن است نباشد!
  └─ Redirect to /login → 🔴 مشکل!
```

---

## 🎯 اقدامات فوری

### 1. اضافه کردن `/admin/login` به public routes
### 2. بهبود Cookie Setting
### 3. هماهنگ‌سازی Token در AuthContext
### 4. اضافه کردن Logging برای Debug

---

## 🔍 چک‌لیست Debug

- [ ] Cookie در browser set می‌شود؟
- [ ] Cookie در middleware خوانده می‌شود؟
- [ ] Token در localStorage موجود است؟
- [ ] Token در cookie موجود است؟
- [ ] Role در token درست است؟
- [ ] Redirect loop وجود دارد؟

---

## 📝 توصیه‌ها

1. **از یک منبع واحد استفاده کنید**: یا فقط cookie یا فقط localStorage
2. **Server-side و Client-side را هماهنگ کنید**
3. **Logging اضافه کنید** برای debug
4. **Error handling بهبود دهید**
5. **Token refresh mechanism اضافه کنید**

