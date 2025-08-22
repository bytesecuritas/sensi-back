import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { TargetAudience } from '../entities/learning-path.entity';

export class CreateLearningPathDto {
  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TargetAudience)
  @IsOptional()
  public_cible?: TargetAudience;

  @IsNumber()
  @IsOptional()
  @Min(0)
  duree_estimee_heures?: number;
}
