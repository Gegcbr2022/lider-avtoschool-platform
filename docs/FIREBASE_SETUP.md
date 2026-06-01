# Firebase Setup

1. Create Firebase projects for dev, staging and production.
2. Enable Authentication providers required by the business.
3. Enable Firestore and Storage.
4. Copy `.firebaserc.example` to `.firebaserc`.
5. Deploy rules:

```bash
firebase deploy --only firestore:rules,storage
```

6. Start local emulators:

```bash
npm --workspace @lider/api run dev
```

7. Configure custom claims for RBAC:

- `admin`
- `manager`
- `student`

Only staff can read leads and payment operations by default. Students can read and update their own student document scope.
