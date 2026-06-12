import { Type } from "class-transformer";
import { IsNotEmpty, IsObject, IsString, ValidateNested } from "class-validator";

class CreateCommentBodyDto {
  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class CreateCommentDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CreateCommentBodyDto)
  comment!: CreateCommentBodyDto;
}