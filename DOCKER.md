# Docker — Setup, Postgres, and the Patterns You Actually Need

A single reference for running services (mostly Postgres) under Docker for backend development. Written so the next project in this repo can copy a `docker-compose.yml` and know exactly why each line is there.

> Read this when starting any project that needs a database, cache, queue, or any "infrastructure" component. The goal: never install Postgres/Redis/Mongo on the host machine again.

---

## 1. Why Docker for backend dev

| Without Docker | With Docker |
|----------------|-------------|
| Install Postgres on the OS, hope versions match prod | `docker compose up -d`, exact version pinned |
| Two projects fighting over port 5432 | Each project gets its own container, mapped to whatever port |
| "Works on my machine" because of system libs | Same image runs identically across teammates / CI / cloud |
| Uninstalling = orphan files everywhere | `docker compose down -v` wipes everything |
| Hard to test against multiple DB versions | Swap a tag, restart |

The trade-off is one extra command (`docker compose up -d`) and learning a small vocabulary. It pays back forever.

---

## 2. The minimum vocabulary

| Term | What it means |
|------|---------------|
| **Image** | Read-only template (e.g. `postgres:18.3`). Pulled from a registry (Docker Hub by default). |
| **Container** | A running instance of an image. Ephemeral — when it stops, in-memory state is gone. |
| **Volume** | Persistent storage attached to a container. Survives container deletion. |
| **Network** | A virtual LAN containers can join. Containers on the same network reach each other by service name. |
| **Port mapping** | `HOST:CONTAINER`. `5432:5432` = host's 5432 forwarded into the container's 5432. |
| **Compose** | A YAML file (`docker-compose.yml`) that describes a stack of services. `docker compose up` brings it all up. |

---

## 3. Postgres with Docker — the patterns

### 3.1 Minimal (throwaway data)

What `authentication/authentication-session/` currently uses:

```yaml
services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: mypassword
    ports:
      - "5432:5432"
```

Works for a quick spike. **Data is lost** when the container is removed. No volume, no DB name explicitly set (`postgres` default DB is used).

### 3.2 Recommended (persistent + named DB)

```yaml
services:
  db:
    image: postgres:18.3
    container_name: my-project-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: my_project
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d my_project"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

Line-by-line for the new bits:

- **`image: postgres:18.3`** — pin the **exact** version. `postgres:latest` is a footgun: a `docker compose pull` on a new machine can silently land you on a newer major version with incompatible data.
- **`container_name`** — gives a stable name for `docker exec ...`. Without this, Docker generates one from the directory + service.
- **`restart: unless-stopped`** — restart on crash / boot, but not if you explicitly `docker compose down`.
- **`POSTGRES_DB`** — auto-creates a non-`postgres` database on first boot. Matches what most apps want.
- **`volumes: pgdata:/var/lib/postgresql/data`** — persistent storage, survives container deletion.
- **`healthcheck`** — `pg_isready` is the right tool. Other services with `depends_on: condition: service_healthy` will wait for this.

### 3.3 Avoiding the port-5432 collision

If two projects need Postgres at the same time, remap one:

```yaml
ports:
  - "5433:5432"   # host 5433 → container 5432
```

Then in `.env`:
```env
DATABASE_URL=postgresql://postgres:admin@localhost:5433/my_project
```

The container internally still listens on 5432 — only the host port changes.

### 3.4 App + DB together

If running the Node app **inside Docker too** (rare for local dev, common in CI):

```yaml
services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:admin@db:5432/my_project
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:18.3
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: my_project
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d my_project"]
      interval: 5s
      retries: 5

volumes:
  pgdata:
```

Key shift: **the app reaches the DB via `db:5432`**, not `localhost:5432`. Inside the Compose network, services find each other by service name.

---

## 4. The commands worth memorizing

```bash
# Lifecycle
docker compose up -d              # start everything in background
docker compose up                 # start in foreground (logs streamed)
docker compose down               # stop and remove containers (volumes survive)
docker compose down -v            # stop AND wipe volumes — total reset
docker compose restart db         # restart one service

# Inspect
docker compose ps                 # list services in this project
docker compose logs -f db         # tail one service's logs
docker compose logs --tail=100    # last 100 lines from everything
docker ps                         # all running containers (any project)

# Shell into a container
docker exec -it my-project-db bash
docker exec -it my-project-db psql -U postgres -d my_project

