
import {
  IsInt,
  IsISBN,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
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

  @IsOptional()
  @IsISBN()
  isbn?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  totalCopies?: number;

  @IsUUID()
  genreId: string;
}
