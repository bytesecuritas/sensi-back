import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, Min, Max, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReponseDto {
  @IsString()
  texte: string;

  @IsBoolean()
  est_correcte: boolean;

  @IsOptional()
  @IsNumber()
  ordre?: number;

  @IsOptional()
  @IsString()
  explication?: string;
}

export class CreateQuestionDto {
  @IsString()
  enonce: string;

  @IsString()
  type_question: 'choix_unique' | 'choix_multiple' | 'vrai_faux' | 'texte_libre';

  @IsOptional()
  @IsNumber()
  ordre?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  points?: number;

  @IsOptional()
  @IsString()
  explication?: string;

  @ValidateIf(o => o.type_question !== 'texte_libre')
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReponseDto)
  reponses?: CreateReponseDto[];
}

export class CreateQuizDto {
  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  ordre?: number;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  temps_limite_minutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score_minimum_pour_reussite?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
