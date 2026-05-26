import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse-meal')
  async parseMeal(@Body('text') text: string) {
    return this.aiService.parseMealText(text);
  }

  @Post('coach-advice')
  async getCoachAdvice(@Body() body: { profile: any, meals: any[] }) {
    return {
      advice: await this.aiService.getCoachAdvice(body.profile, body.meals)
    };
  }
}
