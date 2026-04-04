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

  /** The hackathon name */
  @ApiProperty({
    description: "The hackathon name",
    example: "Tech Innovation Hackathon 2025",
  })
  @IsString()
  @MaxLength(200)
  hackathonName: string;

  /** The hackathon slug */
  @ApiProperty({
    description: "The hackathon slug",
    example: "tech-innovation-2025",
  })
  @IsString()
  @MaxLength(180)
  slug: string;

  /** The team name */
  @ApiProperty({
    description: "The team name",
    example: "Alpha Hackers",
  })
  @IsString()
  @MaxLength(200)
  teamName: string;
}
