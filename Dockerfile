# syntax=docker/dockerfile:1

# Stage 1: build the React SPA. The output is static files, so it runs on the build host's
# platform, which keeps the arm64 build from running npm under QEMU emulation.
FROM --platform=$BUILDPLATFORM node:24.21-trixie-slim@sha256:8ec5d7557396cfe32d21c3f9c13072355ceab22b584578ca4bb28af31120cffe AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY frontend/ ./
# true lets the user use demo search dates (backend/app/search/adapters/serpapi_stub.py) in the frontend
# Set it to false at build time for a real, non-demo deployment
ARG VITE_ALLOW_PAST_DEPART_DATE=false
ENV VITE_ALLOW_PAST_DEPART_DATE=$VITE_ALLOW_PAST_DEPART_DATE
RUN npm run build

# Stage 2: install the backend's dependencies and code into /app/.venv with uv
FROM ghcr.io/astral-sh/uv:0.12.18-python3.13-trixie-slim@sha256:8891323e7ddaddc86d08c91f8af845ac5774a07d6f98e6765883030e1ad16fbc AS backend-build
WORKDIR /app

# Build the venv against the image's Python. Without UV_PYTHON, backend/.python-version (3.12)
# would make uv download a separate interpreter under /root, which the runtime stage lacks.
# Bytecode is compiled at build time because the app user can't write __pycache__ into /app.
ENV UV_PYTHON=/usr/local/bin/python3 \
    UV_PYTHON_DOWNLOADS=never \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

COPY backend/pyproject.toml backend/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --no-install-project

COPY backend/ .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

# Stage 3: runtime. The official Python image without uv, serving the built SPA as static
# files (see app/main.py)
FROM python:3.13.15-slim-trixie@sha256:8d9d0b8bcf6506481eae4907c18f5e3e7902e629f5f6d684f9e7c32e85e3ddf0
WORKDIR /app

COPY --from=backend-build /app /app
COPY --from=frontend-build /frontend/dist ./app/static

# pip isn't needed at runtime (uv built the venv, and nothing is installed after the build)
# The code stays root-owned and read-only to the app. Only /app/data (the SQLite volume) is
# writable. A new named volume copies this directory's ownership when it is first mounted.
RUN python -m pip uninstall --yes pip \
    && useradd --system --uid 10001 --user-group --no-create-home app \
    && mkdir -p /app/data \
    && chown app:app /app/data

# The default DATABASE_URL points at /app, which the app user can't write, so plain
# `docker run` (the CI smoke test) needs this too. docker-compose.yml sets the same value.
ENV DATABASE_URL=sqlite:////app/data/itinerary.db \
    PATH="/app/.venv/bin:$PATH"

USER app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4)"]

# Runs the venv's executables directly. uv isn't in this image, and the environment is
# already complete from the build stage.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
