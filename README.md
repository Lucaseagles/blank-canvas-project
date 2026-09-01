# Heartfelt Notes

V1 maintained directly in GitHub.

## Repository workflow

This repository is the source of truth for the project. Development, review and delivery are performed directly against GitHub and the `main` branch. Lovable is not required for the development workflow.

## Development

Prefer working locally? You need Node.js and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Production build

```sh
npm run build
npm run preview
```

## V1 audit

The final Sprint 27 audit criteria are documented in `docs/sprint-27-v1-final-audit.md`. Runtime checks such as Lighthouse and real mobile interaction must be executed in a browser before claiming production-grade performance metrics.
