
# Library Management System

## Schema Decisions

### Genre as a Separate Model

Genre is represented as a separate model rather than being stored as plain text in every Book record. This avoids repeating genre information across multiple books and helps maintain consistent genre names throughout the database.

### Book-to-Genre Relationship

The Book model contains a `genreId` foreign key that references the primary key of the Genre model. Prisma represents this relationship through the `genre` relation field and the `@relation` attribute.

This creates a one-to-many relationship: one genre can be associated with many books, while each book belongs to one genre.

### Normalization and Data Integrity

Separating genres from books reduces duplicated data and makes genre records easier to maintain. The foreign-key constraint ensures that a book cannot reference a genre that does not exist.

### Relational Database Compared with a Document Database

In this relational design, genre information is stored in its own table and connected to books using a foreign key. In a document database, genre information could instead be embedded inside each book document. The relational approach makes shared genre data easier to manage consistently.
# Library Management System

A backend API and PostgreSQL database layer for a Library Management System built with **NestJS**, **Prisma 7**, and **PostgreSQL**.

## Project Structure

- `api/` — NestJS backend application (`NodeNext` ESM)
- `api/prisma/schema.prisma` — Prisma database schema (`User`, `Genre`, and `Book` models)
- `api/prisma/migrations/` — Version-controlled PostgreSQL SQL migrations
- `api/prisma/seed.ts` — Idempotent database seed script (4 genres and 15 books)
- `api/src/prisma/` — Injectable `PrismaService` configured with `@prisma/adapter-pg`
- `api/.env.example` — Environment variable template

## Setup & Local Development

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- **PostgreSQL** (running locally on port `5432`)

### 2. Configure Environment Variables
1. Create a PostgreSQL database named `library_management_system`.
2. Copy `api/.env.example` to `api/.env`:
   ```bash
   cp api/.env.example api/.env
   ```
3. Update `DATABASE_URL` inside `api/.env` with your local PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/library_management_system?schema=public"
   ```

### 3. Install Dependencies & Run Migrations
From the `api/` directory:
```bash
cd api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Build & Start the Server
```bash
npm run build
npm run start:dev
```

## Schema Decisions

1. **UUID Primary Keys (`@id @default(uuid())`)**
   - All models (`User`, `Genre`, `Book`) use string-based UUID primary keys rather than auto-incrementing integers to avoid exposing sequential record counts and to support safe, collision-free record creation.

2. **Role-Based Access Enum (`Role`)**
   - User roles are modeled as a strict PostgreSQL enum (`PATRON` and `LIBRARIAN`) defaulting to `PATRON`, preventing invalid role strings at the database level.

3. **Data Integrity & Uniqueness Constraints**
   - `User.email`, `Genre.name`, and `Book.isbn` enforce `@unique` constraints to prevent duplicate user accounts, duplicate categories, and duplicate book catalog entries.
   - `User.passwordHash` stores hashed credentials rather than plaintext passwords.

4. **One-to-Many Relationship & Referential Actions (`Genre` → `Book`)**
   - Each `Book` belongs to a single `Genre` via `genreId`.
   - `onDelete: Restrict` prevents deleting a genre while books are still assigned to it, protecting catalog integrity.
   - `onUpdate: Cascade` ensures any key updates propagate safely.

5. **Query Performance Indexes**
   - `Book` defines composite/single-column indexes on `@@index([genreId])` and `@@index([title])` to optimize filtering books by category and searching by title.

6. **Audit Timestamps & Idempotent Seeding**
   - Every table includes `createdAt` (`@default(now())`) and `updatedAt` (`@updatedAt`) timestamps for record auditing.
   - `prisma/seed.ts` uses `prisma.<model>.upsert()` with deterministic IDs so the seed script can be re-run safely without creating duplicate records.
