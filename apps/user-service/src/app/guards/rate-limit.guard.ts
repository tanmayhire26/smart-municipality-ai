import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

// Simple sliding/fixed-window memory rate limiter
const registerAttempts = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Get client IP address
    const ip = 
      request.ip || 
      request.headers['x-forwarded-for'] || 
      request.connection?.remoteAddress || 
      '127.0.0.1';

    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes window
    const maxLimit = 5; // Max 5 registration attempts per window

    let record = registerAttempts.get(ip);

    if (!record || now > record.resetTime) {
      // Create new window record
      record = { count: 1, resetTime: now + windowMs };
      registerAttempts.set(ip, record);
      return true;
    }

    if (record.count >= maxLimit) {
      throw new HttpException(
        'Too many registration attempts. Please try again in 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    record.count++;
    return true;
  }
}
