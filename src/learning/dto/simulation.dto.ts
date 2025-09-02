import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDateString, IsObject } from 'class-validator';
import { SimulationType, SimulationStatus } from '../entities/simulation.entity';
import { SimulationResponseStatus } from '../entities/simulation-response.entity';

export class CreateSimulationDto {
  @IsString()
  titre: string;

  @IsString()
  description: string;

  @IsEnum(SimulationType)
  type: SimulationType;

  @IsString()
  contenu_simulation: string;

  @IsOptional()
  @IsObject()
  parametres_simulation?: object;

  @IsNumber()
  points_reussite: number;

  @IsNumber()
  points_echec: number;

  @IsNumber()
  duree_estimee: number;

  @IsOptional()
  @IsBoolean()
  est_obligatoire?: boolean;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  feedback_succes?: string;

  @IsOptional()
  @IsString()
  feedback_echec?: string;
}

export class SimulationResponseDto {
  @IsNumber()
  simulation_id: number;

  @IsString()
  reponse_utilisateur: string;

  @IsOptional()
  @IsObject()
  details_reponse?: object;
}

export class SimulationResultDto {
  @IsEnum(SimulationResponseStatus)
  statut: SimulationResponseStatus;

  @IsNumber()
  points_gagnes: number;

  @IsString()
  feedback: string;

  @IsNumber()
  temps_reponse: number;

  @IsOptional()
  @IsObject()
  badges_debloques?: object[];

  @IsOptional()
  @IsObject()
  comparaison_equipe?: object;
}
