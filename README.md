# server

FastAPI + SQLite: очередь команд для manager, API /api/* и сборка сайта (React).

- Настройка: Copy-Item .env.example .env, задать ACCESS_KEY.
- Фронтенд: npm --prefix frontend install; npm --prefix frontend run build.
- Запуск (из корня Yeelight-Main): .\.venv\Scripts\python -P -m server (http://127.0.0.1:8000).
- Тесты: .\.venv\Scripts\python -P -m pytest server\tests
