import { IsNumber, IsEnum, IsOptional, IsDecimal, IsNotEmpty } from 'class-validator';
import { ProgressStatus } from '../entities/progress.entity';

export class CreateProgressDto {
  @IsNumber()
  @IsNotEmpty()
  utilisateur_id: number;

  @IsNumber()
  @IsNotEmpty()
  module_id: number;

  @IsEnum(ProgressStatus)
  @IsOptional()
  statut?: ProgressStatus;

  @IsDecimal()
  @IsOptional()
  score?: number;

  @IsNumber()
  @IsOptional()
  temps_passe?: number;
}
