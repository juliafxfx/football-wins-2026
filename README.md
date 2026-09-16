# 2026 Football Wins Draft — GitHub Pages version

This version does **not** use Netlify.

It uses:
- GitHub Pages for the website
- GitHub Actions for automatic updates every 6 hours
- Big Balls Sports Data for current NFL and NCAAF records
- A GitHub Actions secret named `BIGBALLS_API_KEY`

The API key is never included in `index.html` or `data.json`.

## One-time setup

### 1. Create a GitHub repository
Create a new **public** repository, for example `football-wins-2026`.

### 2. Upload this whole folder
Upload every file/folder from this package, including:
- `index.html`
- `data.json`
- `.nojekyll`
- `scripts/update-data.mjs`
- `.github/workflows/update-football.yml`

Hidden folders matter: `.github` must be uploaded too.

### 3. Add your Big Balls API key as a repository secret
In the GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

Name:
`BIGBALLS_API_KEY`

Value:
Your existing key beginning with `bbs_live_`

Do not put the key in any file or commit.

### 4. Run the updater once
Go to:

**Actions → Update Football Wins → Run workflow → Run workflow**

Wait for a green check mark. The workflow writes `data.json` and commits it back to the repository.

### 5. Turn on GitHub Pages
Go to:

**Settings → Pages**

Under **Build and deployment** choose:
- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/(root)**

Save.

GitHub will show the permanent website address after Pages finishes publishing.

## Automatic updates
The workflow runs every 6 hours. You can also run it manually at any time from the Actions tab.

## Safety behavior
- The site has no browser API key.
- There is no localStorage score cache.
- If the API returns incomplete/unexpected standings or a team cannot be matched, the updater fails and does not overwrite `data.json`.
- The updater verifies the API key first using `/v1/user/me`.
- It reads NFL and NCAAF records from `/v1/standings` rather than scraping individual game pages.

## If an Action fails
Open the failed Actions run and copy the red error line. The error is intentionally specific (authentication, season, partial data, or unmatched team), so it can be fixed without guessing.
