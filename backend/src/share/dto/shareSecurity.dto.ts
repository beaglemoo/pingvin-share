import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from "class-validator";

export class ShareSecurityDTO {
  @IsString()
  @IsOptional()
  @Length(3, 30)
  password: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(999999)
  maxViews: number;
}
