import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const genres = [
  { name: "Fiction", description: "Fictional stories and novels" },
  { name: "Science", description: "Scientific knowledge and discoveries" },
  { name: "History", description: "Historical events and accounts" },
  { name: "Technology", description: "Computing and technological innovation" },
];

const books = [
  { title: "Things Fall Apart", author: "Chinua Achebe", isbn: "9780385474542", publishedYear: 1958, genre: "Fiction" },
  { title: "The River Between", author: "Ngugi wa Thiong'o", isbn: "9780435905484", publishedYear: 1965, genre: "Fiction" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", publishedYear: 1925, genre: "Fiction" },
  { title: "1984", author: "George Orwell", isbn: "9780451524935", publishedYear: 1949, genre: "Fiction" },
  { title: "Animal Farm", author: "George Orwell", isbn: "9780451526342", publishedYear: 1945, genre: "Fiction" },

  { title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", publishedYear: 1988, genre: "Science" },
  { title: "The Selfish Gene", author: "Richard Dawkins", isbn: "9780198788607", publishedYear: 1976, genre: "Science" },
  { title: "Cosmos", author: "Carl Sagan", isbn: "9780345539434", publishedYear: 1980, genre: "Science" },
  { title: "The Origin of Species", author: "Charles Darwin", isbn: "9781509827695", publishedYear: 1859, genre: "Science" },

  { title: "The History of Kenya", author: "Bethwell A. Ogot", isbn: "9789966250010", publishedYear: 1967, genre: "History" },
  { title: "A People's History of the United States", author: "Howard Zinn", isbn: "9780062397348", publishedYear: 1980, genre: "History" },
  { title: "The Silk Roads", author: "Peter Frankopan", isbn: "9781101912379", publishedYear: 2015, genre: "History" },

  { title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", publishedYear: 2008, genre: "Technology" },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt and David Thomas", isbn: "9780135957059", publishedYear: 1999, genre: "Technology" },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", isbn: "9780262046305", publishedYear: 2022, genre: "Technology" },
];

async function main(): Promise<void> {
  const genreIds = new Map<string, string>();

  for (const genre of genres) {
    const row = await prisma.genre.upsert({
      where: { name: genre.name },
      update: genre,
      create: genre,
    });
    genreIds.set(genre.name, row.id);
  }

  for (const { genre, ...book } of books) {
    const genreId = genreIds.get(genre);
    if (!genreId) throw new Error(`Unknown genre: ${genre}`);

    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: { ...book, genreId },
      create: { ...book, genreId },
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