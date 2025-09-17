import { IsOptional, IsEnum, IsNumber, IsString, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  RADAR = 'radar',
}

export class AnalyticsQueryDto {
  @ApiProperty({ required: false, enum: TimeRange, default: TimeRange.MONTH })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.MONTH;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organisationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  learningPathId?: string;
}

export class DashboardQueryDto extends AnalyticsQueryDto {
  @ApiProperty({ required: false, enum: ChartType, default: ChartType.LINE })
  @IsOptional()
  @IsEnum(ChartType)
  chartType?: ChartType = ChartType.LINE;
}

export class ExportQueryDto extends AnalyticsQueryDto {
  @ApiProperty({ required: true, enum: ['csv', 'excel', 'pdf'] })
  @IsString()
  format: 'csv' | 'excel' | 'pdf';
}
