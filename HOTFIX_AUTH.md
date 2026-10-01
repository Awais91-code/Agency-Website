# M08 Authentication Login Hotfix

This patch is for the M01-M08 project state.

## Why this hotfix exists

The original login action intentionally mapped every Supabase sign-in error to a generic
"Email or password is incorrect" message. That made local setup issues such as an unconfirmed
email look like a wrong password.

This hotfix:

- shows a dedicated message for unconfirmed email;
- logs the exact Supabase auth error in the development terminal;
- adds a local-only admin bootstrap/repair command;
- adds a local auth diagnosis command;
- fixes the Next.js smooth-scroll warning by declaring `data-scroll-behavior="smooth"`.

## Apply

Copy this ZIP into the existing M01-M08 project root and choose **Replace files in destination**.

No files need to be deleted or renamed.

## Recommended repair

Make sure local Supabase is running:

```powershell
npm run db:status
```

Then run:

```powershell
npm run auth:diagnose
```

Enter the exact email you created in Supabase Studio.

To repair/create the local super admin and set a known password:

```powershell
npm run auth:bootstrap-admin
```

Enter the same email and choose a new password of at least 10 characters.

The helper is hard-blocked from running against a non-local Supabase URL.

Then restart Next.js:

```powershell
npm run dev
```

Login at:

```text
http://localhost:3000/login
```
