import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { ShareSecurityDTO } from "./shareSecurity.dto";

export enum ShareType {
  FILE = "FILE",
  LINK = "LINK",
  PASTE = "PASTE",
}

export class CreateShareDTO {
  @IsString()
  @Matches("^[a-zA-Z0-9_-]*$", undefined, {
    message: "ID can only contain letters, numbers, underscores and hyphens",
  })
  @Length(3, 50)
  id: string;

  @Length(3, 30)
  @IsOptional()
  name: string;

  @IsString()
  expiration: string;

  @MaxLength(512)
  @IsOptional()
  description: string;

  @IsEmail({}, { each: true })
  recipients: string[];

  @ValidateNested()
  @Type(() => ShareSecurityDTO)
  security: ShareSecurityDTO;

  // Share type discriminator (defaults to FILE for backwards compatibility)
  @IsEnum(ShareType)
  @IsOptional()
  shareType?: ShareType;

  // For LINK type - the URL to redirect to
  @ValidateIf((o) => o.shareType === ShareType.LINK)
  @IsUrl({}, { message: "linkUrl must be a valid URL" })
  linkUrl?: string;

  // For PASTE type - the text content
  @ValidateIf((o) => o.shareType === ShareType.PASTE)
  @IsString()
  @MaxLength(1000000) // 1MB text limit
  pasteContent?: string;

  // For PASTE type - syntax highlighting language
  @ValidateIf((o) => o.shareType === ShareType.PASTE)
  @IsString()
  @IsOptional()
  @MaxLength(50)
  pasteSyntax?: string;
}
