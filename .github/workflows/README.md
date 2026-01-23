# GitHub Actions Workflows

## Workflows in This Repository

### 1. Build and Push Docker Image (`build-and-push.yml`)

**What it does:**
- Builds Docker image from `packages/backend/`
- Pushes to GitHub Container Registry (GHCR)
- Tags as `latest` and `main-<commit-sha>`

**Triggers on:**
- ✅ Push to `main` branch
- ✅ Changes in `packages/backend/` source code
- ✅ Changes to Dockerfile
- ✅ Changes to package.json or package-lock.json
- ✅ Changes to TypeScript files (.ts)
- ✅ Changes to this workflow file

**Does NOT trigger on:**
- ❌ Documentation changes (*.md files)
- ❌ Text file changes (*.txt files)
- ❌ Postman collection changes
- ❌ Changes outside `packages/backend/`
- ❌ Changes to other packages (web, shared)

**Manual trigger:**
- Go to Actions tab → "Build and Push Docker Image" → Run workflow

**Duration:** ~2-5 minutes

---

### 2. Deploy to Railway (`deploy-backend.yml`)

**What it does:**
- Waits for "Build and Push" to complete successfully
- Deploys new image to Railway

**Triggers on:**
- ✅ After "Build and Push Docker Image" succeeds
- ✅ Manual trigger (workflow_dispatch)

**Requirements:**
- `RAILWAY_TOKEN` secret must be set in GitHub

**Duration:** ~1-2 minutes

---

## Workflow Sequence

```
Push code to main
    ↓
Does it include backend changes?
    ↓ YES (triggers build)
Build Docker Image (2-5 min)
    ↓
Push to GHCR
    ↓
Trigger Deploy Workflow
    ↓
Deploy to Railway (1-2 min)
    ↓
Done! ✅
```

---

## Examples

### ✅ These Changes Trigger Build

```bash
# Edit source code
vim packages/backend/src/index.ts
git push

# Update dependencies
vim packages/backend/package.json
git push

# Change Dockerfile
vim packages/backend/Dockerfile
git push

# Update API routes
vim packages/backend/src/api/routes.ts
git push
```

### ❌ These Changes Do NOT Trigger Build

```bash
# Update documentation
vim packages/backend/README.md
git push

# Update deployment docs
vim packages/backend/DEPLOYMENT.md
git push

# Update Postman collection
vim packages/backend/*.postman_collection.json
git push

# Change frontend code
vim packages/web/src/App.tsx
git push
```

---

## Manual Workflow Triggers

### Build Image Manually

1. Go to GitHub → Actions
2. Select "Build and Push Docker Image"
3. Click "Run workflow"
4. Choose branch (main)
5. Click "Run workflow"

### Deploy Manually

1. Go to GitHub → Actions
2. Select "Deploy Backend to Railway"
3. Click "Run workflow"
4. Click "Run workflow"

---

## Debugging Failed Workflows

### Build Fails

**Check:**
1. GitHub Actions logs for error messages
2. Does Dockerfile build locally?
   ```bash
   cd packages/backend
   docker build -t test .
   ```
3. Are all dependencies in package.json?

### Deploy Fails

**Check:**
1. Is `RAILWAY_TOKEN` secret set?
2. Did the build workflow succeed first?
3. Check Railway dashboard for deployment logs

---

## Workflow Permissions

### GITHUB_TOKEN

**Automatically provided by GitHub Actions**

**Permissions used:**
- `contents: read` - Read repository code
- `packages: write` - Push to GitHub Container Registry

**No setup required!**

### RAILWAY_TOKEN

**Must be manually added**

**Setup:**
1. Railway → Account Settings → Tokens
2. Create new token
3. GitHub → Settings → Secrets → New secret
4. Name: `RAILWAY_TOKEN`
5. Value: paste token

---

## Cost & Usage

### GitHub Actions Minutes

**Free tier:** 2,000 minutes/month

**This workflow uses:** ~5-7 minutes per build

**Estimate:** ~300-400 builds/month on free tier

### GitHub Packages Storage

**Free tier:** Unlimited for public repositories

**This workflow:** Stores ~50-100MB per image

**Old images auto-expire:** Configure in package settings

---

## Configuration

### Change Build Frequency

Want to build less often? Edit `build-and-push.yml`:

```yaml
on:
  push:
    branches:
      - main
      - production  # Only build on production branch
```

### Build on Tags

Want to build on tags instead?

```yaml
on:
  push:
    tags:
      - 'v*'  # Build on v1.0.0, v1.1.0, etc.
```

### Disable Auto-Deploy

Don't want auto-deploy? Remove or disable `deploy-backend.yml`.

Build will still happen, but won't auto-deploy to Railway.

---

## Monitoring

### View Workflow Runs

GitHub → Actions tab → Shows all runs

### View Build Artifacts

GitHub Profile → Packages → backend → See all versions

### Railway Deployments

Railway dashboard → Deployments tab → See all deploys

---

## Best Practices

### ✅ Do

- Test Docker builds locally before pushing
- Use meaningful commit messages
- Monitor workflow success/failure
- Clean up old images periodically

### ❌ Don't

- Commit secrets to workflows (use GitHub Secrets)
- Build on every branch (main only is fine)
- Keep unlimited old images (configure retention)

---

## Troubleshooting

### "Workflow does not have access to packages"

**Fix:** Repo settings → Actions → General → Workflow permissions → "Read and write permissions"

### "Image push failed: denied"

**Fix:** Make sure you're pushing to main branch, not a fork

### "Railway token invalid"

**Fix:** Re-create Railway token and update GitHub secret

---

## References

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Build Action](https://github.com/docker/build-push-action)
- [Railway CLI Docs](https://docs.railway.app/develop/cli)
