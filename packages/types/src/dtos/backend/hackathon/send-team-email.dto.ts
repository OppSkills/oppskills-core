import { IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SendTeamEmailDto {
  /** The team ID to send the email to */
  @ApiProperty({
    description: "The team ID to send the email to",
    example: "clx1234567890",
  })
  @IsString()
  teamId: string;

  /** The HTML body of the email */
  @ApiProperty({
    description: "The HTML body of the email",
    example: "<p>Hello team, just a quick update!</p>",
  })
  @IsString()
  @MaxLength(50000)
  htmlBody: string;
}
