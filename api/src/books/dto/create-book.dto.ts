import {
  IsInt,
  IsISBN,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  author: string;

  @IsISBN()
  isbn: string;

  @IsInt()
  @Min(1)
  totalCopies: number;

  @IsUUID()
  genreId: string;
}
