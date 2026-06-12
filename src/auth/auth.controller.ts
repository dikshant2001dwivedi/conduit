import {
	Body,
	ConflictException,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UnauthorizedException
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginUserDto } from "./dto/login-user.dto";
import { RegisterUserDto } from "./dto/register-user.dto";

@Controller("api")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("users")
	async register(@Body() dto: RegisterUserDto) {
		try {
			return await this.authService.register(dto);
		} catch {
			throw new ConflictException("User already exists");
		}
	}

	@Post("users/login")
	@HttpCode(HttpStatus.ACCEPTED)
	async login(@Body() dto: LoginUserDto) {
		const response = await this.authService.login(dto);

		if (!response) {
			throw new UnauthorizedException("Invalid credentials");
		}

		return response;
	}
}