# Library Management System

A backend API and PostgreSQL database layer for a Library Management System built with **NestJS**, **Prisma 7**, and **Hosted PostgreSQL (Neon)**.

## Project Structure

- `api/` — NestJS backend application (`NodeNext` ESM)
- `api/prisma/schema.prisma` — Prisma database schema (`User`, `Genre`, `Book`, and `Review` models)
- `api/prisma/migrations/` — Version-controlled PostgreSQL SQL migrations
- `api/prisma/seed.ts` — Idempotent database seed script (4 genres and 15 books)
- `api/src/prisma/` — Injectable `PrismaService` configured with `@prisma/adapter-pg`
- `api/.env.example` — Environment variable template (placeholder only; no real credentials are committed)

## Setup & Hosted Database Configuration

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- A hosted **PostgreSQL** database instance (configured via **Neon** on `AWS Europe Central 1 (Frankfurt)`)

### 2. Configure Environment Variables
1. Create a free PostgreSQL project on [Neon](https://neon.tech) and copy your **direct** (non-pooled) PostgreSQL connection string (`?sslmode=require`). Migrations need the direct connection, not the pooled one.
2. Copy `api/.env.example` to `api/.env`:
   ```bash
   cp api/.env.example api/.env
   ```
3. Update `DATABASE_URL` inside `api/.env` with your hosted Neon connection string:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@YOUR-NEON-HOST.aws.neon.tech/neondb?sslmode=require"
   ```
   `.env` is git-ignored; only `.env.example` is committed.

### 3. Install Dependencies, Migrate & Seed
From the `api/` directory:
```bash
cd api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```
`prisma:migrate` runs `prisma migrate dev`, which applies the migrations in `api/prisma/migrations/` to the Neon database. In a deployment or CI environment, use `npx prisma migrate deploy` instead, which applies existing migrations without generating new ones.

The seed inserts 4 genres (Fiction, Science, History, Technology) and 15 books distributed across them, and is safe to re-run.

### 4. Build & Start the Server
```bash
npm run build
npm run start:dev
```

## Schema Decisions

1. **Referencing `Genre` via Foreign Key (`genreId`) Rather Than Embedding**
   - `Book` references a normalized `Genre` table via `genreId` with `@relation` instead of embedding genre strings or objects directly inside each `Book` row. This is a one-to-many relationship: one genre has many books, and each book belongs to exactly one genre.
   - **Data Consistency & Integrity:** Storing genres in a dedicated table with a `@unique` constraint on `Genre.name` prevents typos, casing mismatches (e.g., `"Sci-Fi"` vs `"sci-fi"`), and invalid categories. The foreign key also means a book cannot point at a genre that does not exist.
   - **Zero Data Duplication & Easy Updates:** Genre metadata (`name`, `description`) is stored once; renaming a genre or updating its description automatically applies to all linked books without updating thousands of book rows.
   - **Referential Protection:** `onDelete: Restrict` prevents accidentally deleting a genre that still has books assigned to it, and `onUpdate: Cascade` propagates any key updates safely.

2. **UUID Primary Keys (`@id @default(uuid())`)**
   - All models (`User`, `Genre`, `Book`, `Review`) use string-based UUID primary keys rather than auto-incrementing integers to avoid exposing sequential record counts and to support safe, collision-free record creation. The seed script lets the database generate these IDs.

3. **Role-Based Access Enum (`Role`)**
   - User roles are modeled as a strict PostgreSQL enum (`PATRON` and `LIBRARIAN`) defaulting to `PATRON`, preventing invalid role strings at the database level.

4. **Uniqueness Constraints**
   - `User.email`, `Genre.name`, and `Book.isbn` are `@unique` to prevent duplicate accounts, duplicate categories, and duplicate catalog entries.
   - `User.passwordHash` stores hashed credentials, never plaintext passwords.

5. **Book Reviews Relation (`Review` Stretch Model)**
   - `Review` acts as a join/relation entity linking `User` (`userId`) and `Book` (`bookId`) with a `rating` and optional `comment`.
   - `@@unique([bookId, userId])` ensures a user can submit only one review per book, while `onDelete: Cascade` automatically cleans up reviews if a book or user is deleted.
   - Prisma cannot express a CHECK constraint, so the valid rating range (1–5) is enforced in the API layer rather than the database.

6. **Query Performance Indexes & Audit Timestamps**
   - Indexes on `Book(genreId)`, `Book(title)`, `Review(bookId)`, and `Review(userId)` optimize filtering and lookups.
   - Every table includes `createdAt` and `updatedAt` timestamps.

7. **Idempotent Seeding**
   - `prisma/seed.ts` uses `upsert()` keyed on natural unique fields (`Genre.name` and `Book.isbn`) and lets the database generate the UUIDs, so the script can be re-run safely without creating duplicate records.

## Prisma vs. Document Database Reflection

The thing that felt most different was ordering and enforcement. In a document database I would have written `{ genre: "Science" }` inside each book and inserted everything in one pass. In Prisma/PostgreSQL the `Genre` rows had to exist first, so the seed script inserts genres, collects their generated IDs, and only then inserts books with the right `genreId`. The foreign key makes that order mandatory, and it is also what guarantees every book points at a real genre.

More broadly:
- **Normalized Relations vs. Embedding:** In Prisma/PostgreSQL, entities like `Book`, `Genre`, and `Review` are split into strict, normalized tables connected by foreign keys (`genreId`, `bookId`, `userId`), whereas in a document database you might embed reviews or genre details directly inside a single `Book` document for fast single-document reads at the expense of data duplication and harder cross-document updates.
- **Database-Enforced Constraints:** Prisma migrations push schema rules (`@unique`, `Role` enums, `onDelete: Restrict`) directly into PostgreSQL so invalid data is rejected at the storage layer rather than relying solely on application-level validation.