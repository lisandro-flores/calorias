import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { SyncEntryDto } from './dto/sync-entry.dto';

@Controller('entries')
@UseGuards(JwtAuthGuard)
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post('sync')
  async syncEntry(
    @Body() body: SyncEntryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.entriesService.saveEntry(
      req.user.id,
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
  async getDayEntry(@Query('date') date: string, @Req() req: AuthenticatedRequest) {
    const entry = await this.entriesService.getEntry(req.user.id, date);
    return { success: true, data: entry };
  }

  @Get('range')
  async getRangeEntries(@Req() req: AuthenticatedRequest, @Query('days') days = '30') {
    const parsedDays = Number(days) || 30;
    const entries = await this.entriesService.getRecentEntries(req.user.id, parsedDays);
    return { success: true, data: entries.reverse() };
  }
}
