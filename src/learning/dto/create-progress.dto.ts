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
  statut?: ProgressStatus = ProgressStatus.NON_COMMENCE;

  @IsDecimal()
  @IsOptional()
  score?: number = 0;

  @IsNumber()
  @IsOptional()
  temps_passe?: number;
}
