import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum, IsArray, IsNotEmptyObject, IsDefined, IsOptional, IsString, ArrayNotEmpty, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClusterSingleNodeOptions } from 'src/modules/cli/dto/cli.dto';
import { ClusterNodeRole, RunQueryMode, ResultsMode } from './create-command-execution.dto';

export class CreateCommandExecutionsDto {
  @ApiProperty({
    isArray: true,
    type: String,
    description: 'Redis commands',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsDefined()
  @IsString({ each: true })
  commands: string[];

  @ApiPropertyOptional({
    description: 'Workbench mode',
    default: RunQueryMode.ASCII,
    enum: RunQueryMode,
  })
  @IsOptional()
  @IsEnum(RunQueryMode, {
    message: `mode must be a valid enum value. Valid values: ${Object.values(
      RunQueryMode,
    )}.`,
  })
  mode?: RunQueryMode = RunQueryMode.ASCII;

  @IsOptional()
  @IsEnum(ResultsMode, {
    message: `resultsMode must be a valid enum value. Valid values: ${Object.values(
      ResultsMode,
    )}.`,
  })
  resultsMode?: ResultsMode;

  @ApiPropertyOptional({
    description: 'Execute command for nodes with defined role',
    default: ClusterNodeRole.All,
    enum: ClusterNodeRole,
  })
  @IsOptional()
  @IsEnum(ClusterNodeRole, {
    message: `role must be a valid enum value. Valid values: ${Object.values(
      ClusterNodeRole,
    )}.`,
  })
  role?: ClusterNodeRole;

  @ApiPropertyOptional({
    description:
      'Should be provided if only one node needs to execute the command.',
    type: ClusterSingleNodeOptions,
  })
  @IsOptional()
  @IsNotEmptyObject()
  @Type(() => ClusterSingleNodeOptions)
  @ValidateNested()
  nodeOptions?: ClusterSingleNodeOptions;
}
