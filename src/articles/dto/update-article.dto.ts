import { Type } from "class-transformer";
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";

class UpdateArticleBodyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagList?: string[];
}

export class UpdateArticleDto {
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateArticleBodyDto)
  article!: UpdateArticleBodyDto;
}