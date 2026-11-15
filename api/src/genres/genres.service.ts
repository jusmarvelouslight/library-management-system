import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateGenreDto } from "./dto/create-genre.dto.js";
import { UpdateGenreDto } from "./dto/update-genre.dto.js";

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGenreDto) {
    try {
      return await this.prisma.genre.create({ data: dto });
    } catch (error) {
      this.handleError(error);
    }
  }

  findAll() {
    return this.prisma.genre.findMany({ orderBy: { name: "asc" } });
  }

  async findOne(id: string) {
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) throw new NotFoundException(`Genre ${id} not found`);
    return genre;
  }

  async update(id: string, dto: UpdateGenreDto) {
    await this.findOne(id);
    try {
      return await this.prisma.genre.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleError(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      return await this.prisma.genre.delete({ where: { id } });
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new ConflictException("A genre with that name already exists");
      }
      if (error.code === "P2003") {
        throw new ConflictException(
          "Genre still has books assigned to it and cannot be deleted",
        );
      }
    }
    throw error;
  }
}
