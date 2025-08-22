import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsArray } from 'class-validator';
import { DifficultyLevel, ThematiqueCyber } from '../entities/learning-module.entity';

export class CreateLearningModuleDto {
  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  public_cible?: string;

  @IsString()
  @IsNotEmpty()
  code_langue: string;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  niveau_difficulte?: DifficultyLevel;

  @IsEnum(ThematiqueCyber)
  @IsOptional()
  thematique_cyber?: ThematiqueCyber;

  @IsNumber()
  @IsNotEmpty()
  parcours_id: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  objectifs_apprentissage?: string[];
}
