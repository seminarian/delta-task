import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryParamSearchDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive({ message: 'User ID must be a positive integer' })
  @Transform(({ value }) => parseInt(value, 10))
  userId: number;
}
