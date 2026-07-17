import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  perfil(@Request() req: any) {
    return this.authService.perfil(req.user.sub);
  }

  /** POST /auth/google/token — verifica Google ID token e retorna JWT */
  @Post('google/token')
  loginComGoogle(@Body() body: { credential: string }) {
    return this.authService.loginComGoogle(body.credential);
  }

  /** POST /auth/apple/token — verifica Apple ID token e retorna JWT */
  @Post('apple/token')
  loginComApple(@Body() body: { id_token: string; user?: any }) {
    return this.authService.loginComApple(body.id_token, body.user);
  }
}
