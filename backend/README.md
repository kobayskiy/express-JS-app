## Backend (Express + Prisma + JWT)

### Запуск

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

По умолчанию сервер стартует на `http://localhost:3000`.

### Авторизация

- **POST** `/api/auth/register` `{ "username": "...", "email": "...", "password": "..." }` → `{ token, user }`
- **POST** `/api/auth/login` `{ "email": "...", "password": "..." }` → `{ token, user }`
- **GET** `/api/auth/me` (Header `Authorization: Bearer <token>`) → `{ user }`

### Posts CRUD

- **GET** `/api/posts`
- **GET** `/api/posts/:id`
- **POST** `/api/posts` (auth) `{ "title": "...", "content": "..." }`
- **PUT** `/api/posts/:id` (auth, только автор) `{ "title"?: "...", "content"?: "..." }`
- **DELETE** `/api/posts/:id` (auth, только автор)

### Messages CRUD

- **GET** `/api/messages`
- **GET** `/api/messages/:id`
- **POST** `/api/messages` (auth) `{ "text": "..." }`
- **PUT** `/api/messages/:id` (auth, только автор) `{ "text"?: "..." }`
- **DELETE** `/api/messages/:id` (auth, только автор)

