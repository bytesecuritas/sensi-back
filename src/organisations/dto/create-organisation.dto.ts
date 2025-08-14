import { IsString, IsEnum, IsNotEmpty, Length, MaxDate } from 'class-validator';
import { OrganisationType } from '../organisations.entity';
import { IsDate } from '@nestjs/class-validator';
import { Type } from '@nestjs/class-transformer';

export class CreateOrganisationDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  nom: string;

  @IsEnum(OrganisationType)
  type: OrganisationType;

  @IsNotEmpty()
  @Type(() => Date) // important pour transformer la chaîne en Date
  @IsDate()
  @MaxDate(new Date()) // date maximale
  date_creation: Date;

  @IsString()
  @IsNotEmpty()
  @Length(1, 3)
  code_pays: string;
}
