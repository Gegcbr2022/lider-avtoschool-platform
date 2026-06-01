# Запуск проекта с нуля

Эта инструкция для человека, который раньше не запускал такие проекты.

## 1. Откройте папку проекта

Откройте PowerShell и выполните:

```powershell
cd "C:\Users\Nice Try)\Downloads\Avtoschool_APP"
```

## 2. Установите зависимости

```powershell
npm install
```

## 3. Проверьте проект

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

## 4. Запустите сайт

```powershell
npm run dev:web
```

Откройте в браузере:

```text
http://localhost:3000
```

## 5. Запустите админ-панель

В новом окне PowerShell:

```powershell
npm run dev:admin
```

Откройте:

```text
http://localhost:3001
```

## 6. Запустите мобильное приложение

```powershell
npm run dev:mobile
```

Дальше Expo покажет QR-код или варианты запуска Android/iOS.
