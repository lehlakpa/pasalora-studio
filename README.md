# Pasalora Studio

React storefront editor with Cloudinary image uploads and MongoDB design persistence.

## Run

Use Node.js 22 LTS for local development, or Docker Desktop with Linux containers.

## Project layout

```text
frontend/                 React source, Vite config, package files
  src/
  Dockerfile              Builds React, serves the bundle with Nginx
  nginx.conf              Static files and /api reverse proxy
backend/                  Express API and its package files
  .env                    Your existing MongoDB / Cloudinary credentials
  Dockerfile              Node API running as a non-root user
compose.yaml              Runs both services together
package.json              Convenience commands for the project
```

## Docker

Keep the existing `backend/.env` in place. For a new checkout, copy `backend/.env.example` to `backend/.env` and fill in your credentials.

From the project root:

```sh
docker compose up --build -d
```

Open **http://localhost:8080**. Both containers have health checks. The frontend proxies `/api` to the backend over the Compose network; the backend has no published host port. Compose overrides the backend's internal port to 4000, independent of the local-development PORT value.

The customer storefront is at `/`; the editor is at `/admin` (for example, `http://localhost:8080/admin`). The storefront always reads the design saved in MongoDB. It never displays the admin's local draft or falls back to demo products when the API is unavailable. It shows a loading, retry or coming-soon state instead. The admin route is a local editor route, not an authentication boundary.

```sh
docker compose ps
docker compose logs -f
docker compose down
```

`npm run docker:up`, `npm run docker:down` and `npm run docker:logs` are equivalent shortcuts. Re-run the up command with `--build` after code changes. This setup uses production images, so source files are not bind-mounted and changes do not hot reload.

MongoDB and Cloudinary remain the external services configured in your `.env`; no separate MongoDB container or data migration is needed. Secrets are injected at runtime and excluded from both build contexts. If MongoDB is unavailable, check the connection string and your database network access rules. `/api/health` reports the database and Cloudinary configuration status; Docker's API health check tests process availability so you can still use the editor while a service is unavailable.

Only localhost port 8080 is published. This remains a local single-user studio; public access requires authentication and authorization.

## Local development (without Docker)

```sh
npm run setup
npm run dev
```

The root `npm run dev` command starts both the API and frontend (or reuses an already-running instance). Keep that terminal open. Open `http://localhost:5173/` or `http://localhost:5173/admin`. Restart this command after backend code or environment changes. To run separately, use `npm run dev:api` and `npm run dev:frontend` in two terminals. Build with `npm run build`; output is `frontend/dist`.

The frontend proxies `/api` to PORT from `backend/.env`. Backend configuration: MONGO_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, PORT. Secrets stay server-side; do not prefix them with VITE_. Environment files are ignored by Git.

## Editing

Open `/admin`, select a product or hero layer, then Upload an image. Drag/drop supports JPEG, PNG and WebP up to 8 MB. Uploading stores the photo in Cloudinary and then automatically saves the updated design to MongoDB. If database persistence fails, the URL remains in the local draft; use Save design to retry without uploading again. Photos appear throughout the storefront and cart. The single e-commerce template has illustrative sample photography; replace it with your own images.

Save design writes other editor changes to MongoDB. Refresh `/` to see the saved result. Opening `/admin` loads the database version. Store settings > Restore local draft recovers your browser's previous draft; Save design publishes it to the storefront. Store settings > Load saved design fetches the database version again. Undo restores the previous draft. Browser autosave runs after local edits and does not replace an existing draft merely by opening the admin route.

The backend retries an initially failed MongoDB connection every 10 seconds. Cloudinary upload errors and database save errors are reported separately. To run regression checks: `npm run test --prefix frontend`.

Removing an image detaches it without deleting the Cloudinary asset, preserving Undo and other references. Import/export, resizing, device previews and demo checkout remain available.

## API

GET /api/health, GET /api/store, PUT /api/store, POST /api/uploads (multipart field: image). One design is stored in the StudioDesign MongoDB collection.

The API binds to loopback for local single-user use. Public hosting requires authentication, authorization, rate limits and a same-origin reverse proxy for /api. A static Vite deployment alone cannot run the API. Cloudinary status indicates configuration, not continuous availability.

Payments, orders and newsletter submissions remain demos.
