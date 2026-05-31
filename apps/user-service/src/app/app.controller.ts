import { Controller, Get, Post, Put, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { UserRole } from './entities/user.entity';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(RateLimitGuard)
  @Post('auth/register')
  register(@Body() registerDto: any) {
    return this.appService.registerCitizen(registerDto);
  }

  @UseGuards(AdminGuard)
  @Post('users/admin/create-user')
  createAdminUser(@Body() createUserDto: any) {
    return this.appService.createAdminUser(createUserDto);
  }

  @Post('auth/login')
  login(@Body() loginDto: any) {
    return this.appService.login(loginDto);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.appService.getUserById(id);
  }

  @Get('users')
  getUsers(
    @Query('role') role?: UserRole,
    @Query('wardNumber') wardNumber?: string
  ) {
    const ward = wardNumber ? parseInt(wardNumber, 10) : undefined;
    return this.appService.getUsers(role, ward);
  }

  @Get('wards')
  getWards() {
    return this.appService.getWards();
  }

  @Get('wards/:id')
  getWard(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getWardById(id);
  }

  @Put('users/:id/rating')
  rateNagarsevak(
    @Param('id') id: string,
    @Body('rating') rating: number
  ) {
    return this.appService.rateNagarsevak(id, rating);
  }
}
