# GitHub Status

Дата проверки: 2026-06-01

## Итог

GitHub remote в локальном Git настроен:

```text
https://github.com/Gegcbr2022/lider-avtoschool-platform.git
```

Локальная ветка:

```text
main
```

Последний известный коммит:

```text
7f93d59 Initial production platform scaffold
```

`git ls-remote --heads origin` успешно видит ветку `main`, значит обычный Git-доступ к remote работает.

## Проблема

GitHub-плагин Codex не видит репозиторий через GitHub API и возвращает `404 Not Found`.

Что это значит простыми словами:

- репозиторий может быть приватным;
- GitHub-плагин не установлен на этот репозиторий;
- текущая сессия не имеет прав GitHub API на `Gegcbr2022/lider-avtoschool-platform`.

## Дополнительная проблема

На компьютере не установлен GitHub CLI:

```text
gh: command not found
```

Из-за этого нельзя полноценно управлять GitHub из терминала: создавать релизы, смотреть workflow, открывать PR через `gh`.

## Что нужно сделать пользователю

1. Открыть GitHub.
2. Проверить, что репозиторий `Gegcbr2022/lider-avtoschool-platform` существует.
3. Если репозиторий приватный, дать доступ GitHub-плагину Codex.
4. Установить GitHub CLI:

```powershell
winget install --id GitHub.cli
```

5. Авторизоваться:

```powershell
gh auth login
```

6. После этого проверить:

```powershell
gh auth status
gh repo view Gegcbr2022/lider-avtoschool-platform
```

## Статус

| Проверка | Статус |
| --- | --- |
| Локальный Git repo | PASS |
| Remote origin | PASS |
| `git ls-remote` | PASS |
| GitHub-плагин API | FAIL |
| GitHub CLI | FAIL |
| GitHub Actions через API | NOT CHECKED |
| Release через GitHub | NOT CHECKED |
