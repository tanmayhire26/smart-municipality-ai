import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer mock-jwt-token.')) {
      throw new UnauthorizedException('Access denied. Missing or invalid authentication token.');
    }

    const tokenPart = authHeader.split('.')[1];
    if (!tokenPart) {
      throw new UnauthorizedException('Access denied. Malformed token.');
    }

    try {
      const decodedStr = Buffer.from(tokenPart, 'base64').toString('utf8');
      const payload = JSON.parse(decodedStr);

      if (payload.role !== UserRole.ADMIN) {
        throw new UnauthorizedException('Access denied. Administrator privileges required.');
      }

      // Attach user payload to request for controllers if needed
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Access denied. Invalid session token.');
    }
  }
}
