# Deploy Admin (CI/CD)

Publishes the **pharma-supply** admin SPA from this repo based on branch:

| Branch | Environment | Admin URL | API URL (build-time) |
|--------|-------------|-----------|----------------------|
| `main` | production | https://admin.idealdistributor.com.pk | https://api.idealdistributor.com.pk |
| `develop` | staging | https://mds.vtoxi.com | https://mds.vtoxi.com |

Workflow file: [`.github/workflows/deploy-admin-idealdistributor.yml`](.github/workflows/deploy-admin-idealdistributor.yml)

## How it runs

1. **Trigger:** push to `main` or `develop` (client, deploy, build config, or workflow paths), or **Actions → Deploy Admin → Run workflow**
2. Resolve target from branch (`main` → production, `develop` → staging); manual runs can override
3. `pnpm install` + `pnpm build` with `VITE_API_BASE_URL` for the target API
4. Copy `deploy/web.config` into `dist/` for IIS SPA routing
5. Upload `dist/` to the admin site via **FTP**
6. Smoke-check the admin URL

## One-time: GitHub secrets

In [pharma-supply](https://github.com/idrees04/pharma-supply) → **Settings → Secrets and variables → Actions → New repository secret**:

### Production (`main` → admin.idealdistributor.com.pk)

| Secret | Required | Example / notes |
|--------|----------|-----------------|
| `FTP_PASSWORD` | **Yes** | FTP password for user `arsal` |
| `FTP_HOST` | No | Defaults to `ftp.idealdistributor.com.pk` |
| `FTP_USER` | No | Defaults to `arsal` |
| `FTP_REMOTE_ADMIN` | No | Defaults to `/admin.idealdistributor.com.pk` |

### Staging (`develop` → mds.vtoxi.com)

| Secret | Required | Example / notes |
|--------|----------|-----------------|
| `FTP_PASSWORD_DEVELOP` | **Yes** | FTP password for user `vtoxico3` |
| `FTP_HOST_DEVELOP` | No | Defaults to `ftp.vtoxi.com` |
| `FTP_USER_DEVELOP` | No | Defaults to `vtoxico3` |
| `FTP_REMOTE_ADMIN_DEVELOP` | No | Defaults to `/public_html` |

Use the **same FTP secrets** as the backend repo if both deploy from the same hosting account.

Do **not** commit passwords into the repo.

## First run

1. Add `FTP_PASSWORD` (production) and `FTP_PASSWORD_DEVELOP` (staging)
2. Open **Actions** → **Deploy Admin** → **Run workflow** (pick branch or environment)
3. Confirm the job is green and https://admin.idealdistributor.com.pk loads

After that:

- merges/pushes to `main` that touch the frontend deploy to Ideal Distributor admin
- merges/pushes to `develop` deploy to mds.vtoxi.com

## Local deploy (unchanged)

From the MDS monorepo (if you use the PowerShell scripts):

```powershell
cd D:\Arslan\MDS\scripts\deploy
.\build-frontend.ps1
.\deploy-frontend.ps1
```
