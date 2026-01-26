import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import type { AiChatPayload, OverviewAnalytics } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../users/entities/user.entity';
import { AiChatRequestDto } from './dto/ai-chat-request.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('overview')
    getOverview(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>): Promise<OverviewAnalytics> {
        return this.analyticsService.getOverview(user.id);
    }

    @Post('insights/chat')
    generateAiChat(
        @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
        @Body() input: AiChatRequestDto,
    ): Promise<AiChatPayload> {
        return this.analyticsService.generateAiInsightsChat(user.id, input);
    }
}
