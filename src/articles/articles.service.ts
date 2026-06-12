import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateArticleDto } from "./dto/create-article.dto";
import { ListArticlesDto } from "./dto/list-articles.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async listArticles(query: ListArticlesDto) {
    const where: Prisma.ArticleWhereInput = {};

    if (query.tag) {
      where.articleTags = {
        some: {
          tag: {
            name: query.tag
          }
        }
      };
    }

    if (query.author) {
      where.author = { username: query.author };
    }

    if (query.favorited) {
      where.favorites = {
        some: {
          user: {
            username: query.favorited
          }
        }
      };
    }

    const records = await this.prisma.article.findMany({
      where,
      include: {
        author: true,
        articleTags: { include: { tag: true } },
        favorites: true
      },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? undefined,
      skip: query.offset ?? undefined
    });

    return records.map((record) => this.serializeArticle(record));
  }

  async createArticle(currentUser: User, dto: CreateArticleDto) {
    const baseSlug = slugify(dto.article.title);
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const slug = `${baseSlug}-${randomSuffix}`;

    const created = await this.prisma.article.create({
      data: {
        slug,
        title: dto.article.title,
        description: dto.article.description,
        body: dto.article.body,
        authorId: currentUser.id
      },
      include: {
        author: true,
        articleTags: { include: { tag: true } },
        favorites: true
      }
    });

    await this.replaceArticleTags(created.id, dto.article.tagList ?? []);

    const withTags = await this.prisma.article.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        author: true,
        articleTags: { include: { tag: true } },
        favorites: true
      }
    });

    return { article: this.serializeArticle(withTags, currentUser.id) };
  }

  async feed(currentUser: User, query: ListArticlesDto) {
    const records = await this.prisma.article.findMany({
      where: {
        author: {
          followedBy: {
            some: {
              followerId: currentUser.id
            }
          }
        }
      },
      include: {
        author: true,
        articleTags: { include: { tag: true } },
        favorites: true
      },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? undefined,
      skip: query.offset ?? undefined
    });

    return {
      articles: records.map((record) => this.serializeArticle(record, currentUser.id)),
      articlesCount: records.length
    };
  }

  async getArticle(slug: string, currentUserId?: number) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        articleTags: { include: { tag: true } },
        favorites: true
      }
    });

    if (!article) {
      throw new NotFoundException("Article not found");
    }

    return { article: this.serializeArticle(article, currentUserId) };
  }

  async updateArticle(currentUser: User, slug: string, dto: UpdateArticleDto) {
    const existing = await this.prisma.article.findUnique({
      where: { slug }
    });

    if (!existing) {
      throw new NotFoundException("Article not found");
    }

    if (existing.authorId !== currentUser.id) {
      throw new ForbiddenException("Not allowed");
    }

    const nextTitle = dto.article.title ?? existing.title;
    const nextSlug = dto.article.title ? `${slugify(nextTitle)}-${Math.floor(Math.random() * 1000000)}` : existing.slug;

    await this.prisma.article.update({
      where: { id: existing.id },
      data: {
        slug: nextSlug,
        title: nextTitle,
        description: dto.article.description ?? existing.description,
        body: dto.article.body ?? existing.body
      }
    });

    if (dto.article.tagList) {
      await this.replaceArticleTags(existing.id, dto.article.tagList);
    }

    const updated = await this.prisma.article.findUniqueOrThrow({
      where: { id: existing.id },
      include: {
        author: true,
        articleTags: { include: { tag: true } },
        favorites: true
      }
    });

    return { article: this.serializeArticle(updated, currentUser.id) };
  }

  async deleteArticle(currentUser: User, slug: string) {
    const existing = await this.prisma.article.findUnique({ where: { slug } });

    if (!existing) {
      throw new NotFoundException("Article not found");
    }

    if (existing.authorId !== currentUser.id) {
      throw new ForbiddenException("Not allowed");
    }

    await this.prisma.article.delete({ where: { id: existing.id } });
  }

  async favorite(currentUser: User, slug: string) {
    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article) {
      throw new NotFoundException("Article not found");
    }

    await this.prisma.favorite.upsert({
      where: {
        userId_articleId: {
          userId: currentUser.id,
          articleId: article.id
        }
      },
      update: {},
      create: {
        userId: currentUser.id,
        articleId: article.id
      }
    });

    return this.getArticle(slug, currentUser.id);
  }

  async unfavorite(currentUser: User, slug: string) {
    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article) {
      throw new NotFoundException("Article not found");
    }

    await this.prisma.favorite.deleteMany({
      where: {
        userId: currentUser.id,
        articleId: article.id
      }
    });

    return this.getArticle(slug, currentUser.id);
  }

  private async replaceArticleTags(articleId: number, tagNames: string[]) {
    const uniqueTagNames = Array.from(new Set(tagNames.filter(Boolean)));

    await this.prisma.articleTag.deleteMany({
      where: { articleId }
    });

    for (const name of uniqueTagNames) {
      const slug = slugify(name);
      const tag = await this.prisma.tag.upsert({
        where: { name },
        update: { slug },
        create: { name, slug }
      });

      await this.prisma.articleTag.create({
        data: {
          articleId,
          tagId: tag.id
        }
      });
    }
  }

  private serializeArticle(
    article: {
      id: number;
      slug: string;
      title: string;
      description: string;
      body: string;
      createdAt: Date;
      updatedAt: Date;
      author: {
        id: number;
        username: string;
        bio: string;
        image: string | null;
      };
      articleTags: { tag: { name: string } }[];
      favorites: { userId: number }[];
    },
    currentUserId?: number
  ) {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.articleTags.map((entry) => entry.tag.name),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      favorited: currentUserId
        ? article.favorites.some((favorite) => favorite.userId === currentUserId)
        : false,
      favoritesCount: article.favorites.length,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: false
      }
    };
  }
}