# AI Classroom API

FastAPI + raw PostgreSQL (psycopg2). No ORM. Pydantic for input only.

## Setup

```bash
cp .env.example .env          # fill in DB creds + SECRET_KEY
pip install -r requirements.txt
psql -U postgres -d ai_classroom -f migrations/001_create_users.sql
python main.py
```

Docs → http://localhost:8000/docs

## Auth routes  (`/api/v1/auth`)

| Method | Route              | Auth    | Description                        |
|--------|--------------------|---------|------------------------------------|
| POST   | `/register`        | No      | Register, returns tokens           |
| POST   | `/login`           | No      | Login, returns tokens              |
| POST   | `/refresh`         | No      | New access token via refresh token |
| POST   | `/logout`          | No      | Revoke refresh token               |
| POST   | `/logout-all`      | Bearer  | Revoke all sessions                |
| GET    | `/me`              | Bearer  | Get current user                   |
| PUT    | `/me`              | Bearer  | Update full_name                   |
| PUT    | `/change-password` | Bearer  | Change password, revoke sessions   |

## Structure

```
ai_classroom/
├── main.py                  # app + routes included here
├── app/
│   ├── core/
│   │   ├── config.py        # settings
│   │   ├── security.py      # JWT + bcrypt
│   │   └── dependencies.py  # get_current_user
│   ├── db/
│   │   └── connection.py    # psycopg2 pool + get_db
│   ├── schemas/
│   │   └── auth.py          # pydantic input models only
│   ├── services/
│   │   └── auth_service.py  # SQL lives here directly
│   └── routers/
│       └── auth.py          # thin route handlers
└── migrations/
    └── 001_create_users.sql
```
