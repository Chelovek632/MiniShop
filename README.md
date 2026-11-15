# MiniShop

Небольшой интернет-магазин канцелярии Dunder Mifflin — да, того самого из «Офиса».
Фуллстек без лишнего: C# на бэке, обычный JS на фронте, без React и прочей магии.

## Что внутри

- `MiniShop/` — backend: ASP.NET Core Web API (.NET 8), EF Core, PostgreSQL
- `MiniShop.Front/` — frontend: чистые HTML/CSS/JS + Bootstrap 5, роутинг на хешах (`#login`, `#cart`...)
- `docker-compose.yml` — чтобы поднять всё одной командой

## Стек

- ASP.NET Core 8 Web API
- EF Core + Npgsql (PostgreSQL)
- JWT-авторизация, пароли через BCrypt
- Swagger для проверки эндпоинтов
- Vanilla JS + Bootstrap 5 на фронте (никаких сборщиков)

## Как запустить

### Вариант 1 — Docker (простой)

1. Скопируйте `.env.example` в `.env` и заполните (`POSTGRES_PASSWORD`, `JWT_KEY`):
   ```bash
   cp .env.example .env
   # JWT_KEY можно сгенерировать:
   #   python -c "import secrets; print(secrets.token_hex(48))"
   ```
2. Поднять всё одной командой:
   ```bash
   docker compose up --build
   ```

- фронт: http://localhost:5500
- API: http://localhost:5000
- база внутри compose-сети (наружу порт 5432 не публикуется)

### Вариант 2 — без Docker

1. Нужен PostgreSQL на `localhost:5432` (логин/пароль задаются в `MiniShop/appsettings.json`)
2. Задать JWT-секрет (один раз, хранится локально в user-secrets, в репозиторий не попадает):
   ```bash
   dotnet user-secrets set "Jwt:Key" "<минимум 32 символа>" --project MiniShop
   ```
3. Накатить миграции:
   ```bash
   dotnet tool install --global dotnet-ef   # если ещё нет
   dotnet ef database update
   ```
4. Запустить API:
   ```bash
   dotnet run --project MiniShop
   ```
   Поднимется на http://localhost:5000
5. Отдать фронт любым статическим сервером на порту **5500**, например:
   ```bash
   npx serve -l 5500 MiniShop.Front
   ```
   Важно: CORS в `Program.cs` разрешает ровно `localhost:5500` / `127.0.0.1:5500` — другой порт не пройдёт.

## Как всё устроено

### Роли

- **Customer** — обычный юзер: смотрит каталог, кидает в корзину, оформляет заказы, смотрит свои заказы в профиле
- **Admin** — админка: добавляет/редактирует/удаляет товары, видит все заказы и меняет им статусы

Регистрация создаёт обычного пользователя. Чтобы стать админом — в базе поменяй своему юзеру `Role` с `Customer` на `Admin` и войди заново.

### Эндпоинты (кратко)

- `POST /api/Account/register`, `POST /api/Account/login` — без токена
- `GET /api/Product/all` — каталог, тоже без токена
- `GET /api/Product/{id}` — товар, нужен токен
- `POST /api/Product/create`, `PUT /api/Product/update/{id}`, `DELETE /api/Product/delete/{id}` — только Admin
- `POST /api/Cart/create`, `GET /api/Cart/getCart`, `DELETE /api/Cart/clear` — корзина, у каждого юзера она одна
- `POST /api/Orders/create`, `GET /api/Orders/getorders`, `GET /api/Orders/{id}` — заказы
- `GET /api/Orders/all`, `PUT /api/Orders/{id}/status` — только Admin

Swagger: http://localhost:5000/swagger

### Пара деталей

- JWT живёт 3 часа; если протух — фронт сам поймает 401 и кинет на логин
- Адрес заказа валидируется: нужен город, улица и номер дома
- Статусы заказа: `Pending → Paid → Shipped → Delivered` (или `Canceled`)
- Адрес API захардкожен в JS-файлах (`http://localhost:5000`) — при деплое меняется на нужный домен
