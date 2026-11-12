
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const genres = [
  { id: "genre-fiction", name: "Fiction", description: "Fictional stories and novels" },
  { id: "genre-science", name: "Science", description: "Scientific knowledge and discoveries" },
  { id: "genre-history", name: "History", description: "Historical events and accounts" },
  { id: "genre-technology", name: "Technology", description: "Computing and technological innovation" },
];

const books = [
  { id: "book-001", title: "Things Fall Apart", author: "Chinua Achebe", isbn: "9780385474542", publishedYear: 1958, genreId: "genre-fiction" },
  { id: "book-002", title: "The River Between", author: "Ngugi wa Thiong'o", isbn: "9780435905484", publishedYear: 1965, genreId: "genre-fiction" },
  { id: "book-003", title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", publishedYear: 1925, genreId: "genre-fiction" },
  { id: "book-004", title: "1984", author: "George Orwell", isbn: "9780451524935", publishedYear: 1949, genreId: "genre-fiction" },
  { id: "book-005", title: "Animal Farm", author: "George Orwell", isbn: "9780451526342", publishedYear: 1945, genreId: "genre-fiction" },

  { id: "book-006", title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", publishedYear: 1988, genreId: "genre-science" },
  { id: "book-007", title: "The Selfish Gene", author: "Richard Dawkins", isbn: "9780198788607", publishedYear: 1976, genreId: "genre-science" },
  { id: "book-008", title: "Cosmos", author: "Carl Sagan", isbn: "9780345539434", publishedYear: 1980, genreId: "genre-science" },
  { id: "book-009", title: "The Origin of Species", author: "Charles Darwin", isbn: "9781509827695", publishedYear: 1859, genreId: "genre-science" },

  { id: "book-010", title: "The History of Kenya", author: "Bethwell A. Ogot", isbn: "9789966250010", publishedYear: 1967, genreId: "genre-history" },
  { id: "book-011", title: "A People's History of the United States", author: "Howard Zinn", isbn: "9780062397348", publishedYear: 1980, genreId: "genre-history" },
  { id: "book-012", title: "The Silk Roads", author: "Peter Frankopan", isbn: "9781101912379", publishedYear: 2015, genreId: "genre-history" },

  { id: "book-013", title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", publishedYear: 2008, genreId: "genre-technology" },
  { id: "book-014", title: "The Pragmatic Programmer", author: "Andrew Hunt and David Thomas", isbn: "9780135957059", publishedYear: 1999, genreId: "genre-technology" },
  { id: "book-015", title: "Introduction to Algorithms", author: "Thomas H. Cormen", isbn: "9780262046305", publishedYear: 2022, genreId: "genre-technology" },
];

async function main(): Promise<void> {
  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { id: genre.id },
      update: genre,
      create: genre,
    });
  }

  for (const book of books) {
    await prisma.book.upsert({
      where: { id: book.id },
      update: book,
      create: book,
    });
  }

  console.log(`Seeded ${genres.length} genres and ${books.length} books.`);
}

main()
  .catch((error: unknown) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
