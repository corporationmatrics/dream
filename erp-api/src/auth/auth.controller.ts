import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategies/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: { email: string; password: string; name: string },
  ) {
    const nameParts = body.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    return this.authService.registerFromController(body.email, body.password, firstName, lastName);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: any,
    @Body() body: { name?: string; email?: string },
  ) {
    const updateData: any = { email: body.email };
    if (body.name) {
      const nameParts = body.name.trim().split(/\s+/);
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ') || undefined;
    }
    return this.authService.updateProfile(req.user.id, updateData);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.id, body.oldPassword, body.newPassword);
  }
}
