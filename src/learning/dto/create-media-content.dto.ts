import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { AttackType, ContentType } from '../entities/media-content.entity';
import { Type } from '@nestjs/class-transformer';

export class CreateMediaContentDto {
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  module_id?: number;

  @IsEnum(ContentType)
  @IsNotEmpty()
  type_contenu: ContentType;
  
  @IsNumber()
  @IsOptional()
  duree_minutes: number;

  @IsString()
  @IsOptional()
  url_fichier: string;

  @IsString()
  @IsOptional()
  nom_fichier: string;
  
  @IsString()
  @IsOptional()
  chemin_stockage?: string;

  @IsNumber()
  @IsOptional()
  taille_fichier: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsEnum(AttackType)
  @IsOptional()
  type_attaque?: AttackType;

  @IsString()
  @IsOptional()
  thematique_cyber?: string;

}