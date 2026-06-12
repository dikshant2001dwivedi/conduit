import { Type } from "class-transformer";
import { IsEmail, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

class UpdateUserBodyDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateUserDto {
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserBodyDto)
  user!: UpdateUserBodyDto;
}