import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { User } from "@prisma/client";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("api")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get("user")
	@UseGuards(JwtAuthGuard)
	getCurrentUser(@CurrentUser() user: User) {
		return this.usersService.toBareUserResponse(user);
	}

	@Put("user")
	@UseGuards(JwtAuthGuard)
	async updateCurrentUser(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
		const updatedUser = await this.usersService.updateCurrentUser(user.id, dto);
		return this.usersService.toBareUserResponse(updatedUser);
	}
}