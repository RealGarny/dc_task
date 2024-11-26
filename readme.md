# Задание прямого контакта.

## Инструкция

перед запуском необходимо заполнить файл cfg.json

```bash
  API_BASE_URL - корневая ссылка API.
  API_USERNAME - имя пользователя. Если пользователя не существует, скрипт создаст нового пользователя.
  GOOGLE_API_KEY_PATH - полный путь до json файла service аккаунта google.
  GOOGLE_SPREADSHEET_ID - id таблицы.
  GOOGLE_SPREADSHEET_NAME - название таблицы.
  GOOGLE_SPREADSHEET_START_CELL - начальная клетка для вставки.
  USERS_PER_REQUEST - количество пользвователей, отправляемых в одном запросе.
```

Далее окрываем проект через консоль и вводим следующие комманды:

```bash
  npm install
  npm run build
  npm run start
```
