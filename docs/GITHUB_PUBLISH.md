# GitHub Publish

The local repository is initialized on `main` and has the first commit:

```bash
90e8d9b Initial production platform scaffold
```

GitHub publishing is currently blocked because GitHub CLI is not installed on this machine and no remote repository is configured.

## Option A - GitHub CLI

Install GitHub CLI, authenticate, create the repository and push:

```bash
winget install --id GitHub.cli
gh auth login
gh repo create lider-avtoschool-platform --private --source . --remote origin --push
```

Use `--public` instead of `--private` only if the repository may be public.

## Option B - Existing GitHub Repository

Create an empty repository on GitHub, then run:

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

After the remote exists, GitHub Actions in `.github/workflows` will run on pushes and pull requests.
