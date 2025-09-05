import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SwaggerAuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Vérifier si c'est une requête vers Swagger
    if (req.path.startsWith('/api/docs')) {
      // Vérifier le token d'authentification
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Rediriger vers la page de connexion si pas de token
        return res.redirect('/api/auth/swagger-login');
      }

      try {
        const token = authHeader.substring(7); // Enlever "Bearer "
        const payload = this.jwtService.verify(token);
        
        // Vérifier que l'utilisateur est superadmin
        if (payload.role !== 'superadmin') {
          return res.redirect('/api/auth/swagger-login?error=unauthorized');
        }
        
        // Token valide et superadmin, continuer
        next();
      } catch (error) {
        // Token invalide, rediriger vers la connexion
        return res.redirect('/api/auth/swagger-login?error=invalid_token');
      }
    } else {
      // Pas une requête Swagger, continuer normalement
      next();
    }
  }
}
