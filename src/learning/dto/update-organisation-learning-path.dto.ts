import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateOrganisationLearningPathDto {
  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
