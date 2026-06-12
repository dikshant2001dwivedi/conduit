import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { hash } from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	async createUser(data: { email: string; username: string; password: string }) {
		return this.prisma.user.create({
			data: {
				email: data.email,
				username: data.username,
				password: data.password,
				bio: "",
				image: null
			}
		});
	}

	async findByEmail(email: string) {
		return this.prisma.user.findUnique({ where: { email } });
	}

	async findByUsername(username: string) {
		return this.prisma.user.findFirst({ where: { username } });
	}

	async findById(id: number) {
		return this.prisma.user.findUnique({ where: { id } });
	}

	async updateCurrentUser(userId: number, dto: UpdateUserDto) {
		const nextData: {
			email?: string;
			username?: string;
			bio?: string;
			image?: string | null;
			password?: string;
		} = {};

		if (dto.user.email !== undefined) {
			nextData.email = dto.user.email;
		}
		if (dto.user.username !== undefined) {
			nextData.username = dto.user.username;
		}
		if (dto.user.bio !== undefined) {
			nextData.bio = dto.user.bio;
		}
		if (dto.user.image !== undefined) {
			nextData.image = dto.user.image;
		}
		if (dto.user.password !== undefined) {
			nextData.password = await hash(dto.user.password, 10);
		}

		return this.prisma.user.update({
			where: { id: userId },
			data: nextData
		});
	}

	toUserResponse(user: User, token?: string) {
		return {
			email: user.email,
			username: user.username,
			bio: user.bio,
			image: user.image,
			...(token ? { token } : {})
		};
	}

	toBareUserResponse(user: User) {
		return {
			email: user.email,
			username: user.username,
			bio: user.bio,
			image: user.image
		};
	}
}