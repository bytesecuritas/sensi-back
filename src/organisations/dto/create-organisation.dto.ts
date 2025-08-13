import { IsString, IsEnum, IsNotEmpty, Length } from 'class-validator';
import { OrganisationType } from '../organisations.entity';

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  nom: string;

  @IsEnum(OrganisationType)
  type: OrganisationType;

  @IsString()
  @IsNotEmpty()
  @Length(1, 3)
  code_pays: string;
}
