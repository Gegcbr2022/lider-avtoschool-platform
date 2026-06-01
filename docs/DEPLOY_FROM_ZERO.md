# Запуск с нуля

## 1. Открыть проект

```powershell
cd "C:\Users\Nice Try)\Downloads\Avtoschool_APP"
```

## 2. Установить зависимости

```powershell
npm install
```

## 3. Создать окружение

```powershell
Copy-Item .env.example .env
```

Заполнить значения по `ENVIRONMENT.md`.

## 4. Проверить проект

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

## 5. Запустить сайт

```powershell
npm run dev:web
```

Открыть:

```text
http://localhost:3000
```

## 6. Запустить админку

```powershell
npm run dev:admin
```

Открыть:

```text
http://localhost:3001
```

## 7. Запустить мобильное приложение

```powershell
npm run dev:mobile
```

Дальше Expo покажет QR-код или варианты запуска Android/iOS.
