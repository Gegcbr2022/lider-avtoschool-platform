# GitHub Publish

The local repository is initialized on `main` and has the first commit:

```bash
7f93d59 Initial production platform scaffold
```

The Git remote is now configured:

```text
https://github.com/Gegcbr2022/lider-avtoschool-platform.git
```

GitHub CLI is still not installed on this machine. The GitHub plugin also cannot read the repository through GitHub API, likely because the repository is private or the plugin has no access.

## Option A - GitHub CLI

Install GitHub CLI, authenticate, create the repository and push:

```bash
winget install --id GitHub.cli
gh auth login
gh repo view Gegcbr2022/lider-avtoschool-platform
git push -u origin main
```

Use `--public` instead of `--private` only if the repository may be public.

## Option B - Existing GitHub Repository

If the remote is ever missing, create an empty repository on GitHub, then run:

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

After the remote exists, GitHub Actions in `.github/workflows` will run on pushes and pull requests.
