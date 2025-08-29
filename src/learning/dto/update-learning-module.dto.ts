import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsArray } from 'class-validator';
import { DifficultyLevel, ThematiqueCyber } from '../entities/learning-module.entity';

export class UpdateLearningModuleDto {
  @IsString()
  @IsOptional()
  titre?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  public_cible?: string;

  @IsString()
  @IsOptional()
  code_langue?: string;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  niveau_difficulte?: DifficultyLevel;

  @IsEnum(ThematiqueCyber)
  @IsOptional()
  thematique_cyber?: ThematiqueCyber;

  @IsNumber()
  @IsOptional()
  ordre?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  objectifs_apprentissage?: string[];

  @IsString()
  @IsOptional()
  type_contenu?: string;

  @IsNumber()
  @IsOptional()
  duree_minutes?: number;
}
