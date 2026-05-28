import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { EntriesService } from './entries.service';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post('sync')
  async syncEntry(
    @Body()
    body: {
      userId: string;
      date: string;
      meals: any[];
      waterGlasses: number;
      clientUpdatedAt?: string;
      expectedVersion?: number; // Fase 3
    },
  ) {
    if (!body.userId) return { success: false, message: 'Missing userId' };
    const result = await this.entriesService.saveEntry(
      body.userId,
      body.date,
      body.meals,
      body.waterGlasses,
      body.clientUpdatedAt,
      body.expectedVersion, // Fase 3
    );
    return {
      success: true,
      data: result.entry,
      merged: result.merged, // Fase 3: flag indicating if merge happened
      version: result.entry?.version ?? 0,
    };
  }

  @Get('day')
  async getDayEntry(@Query('date') date: string, @Query('userId') userId: string) {
    if (!userId) return { success: false, message: 'Missing userId' };
    const entry = await this.entriesService.getEntry(userId, date);
    return { success: true, data: entry };
  }

  @Get('range')
  async getRangeEntries(@Query('userId') userId: string, @Query('days') days = '30') {
    if (!userId) return { success: false, message: 'Missing userId' };
    const parsedDays = Number(days) || 30;
    const entries = await this.entriesService.getRecentEntries(userId, parsedDays);
    return { success: true, data: entries.reverse() };
  }
}
