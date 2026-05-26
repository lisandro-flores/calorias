import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { EntriesService } from './entries.service';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post('sync')
  async syncEntry(@Body() body: { date: string, meals: any[], waterGlasses: number }) {
    const saved = await this.entriesService.saveEntry(body.date, body.meals, body.waterGlasses);
    return { success: true, data: saved };
  }

  @Get('day')
  async getDayEntry(@Query('date') date: string) {
    const entry = await this.entriesService.getEntry(date);
    return { success: true, data: entry };
  }
}
