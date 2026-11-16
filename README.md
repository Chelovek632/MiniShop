# MiniShop

Небольшой интернет-магазин канцелярии Dunder Mifflin — да, того самого из «Офиса».
Фуллстек без лишнего: C# на бэке, обычный JS на фронте, без React и прочей магии.

## Что внутри

- `MiniShop/` — backend: ASP.NET Core Web API (.NET 8), EF Core, PostgreSQL
- `MiniShop.Front/` — frontend: чистые HTML/CSS/JS + Bootstrap 5, роутинг на хешах (`#login`, `#cart`...)
- `MiniShop.Tests/` — xUnit-тесты (SQLite in-memory)
- `docker-compose.yml` — чтобы поднять всё одной командой
- `.github/workflows/ci.yml` — CI: build + тесты + проверка синтаксиса JS

## Стек

- ASP.NET Core 8 Web API
- EF Core + Npgsql (PostgreSQL)
- JWT-авторизация, пароли через BCrypt
- Rate limiting на auth-эндпоинты, единый error middleware
- Swagger для проверки эндпоинтов
- Vanilla JS + Bootstrap 5 на фронте (никаких сборщиков)
- xUnit + SQLite для тестов бизнес-логики

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

### Тесты

```bash
dotnet test MiniShop.Tests
```

29 тестов: валидация регистрации/логина, адрес заказа, транзакционное списание
стока, переходы статусов, категории, поиск/пагинация, удаление ссылочных товаров.

## Как всё устроено

### Роли

- **Customer** — обычный юзер: смотрит каталог, кидает в корзину, оформляет заказы, оплачивает (демо), меняет пароль
- **Admin** — админка: товары и категории, загрузка картинок, все заказы и статусы

Регистрация создаёт обычного пользователя. Стать админом можно двумя способами:

1. **Seed при старте** — задайте `Seed:AdminLogin` / `Seed:AdminPassword`
   (в `.env` для Docker: `Seed__AdminLogin`, `Seed__AdminPassword`); при старте
   создастся админ, если такого логина ещё нет;
2. Вручную: в базе поменять юзеру `Role` с `Customer` на `Admin` и войти заново.

### Эндпоинты (кратко)

- `POST /api/Account/register`, `POST /api/Account/login` — без токена, rate limit 10/10с
- `POST /api/Account/changePassword` — смена пароля, нужен токен
- `GET /api/Product/all?search=&category=&page=&pageSize=` — каталог без токена,
  ответ `{items, total, page, pageSize}`
- `GET /api/Product/{id}` — товар, нужен токен
- `POST /api/Product/create`, `PUT /api/Product/update/{id}`, `DELETE /api/Product/delete/{id}` — только Admin
- `POST /api/Product/upload` — загрузка картинки (jpg/png/webp/gif, ≤5 МБ) → `/uploads/...`, только Admin
- `GET /api/Category/all` — категории без токена; `POST /api/Category/create`, `DELETE /api/Category/delete/{id}` — Admin
- `POST /api/Cart/create`, `GET /api/Cart/getCart`, `DELETE /api/Cart/clear` — корзина, у каждого юзера она одна
- `POST /api/Orders/create`, `GET /api/Orders/getorders`, `GET /api/Orders/{id}` — заказы
- `POST /api/Orders/{id}/pay` — демо-оплата своего заказа (`Pending → Paid`)
- `GET /api/Orders/all`, `PUT /api/Orders/{id}/status` — только Admin
- `GET /health` — проверка живости сервиса

Swagger: http://localhost:5000/swagger

### Пара деталей

- JWT живёт 3 часа; если протух — фронт сам поймает 401 и кинет на логин
- Адрес заказа валидируется: нужен город, улица и номер дома
- Статусы заказа: `Pending → Paid → Shipped → Delivered` (или `Canceled`)
- Ошибка всегда в формате `{"error": "..."}` — бизнес-ошибки 400/404,
  неожиданные исключения 500 без деталей (в логах)
- Загруженные картинки лежат в `MiniShop/wwwroot/uploads/` (в git не попадают)
- Поиск по товарам регистронезависимый (включая кириллицу)
- Адрес API захардкожен в JS-файлах (`http://localhost:5000`) — при деплое меняется на нужный домен
