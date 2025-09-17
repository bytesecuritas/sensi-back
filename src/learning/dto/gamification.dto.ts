import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, IsDateString, IsObject, IsArray } from 'class-validator';
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
  
  @IsOptional()
  icone_file?: Express.Multer.File;

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

export class UpdateBadgeDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(BadgeType)
  type?: BadgeType;

  @IsOptional()
  @IsEnum(BadgeCategory)
  categorie?: BadgeCategory;

  @IsOptional()
  @IsString()
  icone_url?: string;
  
  @IsOptional()
  icone_file?: Express.Multer.File;

  @IsOptional()
  @IsNumber()
  points_requis?: number;

  @IsOptional()
  @IsNumber()
  points_attribues?: number;

  @IsOptional()
  @IsBoolean()
  est_secret?: boolean;

  @IsOptional()
  @IsString()
  conditions_obtention?: string;
}

export class InitBadgesDto {
  @IsString()
  icones_path: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
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
