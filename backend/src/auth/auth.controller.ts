import { Controller, Post, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  // POST /api/v1/auth/register
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /api/v1/auth/login
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET /api/v1/auth/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  perfil(@Request() req: any) {
    return this.authService.perfil(req.user.sub);
  }

  // POST /api/v1/auth/google/token
  @Post('google/token')
  loginComGoogle(@Body() body: { credential: string }) {
    return this.authService.loginComGoogle(body.credential);
  }

  // GET /api/v1/auth/perfil-imobiliario
  @UseGuards(JwtAuthGuard)
  @Get('perfil-imobiliario')
  async getPerfilImobiliario(@Request() req: any) {
    const { rows } = await this.pool.query(
      'SELECT perfil_imobiliario FROM users WHERE id = $1',
      [req.user.sub],
    );
    return rows[0]?.perfil_imobiliario ?? null;
  }

  // PUT /api/v1/auth/perfil-imobiliario
  @UseGuards(JwtAuthGuard)
  @Put('perfil-imobiliario')
  async setPerfilImobiliario(@Request() req: any, @Body() body: any) {
    await this.pool.query(
      'UPDATE users SET perfil_imobiliario = $1 WHERE id = $2',
      [JSON.stringify(body), req.user.sub],
    );
    return { ok: true };
  }
}
