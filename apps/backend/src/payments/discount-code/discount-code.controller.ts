import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/clerk-auth.guard';
import { DiscountCodeService } from './discount-code.service';
import { CreateDiscountCodeDto, UpdateDiscountCodeDto } from '@oppskills/types';

@Controller('hackathons/:slug/discount-codes')
@UseGuards(ClerkAuthGuard)
export class DiscountCodeController {
  constructor(private readonly discountCodeService: DiscountCodeService) {}

  @Post()
  async createDiscountCode(
    @Param('slug') slug: string,
    @Req() req: { user: { id: string } },
    @Body() body: CreateDiscountCodeDto,
  ) {
    return this.discountCodeService.createDiscountCode({
      hackathonSlug: slug,
      userId: req.user.id,
      ...body,
    });
  }

  @Get()
  async listDiscountCodes(
    @Param('slug') slug: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.discountCodeService.listDiscountCodes(slug, req.user.id);
  }

  @Patch(':codeId')
  async updateDiscountCode(
    @Param('codeId') codeId: string,
    @Req() req: { user: { id: string } },
    @Body() body: UpdateDiscountCodeDto,
  ) {
    return this.discountCodeService.updateDiscountCode({
      codeId,
      userId: req.user.id,
      ...body,
    });
  }

  @Delete(':codeId')
  async deleteDiscountCode(
    @Param('codeId') codeId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.discountCodeService.deleteDiscountCode(codeId, req.user.id);
  }
}
