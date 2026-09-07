# Production deployment

This app can run with Vercel plus a free GitHub Actions worker, or with a persistent worker service:

- **Vercel** runs the Next.js web app and API routes.
- **GitHub Actions** can run one render pass every five minutes for free on a public repository.
- **Railway or Render** can run the persistent worker if you need immediate processing.
- **Neon or Supabase** provides PostgreSQL.
- **Cloudinary, Cloudflare R2, or S3** stores rendered videos, thumbnails, and uploaded music.

## 1. Create PostgreSQL

Create a production database and copy its connection string. It should usually include `sslmode=require`.

Set `DATABASE_URL` in both Vercel and the worker service, then apply the schema once from your machine:

```bash
DATABASE_URL="your-production-url" npx drizzle-kit push
```

The Drizzle config reads `DATABASE_URL`; it no longer points at the local database.

## 2. Create object storage

Cloudinary is supported for a card-free setup. Add these variables in both Vercel and the worker service:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

When Cloudinary is configured, it takes priority over R2 and stores videos, thumbnails, and uploaded music. Keep the API secret private.

Alternatively, use R2/S3:

Create a private R2/S3 bucket. Create an access key limited to that bucket and set these variables in both services:

```env
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=aiv2-media
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=false
```

The app keeps local disk as a development fallback. When all five S3 variables are present, rendered files and uploaded music use object storage automatically.

## 3. Deploy the web app to Vercel

Import the repository into Vercel and add the variables from `.env.example` under **Settings > Environment Variables**. Set `DATABASE_URL`, all `S3_*` variables, and any Google OAuth variables you use.

Build command:

```bash
npm run build
```

Vercel does not run the render worker. The API only creates or updates queued database rows there.

Vercel Hobby does not support a frequent cron schedule. Use the GitHub Actions worker below to process queued renders every five minutes, or use a persistent worker service. The `/api/cron` endpoint remains available for manual triggering or a Vercel Pro cron configuration. Set `CRON_SECRET` in Vercel if you expose that endpoint.

## 4. Deploy the worker

### Free option: GitHub Actions

The repository includes `.github/workflows/render-worker.yml`. In GitHub, open **Settings > Secrets and variables > Actions** and add these repository secrets:

```text
DATABASE_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

The workflow runs every five minutes and can also be started manually from the **Actions** tab. It processes queued work once and exits. This is suitable for a public GitHub repository; queued videos may wait up to five minutes before processing.

### Paid or trial option: persistent worker

Create a Railway/Render service from the same repository. Add the same `DATABASE_URL` and `S3_*` variables. Use:

```bash
npm install
npm run worker
```

The worker polls PostgreSQL, renders with FFmpeg and the configured voice engines, uploads the MP4 and thumbnail to object storage, and marks the row `ready`. Studio Voices (Aria, Nicole, Adam, and Fable) use the remote Kokoro API configured by `VOXLAB_STUDIO_API_URL`; stock voices continue to use the existing local path. It also handles scheduled automation and YouTube posting.

## 5. OAuth callback

In Google Cloud Console, add this exact redirect URI:

```text
https://YOUR-VERCEL-DOMAIN/api/youtube/callback
```

Set the same production domain in the OAuth client configuration. Do not use the worker URL for this callback.

## Local development

Keep `.env.local` for the local PostgreSQL URL. Do not commit it. Copy `.env.example` when configuring another environment:

```bash
cp .env.example .env.local
npm run db:push
npm run dev
```