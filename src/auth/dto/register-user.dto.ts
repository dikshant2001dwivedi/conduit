import { Type } from "class-transformer";
import { IsEmail, IsNotEmpty, IsObject, IsString, ValidateNested } from "class-validator";

class RegisterUserBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RegisterUserDto {
  @IsObject()
  @ValidateNested()
  @Type(() => RegisterUserBodyDto)
  user!: RegisterUserBodyDto;
}

export type RegisterUserBody = RegisterUserDto["user"];