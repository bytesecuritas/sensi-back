import { IsEmail, IsString, MinLength, IsNotEmpty, IsNumber, IsOptional, Min, IsEnum, ValidateIf } from 'class-validator';
import { IsNumberString } from 'class-validator';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  prenom: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  age: number;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  code_langue?: string;

  @ValidateIf(o => o.role !== 'superadmin')
  @IsNumberString()
  @IsNotEmpty()
  organisation_id?: string;
}
