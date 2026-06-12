import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTags() {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: "asc" }
    });

    return {
      tags: tags.map((tag) => tag.name)
    };
  }
}