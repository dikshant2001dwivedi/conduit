import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCommentDto } from "./dto/create-comment.dto";

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug }
    });
    if (!article) {
      throw new NotFoundException("Article not found");
    }

    const comments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
      include: { author: true },
      orderBy: { createdAt: "asc" }
    });

    return {
      comments: comments.map((comment) => this.serializeComment(comment))
    };
  }

  async create(currentUser: User, slug: string, dto: CreateCommentDto) {
    const article = await this.prisma.article.findUnique({
      where: { slug }
    });
    if (!article) {
      throw new NotFoundException("Article not found");
    }

    const comment = await this.prisma.comment.create({
      data: {
        body: dto.comment.body,
        authorId: currentUser.id,
        articleId: article.id
      },
      include: {
        author: true
      }
    });

    return {
      comment: this.serializeComment(comment)
    };
  }

  async delete(currentUser: User, slug: string, commentId: number) {
    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article) {
      throw new NotFoundException("Article not found");
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId }
    });
    if (!comment || comment.articleId !== article.id) {
      throw new NotFoundException("Comment not found");
    }

    if (comment.authorId !== currentUser.id) {
      throw new ForbiddenException("Not allowed");
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }

  private serializeComment(comment: {
    id: number;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      username: string;
      bio: string;
      image: string | null;
    };
  }) {
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.image,
        following: false
      }
    };
  }
}