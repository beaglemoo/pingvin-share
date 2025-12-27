# Contributing

Contributions are welcome! Whether it's bug reports, feature requests, or pull requests, we appreciate your help making Pingvin Share better.

## Getting Started

Found a bug or have a suggestion? [Create an issue](https://github.com/beaglemoo/pingvin-share/issues) on GitHub.

## Pull Requests

Before submitting:

- Follow the [Conventional Commits](https://www.conventionalcommits.org) naming convention:

  ```
  <type>[optional scope]: <description>
  ```

  Examples:
  - `feat(share): add password protection`
  - `fix(auth): resolve login redirect issue`
  - `docs: update README`

  Types: **feat**, **fix**, **docs**, **refactor**, **test**, **chore**

- Include a clear description of your changes
- Run `npm run format` to format the code

## Development Setup

### Prerequisites

- Node.js 18+
- npm

### Backend

```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend requires the backend to be running first.

### Docker

For local testing with Docker:

```bash
docker compose -f docker-compose.local.yml up -d --build
```

The app will be available at http://localhost:3001

## Testing

Backend system tests:

```bash
cd backend
npm run test:system
```

## Upstream Contributions

For translations and changes to the original Pingvin Share, contribute to the [upstream repository](https://github.com/stonith404/pingvin-share).
