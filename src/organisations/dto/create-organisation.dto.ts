import { IsString, IsEnum, IsNotEmpty, Length, IsOptional, IsEmail, IsUrl, IsDateString } from 'class-validator';
import { OrganisationType } from '../organisations.entity';
import { Type } from '@nestjs/class-transformer';

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  nom: string;

  @IsEnum(OrganisationType)
  type: OrganisationType;

  @IsString()
  @IsNotEmpty()
  @Length(2, 10)
  code_pays: string;

  @IsOptional()
  @Type(() => Date) // important pour transformer la chaîne en Date
  @IsDateString()
  date_creation?: Date;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  telephone?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsUrl()
  site_web?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  code_postal?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  ville?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  pays?: string;

  // Champs optionnels pour compatibilité avec le frontend
  @IsOptional()
  @IsString()
  description?: string;
}
