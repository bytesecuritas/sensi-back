import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class UserCreationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { user, body } = request;

    // Si pas d'utilisateur authentifié, refuser
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Récupérer le rôle que l'utilisateur essaie de créer
    const roleToCreate = body?.role;

    // Règles de création d'utilisateurs
    switch (user.role) {
      case 'superadmin':
        // Le superadmin peut créer tous les types d'utilisateurs
        return true;
      
      case 'admin':
        // L'admin peut créer des users mais pas d'autres admin ou superadmin
        if (roleToCreate === 'admin' || roleToCreate === 'superadmin') {
          throw new ForbiddenException('Admins cannot create other admins or superadmins');
        }
        return true;
      
      case 'user':
        // Les users ne peuvent pas créer d'autres utilisateurs
        throw new ForbiddenException('Users cannot create other users');
      
      default:
        throw new ForbiddenException('Invalid role');
    }
  }
}
