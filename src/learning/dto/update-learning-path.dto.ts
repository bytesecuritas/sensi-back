import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsArray } from 'class-validator';
import { TargetAudience } from '../entities/learning-path.entity';

export class UpdateLearningPathDto {
  @IsString()
  @IsOptional()
  titre?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TargetAudience)
  @IsOptional()
  public_cible?: TargetAudience;

  @IsNumber()
  @IsOptional()
  duree_estimee_heures?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  prerequis?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  competences_acquises?: string[];
}
