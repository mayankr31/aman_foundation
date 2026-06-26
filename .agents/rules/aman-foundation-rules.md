---
trigger: always_on
---

# Project Rules & Architectural Guidelines

## Core Tech Stack
- Frontend/Backend: Next.js (App Router, React Server Components)
- Language: JavaScript (ES6+)
- Styling: Tailwind CSS
- Database ORM: Prisma ORM
- Database: PostgreSQL (Running locally via Docker)

---

## 🚨 Critical Environment & Infrastructure Constraints
- **Persistent Database:** The PostgreSQL database container is ALWAYS running in the background. 
  - DO NOT execute `docker compose up -d`, `docker-compose`, or check for Docker health states.
  - DO NOT look for or attempt to validate `.env` files for database connectivity; assume the connection is live and configured.
- **Prisma Client Imports:** NEVER instantiate a new `PrismaClient()` or import it from `@prisma/client` inside application code.
  - ALWAYS import the singleton instance from the dedicated library file:
    ```javascript
    import { prisma } from '@/lib/prisma'; // Or your exact alias, e.g., @lib/prisma.js
    ```

---

## 🗄️ Database & Prisma Schema Mutations
- **Zero DB Push:** NEVER use `npx prisma db push` to alter the database schema or sync changes.
- **Migration-Driven Development:** Always use Prisma Migrations to track, apply, and sync schema updates.
  - When a schema file (`schema.prisma`) is updated, generate and apply a migration via the terminal using:
    ```bash
    npx prisma migrate dev --name <migration_name>
    ```
  - For production/deployment context simulations, use `npx prisma migrate deploy`.