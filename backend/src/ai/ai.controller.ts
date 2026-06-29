import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CoachAdviceDto, ParseMealDto } from './dto/ai.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly rateLimit: AiRateLimitService,
  ) {}

  @Post('parse-meal')
  async parseMeal(@Req() req: AuthenticatedRequest, @Body() body: ParseMealDto) {
    this.rateLimit.assertAllowed(req.user.id);
    return this.aiService.parseMealText(body.text);
  }

  @Post('coach-advice')
  async getCoachAdvice(
    @Req() req: AuthenticatedRequest,
    @Body() body: CoachAdviceDto,
  ) {
    this.rateLimit.assertAllowed(req.user.id);
    return {
      advice: await this.aiService.getCoachAdvice(body.profile, body.meals)
    };
  }
}