# Image hygiene
docker images                     # list local images
docker image prune                # remove dangling images
docker system prune -a            # nuke unused images/containers/networks (dangerous-ish)
docker volume ls                  # list volumes (find orphans)
```

`docker compose ...` (space, v2) is the current syntax. `docker-compose ...` (hyphen, v1) is deprecated.

---

## 5. Best practices

### Always do

- **Pin image versions.** `postgres:18.3`, not `postgres:latest`.
- **Use named volumes for data** (`pgdata:` at the top level). Bind mounts (`./data:/var/lib/postgresql/data`) cause file-permission grief across host OSes.
- **Add healthchecks** so `depends_on: condition: service_healthy` works.
- **Keep credentials in `.env`**, then reference them in `docker-compose.yml`:
  ```yaml
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  ```
- **Commit `docker-compose.yml`**, never commit `.env`.
- **Match local DB engine to production.** Postgres in prod → Postgres in dev. SQLite locally + Postgres in prod is one of the great regrettable shortcuts.

### Never do

- **Don't run prod-grade containers with `restart: always` + no monitoring** — the restart loop hides crashes.
- **Don't bind a database port to `0.0.0.0` on a public host.** Default Docker behavior on dev machines exposes `5432` to the local network. Fine for laptops, dangerous on a shared dev box.
- **Don't depend on the **default** `postgres` database.** Always set `POSTGRES_DB` to something specific.
- **Don't share one container across multiple unrelated projects.** Disk is cheap, debugging shared state is not.
- **Don't `docker compose down -v` without knowing what's in there.** It deletes volumes — including your seed data.

---

## 6. Blockers and how to escape them

### "Port is already allocated"

```
Error: bind: address already in use
```

Something else (another container, a system Postgres install, an earlier zombie process) is on the port.

```bash
# Find it (macOS/Linux):
lsof -i :5432
# Or any OS:
docker ps                # is another container holding it?
```

Fix: stop the other process, or remap to a different host port (`"5433:5432"`).

---

### "Permission denied" on a bind-mounted data folder

You wrote `./data:/var/lib/postgresql/data` and now Postgres can't write to it.

Fix: use a **named volume** (`pgdata:/var/lib/postgresql/data`) instead of a bind mount. Postgres + bind mounts + host file permissions is a fight that's not worth having.

---

### "Database is uninitialized and superuser password is not specified"

You forgot `POSTGRES_PASSWORD` in `environment`. Postgres refuses to start without one (unless you set `POSTGRES_HOST_AUTH_METHOD=trust`, which you shouldn't).

---

### "FATAL: role 'X' does not exist" after changing `POSTGRES_USER`

Postgres **only** runs the init scripts (which create the user) on **first boot with an empty data directory**. Changing `POSTGRES_USER` in `docker-compose.yml` after the volume already exists does nothing.

Fix: `docker compose down -v` to wipe the volume, then `up -d` to re-init.

---

### Container starts but `localhost:5432` doesn't respond

Common causes:
1. `ports:` is missing or commented out — the container is running but not exposed to the host.
2. The app inside another container is trying `localhost:5432` instead of `db:5432`.
3. A firewall (corporate machine, WSL networking quirk) is blocking the port.

`docker compose logs db` will usually tell you it's ready to accept connections — if that line is there, the container is fine and the problem is in mapping or networking.

---

### "Cannot connect to the Docker daemon"

Docker Desktop (or the daemon) isn't running.
- macOS / Windows: open Docker Desktop.
- Linux: `sudo systemctl start docker`.

---

### Data disappeared after `docker compose down`

You ran it without a volume defined. The container's filesystem is ephemeral — when it's removed, data goes with it. Always declare a named volume for stateful services (see [§3.2](#32-recommended-persistent--named-db)).

---

### Image is stale even after editing the Dockerfile

You changed your Dockerfile but containers boot the old image. Compose only rebuilds when asked:

```bash
docker compose up -d --build
```

Or to force-pull a newer base image too:

```bash
docker compose build --no-cache
docker compose up -d
```

---

### Container keeps restarting in a loop

`restart: always` + a crash on boot = endless loop. Check logs:

```bash
docker compose logs -f db
```

Often it's a config typo or a volume from a different Postgres major version.

---

## 7. Other useful images for backend work

When the next project needs more than Postgres, the patterns are identical — only the image and env vars change.

```yaml
services:
  redis:
    image: redis:7.4-alpine
    ports: ["6379:6379"]
    volumes:
      - redisdata:/data
    command: ["redis-server", "--appendonly", "yes"]

  mongo:
    image: mongo:8
    ports: ["27017:27017"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: admin
    volumes:
      - mongodata:/data/db

  mailhog:                 # fake SMTP for catching dev emails
    image: mailhog/mailhog
    ports:
      - "1025:1025"        # SMTP
      - "8025:8025"        # web UI

  minio:                   # local S3-compatible storage
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - miniodata:/data

volumes:
  redisdata:
  mongodata:
  miniodata:
```

---

## 8. Project template — copy this for new projects

```yaml
services:
  db:
    image: postgres:18.3
    container_name: ${PROJECT_NAME:-app}-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-admin}
      POSTGRES_DB: ${POSTGRES_DB:-app}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-app}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

Then a matching `.env.example`:

```env
PROJECT_NAME=my-project
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_DB=my_project
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:admin@localhost:5432/my_project
```

Variables with `${VAR:-default}` syntax fall back to the default if the env var isn't set — so the file works out of the box but can be overridden.

---

## 9. Mental model in one paragraph

A **Compose file** declares a set of **services**. Each service is built from an **image**, runs as a **container**, may persist data in a **volume**, and exposes ports via **port mappings**. Containers on the same Compose stack reach each other by **service name** (`db`, `redis`) over an internal **network**; the host reaches them via mapped ports (`localhost:5432`). `up` starts the stack, `down` tears it down, `-v` wipes volumes. Everything else is variations on those primitives.

---

## 10. Where to go next

- **[`DRIZZLE.md`](./DRIZZLE.md)** — the database layer on top of the Postgres container.
- **[`ARCHITECTURE.md`](./ARCHITECTURE.md) §3** — how DB, cache, queue fit into the broader backend.
- **[`book-store/`](./book-store/)** and **[`authentication/authentication-session/`](./authentication/authentication-session/)** — real `docker-compose.yml` files in use.
