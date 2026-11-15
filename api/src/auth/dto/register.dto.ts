import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Role } from "../../generated/prisma/client.js";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt only uses the first 72 bytes
  password: string;

  // Learning-project convenience so a LIBRARIAN can be created from Postman.
  // Remove this field before any real deployment.
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
