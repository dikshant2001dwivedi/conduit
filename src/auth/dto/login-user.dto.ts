import { Type } from "class-transformer";
import { IsEmail, IsNotEmpty, IsObject, IsString, ValidateNested } from "class-validator";

class LoginUserBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class LoginUserDto {
  @IsObject()
  @ValidateNested()
  @Type(() => LoginUserBodyDto)
  user!: LoginUserBodyDto;
}