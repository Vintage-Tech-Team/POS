import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
    companyId: number;
  };
  companyId?: number;
}

@Injectable()
export class MultiTenantMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Extract company_id from JWT payload (set by JwtStrategy)
    if (req.user && req.user.companyId) {
      req.companyId = req.user.companyId;
    }
    next();
  }
}


