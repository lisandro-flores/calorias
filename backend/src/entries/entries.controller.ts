import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { EntriesService } from './entries.service';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post('sync')
  async syncEntry(@Body() body: { userId: string, date: string, meals: any[], waterGlasses: number }) {
    if (!body.userId) return { success: false, message: 'Missing userId' };
    const saved = await this.entriesService.saveEntry(body.userId, body.date, body.meals, body.waterGlasses);
    return { success: true, data: saved };
  }

  @Get('day')
  async getDayEntry(@Query('date') date: string, @Query('userId') userId: string) {
    if (!userId) return { success: false, message: 'Missing userId' };
    const entry = await this.entriesService.getEntry(userId, date);
    return { success: true, data: entry };
  }
}
