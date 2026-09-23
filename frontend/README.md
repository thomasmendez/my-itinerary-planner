# Frontend

React + TypeScript SPA (Vite). No backend required with MSW mocking

## Installation Requirements

- [Node](https://nodejs.org) - version 24

## Local Setup

### Setup Node Environment

Install dependencies

`npm ci`

### Setup .env

Copy the `.env.example` file and modify the environment variables if needed

`cp .env.example .env`

*Note: Defaults (`VITE_MOCKING=true`, `VITE_MOCK_TRIPS=true`) mock all API calls in-browser via MSW. Set both to false to use a live backend.*

## Start App

```sh
npm run dev
```

## Run Tests

```sh
npm run test          # unit tests (vitest)
npm run test:watch    # watch mode
npm run test:ui       # vitest UI
npm run test:coverage # coverage report
npm run test:e2e      # Playwright e2e
```

## Lint

`npm run lint`

## Other

```sh
npm run build   # type-check + production build
npm run preview # preview the production build locally
```
