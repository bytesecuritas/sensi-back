import { IsString, IsEnum, IsNotEmpty, Length, IsOptional } from 'class-validator';
import { OrganisationType } from '../organisations.entity';
import { IsDate } from '@nestjs/class-validator';
import { Type } from '@nestjs/class-transformer';

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  nom: string;

  @IsEnum(OrganisationType)
  type: OrganisationType;

  @IsNotEmpty()
  @Type(() => Date) // important pour transformer la chaîne en Date
  @IsDate()
  date_creation: Date;

  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  code_pays: string;

  // Champs optionnels pour compatibilité avec le frontend
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  site_web?: string;

  @IsString()
  @IsOptional()
  code_postal?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  pays?: string;
}
