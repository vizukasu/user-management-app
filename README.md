# User Management App — деплой и сдача задания

Стек: React + Express + MySQL. Хостинг: Render.

## 1. Подготовка кода
1. Создайте репозиторий на GitHub (публичный) и залейте туда папку `project/` целиком
   (с `backend/` и `frontend/` как два каталога в корне репо).
2. Локально проверьте, что всё работает:
   ```
   cd backend && cp .env.example .env   # заполните реальными данными
   npm install
   # выполните backend/schema.sql в вашей MySQL базе (создаст таблицу + UNIQUE INDEX)
   npm start

   cd ../frontend && cp .env.example .env
   npm install
   npm run dev
   ```

## 2. База данных (MySQL)
На Render: New + → нет встроенного MySQL у Render бесплатно, поэтому проще всего:
- **PlanetScale** (бесплатный tier MySQL) — создайте базу, возьмите connection string.
- или **Railway / Aiven free tier MySQL**.
Выполните `backend/schema.sql` в консоли выбранного сервиса — это создаст таблицу
`users` и `UNIQUE INDEX ux_users_email`. Сохраните скриншот списка индексов
(`SHOW INDEX FROM users;`) — он понадобится для видео.

## 3. Backend на Render
1. render.com → New → Web Service → подключите ваш GitHub-репозиторий.
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment → добавьте переменные из `backend/.env.example`
   (DB_HOST/DB_USER/DB_PASSWORD/DB_NAME из вашего MySQL-хостинга,
   GMAIL_USER/GMAIL_APP_PASSWORD — см. ниже, JWT_SECRET — любая случайная строка,
   PUBLIC_APP_URL — URL этого же backend-сервиса после первого деплоя,
   PUBLIC_FRONTEND_URL — URL фронтенда, см. шаг 4).
6. Deploy. Проверьте `https://<ваш-backend>.onrender.com/api/health`.

### Gmail app password (для отправки писем)
1. Включите 2FA на Google-аккаунте.
2. https://myaccount.google.com/apppasswords → создайте пароль приложения.
3. Используйте обычный gmail-адрес как GMAIL_USER и сгенерированный пароль как GMAIL_APP_PASSWORD.

## 4. Frontend на Render
1. New → Static Site → тот же репозиторий.
2. Root Directory: `frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Environment → `VITE_API_URL=https://<ваш-backend>.onrender.com/api`
6. Render автоматически подхватит `public/_redirects` — благодаря этому
   прямые URL вроде `/register` будут открываться без 404.
7. После деплоя обновите `PUBLIC_FRONTEND_URL` в backend-сервисе на реальный адрес
   фронтенда и передеплойте backend.

## 5. Что нужно показать на видео (по заданию)
Запишите экран (любой screen recorder, например OBS) и пройдите по порядку:
1. Регистрация нового пользователя.
2. Открыть Gmail / почту, кликнуть на ссылку подтверждения (статус → active).
3. Login этим пользователем.
4. Выделить чекбоксом НЕ текущего пользователя → Block → показать, что статус обновился.
5. Тот же пользователь → Unblock → статус вернулся.
6. Выделить все пользователи, включая текущего → Block → показать, что система
   при следующем запросе (например, попытке обновить список) редиректит на /login
   с сообщением о блокировке.
7. Показать SHOW INDEX FROM users в вашей MySQL-консоли (или скриншот) — это
   обязательное требование задания.
8. Показать место в коде, которое ловит ошибку дубликата email
   (`backend/src/routes/auth.js`, блок `if (err.code === "ER_DUP_ENTRY")`)
   и продемонстрировать сообщение об ошибке в UI при повторной регистрации
   с тем же email.

## 6. Отправка решения
Письмо на **p.lebedev@itransition.com** должно содержать:
- Ваше полное имя.
- Ссылку на публичный репозиторий с кодом.
- Ссылку на задеплоенный фронтенд (например `https://your-frontend.onrender.com`).
- Видео (загрузите на YouTube как unlisted / на Google Drive с открытым доступом
  по ссылке и приложите ссылку — само видео обычно слишком большое для письма).

Дедлайн: 17.06.26.
