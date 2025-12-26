import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  async createConversation(
    @Request() req,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.messagingService.createConversation(
      req.user.id,
      createConversationDto,
    );
  }

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.messagingService.getConversationsForUser(req.user.id);
  }

  @Get('conversations/:id')
  async getConversation(@Request() req, @Param('id') id: string) {
    return this.messagingService.getConversationById(id, req.user.id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Request() req,
    @Param('id') conversationId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.messagingService.getMessagesForConversation(
      conversationId,
      req.user.id,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Post('messages')
  async sendMessage(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    return this.messagingService.sendMessage(req.user.id, createMessageDto);
  }

  @Post('conversations/:id/read')
  async markAsRead(@Request() req, @Param('id') conversationId: string) {
    await this.messagingService.markMessagesAsRead(conversationId, req.user.id);
    return { success: true };
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.messagingService.getUnreadCount(req.user.id);
    return { count };
  }
}

