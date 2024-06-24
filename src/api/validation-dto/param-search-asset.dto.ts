import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class ParamSearchDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive({ message: 'Asset ID must be a positive integer' })
  @Transform(({ value }) => parseInt(value, 10))
  assetId: number;
}
