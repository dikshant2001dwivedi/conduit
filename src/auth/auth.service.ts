import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";
import { UsersService } from "../users/users.service";
import { LoginUserDto } from "./dto/login-user.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { JwtPayload } from "./types";

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService
	) {}

	async register(dto: RegisterUserDto) {
		const hashedPassword = await hash(dto.user.password, 10);
		const user = await this.usersService.createUser({
			email: dto.user.email,
			username: dto.user.username,
			password: hashedPassword
		});

		return {
			user: this.usersService.toUserResponse(user)
		};
	}

	async login(dto: LoginUserDto) {
		const user = await this.usersService.findByEmail(dto.user.email);

		if (!user) {
			return null;
		}

		const isPasswordValid = await compare(dto.user.password, user.password);
		if (!isPasswordValid) {
			return null;
		}

		const token = this.jwtService.sign(this.toJwtPayload(user));

		return {
			user: this.usersService.toUserResponse(user, token)
		};
	}

	private toJwtPayload(user: { id: number; email: string; username: string }): JwtPayload {
		return {
			sub: user.id,
			email: user.email,
			username: user.username
		};
	}
}