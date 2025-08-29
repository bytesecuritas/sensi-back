import { IsNumber, IsString, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ReponseQuestionDto {
  @IsNumber()
  question_id: number;

  @IsOptional()
  @IsNumber()
  reponse_id?: number;

  @IsOptional()
  @IsString()
  reponse_texte?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  reponses_multiple?: number[];

  @IsOptional()
  @IsBoolean()
  reponse_vrai_faux?: boolean;
}

export class SubmitQuizResponseDto {
  @IsNumber()
  quiz_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReponseQuestionDto)
  reponses: ReponseQuestionDto[];

  @IsOptional()
  @IsNumber()
  temps_total_secondes?: number;
}
