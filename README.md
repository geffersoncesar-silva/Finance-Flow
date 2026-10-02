# React + TypeScript + Vite

## Authentication setup

Authentication uses Supabase Auth with email and password. Create a Supabase project, enable email authentication, and add the local development URL (for example `http://localhost:5173/login`) to the Supabase Auth redirect allow list.

Copy `.env.example` to `.env.local`, then set:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Restart the Vite server after changing environment variables. `.env.local` is ignored by Git. Only use the Supabase publishable/anon key in the browser; never expose a service-role key.

The app protects its routes with the Supabase session and keeps finance data in browser storage namespaced by user ID. Existing single-user local data is moved to the first account that signs in on that browser. Browser storage is not encrypted and is not protected from other users of the same browser profile. Finance data does not sync between devices; production server-side privacy requires a database schema with Row Level Security policies.

## Publish with GitHub and Vercel

### 1. Push this project to GitHub

Create an empty repository on GitHub. Do not add a README or `.gitignore` there, because this project already has both. From this project folder, run:

```powershell
git init
git add .
git status --short
```

Confirm `.env.local` is not listed. Then commit and connect the new GitHub repository:

```powershell
git commit -m "Initial application"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

Replace the remote URL with the one shown by GitHub. `.env.example` is safe to commit because the browser uses only the Supabase publishable key. Never add a Supabase secret/service-role key to `VITE_*` variables or Git.

### 2. Deploy on Vercel

In Vercel, choose **Add New Project**, import the GitHub repository, and keep the Vite defaults:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Add these environment variables in the Vercel project settings for **Production**, **Preview**, and **Development**:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Use the corresponding values from the Supabase project's API settings. Save, then deploy or redeploy. Vercel does not read `.env.local` from your computer.

### 3. Allow the deployed URLs in Supabase

In Supabase, open **Authentication > URL Configuration**. Set **Site URL** to the production Vercel URL, then add redirect URLs for local development, production, and any preview domain you plan to use:

```text
http://localhost:5173/login
https://SEU-PROJETO.vercel.app/login
https://SEU-DOMINIO/login
```

Use your real deployment/domain URLs. After configuring these URLs and the Vercel variables, test account creation, email confirmation, login, password reset, and logout on the deployed site. The Vercel rewrite config keeps direct visits and refreshes on `/login` and other app routes working.

For local development, copy `.env.example` to `.env.local`, verify the variable names and values, and restart `npm run dev`.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
