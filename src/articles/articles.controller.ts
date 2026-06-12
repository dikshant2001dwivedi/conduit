import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from "@nestjs/common";
import { User } from "@prisma/client";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ArticlesService } from "./articles.service";
import { CreateArticleDto } from "./dto/create-article.dto";
import { ListArticlesDto } from "./dto/list-articles.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";

@Controller("api/articles")
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  list(@Query() query: ListArticlesDto) {
    return this.articlesService.listArticles(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: User, @Body() dto: CreateArticleDto) {
    return this.articlesService.createArticle(user, dto);
  }

  @Get("feed")
  @UseGuards(JwtAuthGuard)
  feed(@CurrentUser() user: User, @Query() query: ListArticlesDto) {
    return this.articlesService.feed(user, query);
  }

  @Get(":slug")
  getBySlug(@Param("slug") slug: string) {
    return this.articlesService.getArticle(slug);
  }

  @Put(":slug")
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: User,
    @Param("slug") slug: string,
    @Body() dto: UpdateArticleDto
  ) {
    return this.articlesService.updateArticle(user, slug, dto);
  }

  @Delete(":slug")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: User, @Param("slug") slug: string) {
    await this.articlesService.deleteArticle(user, slug);
  }

  @Post(":slug/favorite")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  favorite(@CurrentUser() user: User, @Param("slug") slug: string) {
    return this.articlesService.favorite(user, slug);
  }

  @Delete(":slug/favorite")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  unfavorite(@CurrentUser() user: User, @Param("slug") slug: string) {
    return this.articlesService.unfavorite(user, slug);
  }
}