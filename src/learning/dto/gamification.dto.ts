import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDateString, IsObject } from 'class-validator';
import { BadgeType, BadgeCategory } from '../entities/badge.entity';
import { UserLevelEnum } from '../entities/user-level.entity';

export class CreateBadgeDto {
  @IsString()
  nom: string;

  @IsString()
  description: string;

  @IsEnum(BadgeType)
  type: BadgeType;

  @IsEnum(BadgeCategory)
  categorie: BadgeCategory;

  @IsOptional()
  @IsString()
  icone_url?: string;

  @IsNumber()
  points_requis: number;

  @IsNumber()
  points_attribues: number;

  @IsOptional()
  @IsBoolean()
  est_secret?: boolean;

  @IsOptional()
  @IsString()
  conditions_obtention?: string;
}

export class UserLevelDto {
  @IsEnum(UserLevelEnum)
  niveau_actuel: UserLevelEnum;

  @IsNumber()
  points_totaux: number;

  @IsNumber()
  points_niveau_actuel: number;

  @IsNumber()
  points_pour_niveau_suivant: number;

  @IsNumber()
  modules_completes: number;

  @IsNumber()
  quiz_reussis: number;

  @IsNumber()
  simulations_reussies: number;

  @IsNumber()
  jours_consecutifs: number;
}

export class DashboardDto {
  @IsObject()
  userLevel: UserLevelDto;

  @IsNumber()
  progression_globale: number;

  @IsNumber()
  classement_equipe: number;

  @IsNumber()
  total_utilisateurs: number;

  @IsObject()
  badges_obtenus: object[];

  @IsObject()
  badges_disponibles: object[];

  @IsObject()
  modules_recommandes: object[];

  @IsObject()
  defis_actifs: object[];

  @IsObject()
  alertes_recentes: object[];
}
