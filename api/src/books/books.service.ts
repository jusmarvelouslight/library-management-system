import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateBookDto } from "./dto/create-book.dto.js";
import { UpdateBookDto } from "./dto/update-book.dto.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookDto) {
    await this.assertGenreExists(dto.genreId);
    try {
      return await this.prisma.book.create({
        data: dto,
        include: { genre: true },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAll(params: {
    genreId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(DEFAULT_PAGE, params.page ?? DEFAULT_PAGE);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, params.limit ?? DEFAULT_LIMIT),
    );
    const search = params.search?.trim();

    const where: Prisma.BookWhereInput = {};
    if (params.genreId) {
      where.genreId = params.genreId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        include: { genre: true },
        orderBy: [{ title: "asc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { genre: true },
    });
    if (!book) throw new NotFoundException(`Book ${id} not found`);
    return book;
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.findOne(id);
    if (dto.genreId !== undefined) {
      await this.assertGenreExists(dto.genreId);
    }
    try {
      return await this.prisma.book.update({
        where: { id },
        data: dto,
        include: { genre: true },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.book.delete({ where: { id } });
  }

  private async assertGenreExists(genreId: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id: genreId },
    });
    if (!genre) {
      throw new BadRequestException(`Genre ${genreId} does not exist`);
    }
  }

  private handleError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("A book with that ISBN already exists");
    }
    throw error;
  }
}
