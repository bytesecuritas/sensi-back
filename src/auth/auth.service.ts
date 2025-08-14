import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/users.entity';
import { CreateUserDto } from '../users/dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Partial<User>) {
    const payload = { email: user.email, sub: user.users_id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(email: string, password: string, nom: string, prenom: string, age: number, role: string ='user', code_langue: string = 'FR', organisation_id?: string) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const createUserDto: CreateUserDto = {
      email,
      password: hashedPassword,
      nom,
      prenom,
      role: role as any,
      age,
      code_langue,
      organisation_id
    };

    const user = await this.usersService.createWithOrganisation(createUserDto);
    
    // retourne le user créer avec le mot de passe non hashé
    return {
      ...user,
      password: password,
    };
  }
}