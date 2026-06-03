# Admin CRM — Підключення Firestore та налаштування ролей

## Поточний стан

Admin-панель (`apps/admin`) зараз відображає **зразкові дані** (`sampleLeads`, `sampleStudents`).
Для роботи з реальними лідами потрібно:

1. Підключити Firebase Admin SDK
2. Налаштувати Firebase Auth + custom claims (`role: "admin"` / `"manager"`)
3. Додати auth guard (middleware або компонент)

---

## 1. Firebase Admin SDK

### Встановлення

```bash
cd apps/admin
npm install firebase-admin --workspace @lider/admin
```

### Ініціалізація (server-side)

Створіть `apps/admin/lib/firebase-admin.ts`:

```typescript
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const firebaseAdminApp =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    })
  });

export const adminDb = getFirestore(firebaseAdminApp);
export const adminAuth = getAuth(firebaseAdminApp);
```

### ENV (Firebase Console → Project Settings → Service accounts → Generate key)

```env
FIREBASE_PROJECT_ID=lider-avtoschool
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@lider-avtoschool.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

⚠ **Ніколи не комітьте service account JSON в git.**

---

## 2. Призначення ролі через Firebase Admin

Запустіть один раз (node script або Firebase Function):

```typescript
import { adminAuth } from "./lib/firebase-admin";

async function setAdminRole(uid: string) {
  await adminAuth.setCustomUserClaims(uid, { role: "admin" });
  console.log(`✅ Role 'admin' set for ${uid}`);
}

async function setManagerRole(uid: string) {
  await adminAuth.setCustomUserClaims(uid, { role: "manager" });
  console.log(`✅ Role 'manager' set for ${uid}`);
}

// Знайти UID по email:
async function getUidByEmail(email: string) {
  const user = await adminAuth.getUserByEmail(email);
  console.log(`UID for ${email}: ${user.uid}`);
  return user.uid;
}
```

Ролі перевіряються у Firestore rules та Storage rules через `request.auth.token.role`.

---

## 3. Auth Guard (Next.js Middleware)

Створіть `apps/admin/middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("__session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next|favicon.ico).*)"]
};
```

Сторінка `/login` перевіряє Firebase Auth token через `signInWithEmailAndPassword` і встановлює cookie.

---

## 4. Завантаження реальних лідів

Замість `sampleLeads` у `crm-workspace.tsx` — завантажуйте через Server Action або API route:

```typescript
// apps/admin/lib/leads.ts
import { adminDb } from "./firebase-admin";

export async function getLeads(limit = 100) {
  const snap = await adminDb.collection("leads").orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
```

---

## 5. Перевірка ролей

```typescript
// apps/admin/lib/roles.ts
import type { DecodedIdToken } from "firebase-admin/auth";

export function isAdmin(token: DecodedIdToken) {
  return token.role === "admin";
}

export function isStaff(token: DecodedIdToken) {
  return token.role === "admin" || token.role === "manager";
}
```

---

## Чек-лист до production

- [ ] Service account ключ додано у Vercel ENV (зашифровано)
- [ ] Принаймні один user отримав `role: "admin"` через Admin SDK
- [ ] Middleware блокує доступ без авторизації
- [ ] Реальні дані завантажуються з Firestore
- [ ] Sample data видалено або обгорнуто у `process.env.NODE_ENV === "development"`
- [ ] CSV export працює на реальних даних
