# Render Deployment: Private Login

## MongoDB Atlas

Use a dedicated Atlas database for this app. Keep the connection string in `backend/.env` locally and in Render's Environment settings; never commit `.env`.

## Set the Admin account

From the project root, run:

```powershell
npm run setup:admin -w backend
```

The command asks for an email and prompts for a new password without displaying it. It creates an Admin if none exists or updates the existing Admin. It does not reset assets or other application data.

## Render settings

The Blueprint keeps `DEMO_SEED=false`, `PUBLIC_DEMO=false`, and `VITE_PUBLIC_DEMO=false` so the deployed site uses email/password login. Set `MONGODB_URI` in Render. Render generates `JWT_SECRET` from `render.yaml`.

Build command: `npm ci --include=dev && npm run build`

Start command: `npm start`

After pushing the files, deploy the latest commit in Render. Then run the Admin setup command locally against the same Atlas database and sign in with the email/password you entered.