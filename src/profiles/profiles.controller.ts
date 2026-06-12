import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { User } from "@prisma/client";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProfilesService } from "./profiles.service";

@Controller("api/profiles")
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(":username")
  getProfile(@CurrentUser() user: User, @Param("username") username: string) {
    return this.profilesService.getProfile(user.id, username);
  }

  @Post(":username/follow")
  @HttpCode(HttpStatus.OK)
  follow(@CurrentUser() user: User, @Param("username") username: string) {
    return this.profilesService.follow(user.id, username);
  }

  @Delete(":username/follow")
  unfollow(@CurrentUser() user: User, @Param("username") username: string) {
    return this.profilesService.unfollow(user.id, username);
  }
}