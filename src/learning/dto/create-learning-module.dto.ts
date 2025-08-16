import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ContentType, DifficultyLevel } from '../entities/learning-module.entity';

export class CreateLearningModuleDto {
  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ContentType)
  @IsOptional()
  type_contenu?: ContentType;

  @IsString()
  @IsOptional()
  public_cible?: string;

  @IsString()
  @IsNotEmpty()
  code_langue: string;

  @IsNumber()
  @IsNotEmpty()
  duree_minutes: number;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  niveau_difficulte?: DifficultyLevel;

  @IsNumber()
  @IsNotEmpty()
  parcours_id: number;
}
