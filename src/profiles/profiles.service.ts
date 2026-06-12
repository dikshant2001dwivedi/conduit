import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(currentUserId: number, username: string) {
    const target = await this.prisma.user.findFirst({
      where: { username }
    });

    if (!target) {
      throw new NotFoundException("Profile not found");
    }

    const relation = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: target.id
        }
      }
    });

    return {
      profile: {
        username: target.username,
        bio: target.bio,
        image: target.image,
        following: Boolean(relation)
      }
    };
  }

  async follow(currentUserId: number, username: string) {
    const target = await this.prisma.user.findFirst({
      where: { username }
    });

    if (!target) {
      throw new NotFoundException("Profile not found");
    }

    if (target.id === currentUserId) {
      throw new BadRequestException("Cannot follow yourself");
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: target.id
        }
      },
      update: {},
      create: {
        followerId: currentUserId,
        followingId: target.id
      }
    });

    return {
      profile: {
        username: target.username,
        bio: target.bio,
        image: target.image,
        following: true
      }
    };
  }

  async unfollow(currentUserId: number, username: string) {
    const target = await this.prisma.user.findFirst({
      where: { username }
    });

    if (!target) {
      throw new NotFoundException("Profile not found");
    }

    await this.prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: target.id
      }
    });

    return {
      profile: {
        username: target.username,
        bio: target.bio,
        image: target.image,
        following: false
      }
    };
  }
}