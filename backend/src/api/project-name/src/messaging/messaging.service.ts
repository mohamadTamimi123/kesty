import { Injectable, NotFoundException, ForbiddenException, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class MessagingService {
  private messagingGateway: any;

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  setGateway(gateway: any) {
    this.messagingGateway = gateway;
  }

  /**
   * Get or create conversation between customer and supplier
   */
  async getOrCreateConversation(
    customerId: string,
    supplierId: string,
  ): Promise<Conversation> {
    // Check if conversation already exists
    let conversation = await this.conversationRepository.findOne({
      where: [
        { customerId, supplierId },
        { customerId: supplierId, supplierId: customerId },
      ],
      relations: ['customer', 'supplier'],
    });

    if (!conversation) {
      // Create new conversation
      conversation = this.conversationRepository.create({
        customerId,
        supplierId,
      });
      conversation = await this.conversationRepository.save(conversation);
    }

    const foundConversation = await this.conversationRepository.findOne({
      where: { id: conversation.id },
      relations: ['customer', 'supplier'],
    });

    if (!foundConversation) {
      throw new NotFoundException('مکالمه یافت نشد');
    }

    return foundConversation;
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    customerId: string,
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      customerId,
      supplierId: createConversationDto.supplierId,
    });

    return await this.conversationRepository.save(conversation);
  }

  /**
   * Get conversations for a user
   */
  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: [{ customerId: userId }, { supplierId: userId }],
      relations: ['customer', 'supplier'],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['customer', 'supplier'],
    });

    if (!conversation) {
      throw new NotFoundException('مکالمه یافت نشد');
    }

    // Check if user is part of this conversation
    if (conversation.customerId !== userId && conversation.supplierId !== userId) {
      throw new ForbiddenException('شما دسترسی به این مکالمه ندارید');
    }

    return conversation;
  }

  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const conversation = await this.getConversationById(
      createMessageDto.conversationId,
      senderId,
    );

    const newMessage = this.messageRepository.create({
      conversationId: createMessageDto.conversationId,
      senderId,
      content: createMessageDto.content,
    });

    const savedMessage = await this.messageRepository.save(newMessage);

    // Update conversation last message time and unread counts
    const isCustomer = conversation.customerId === senderId;
    await this.conversationRepository.update(conversation.id, {
      lastMessageAt: new Date(),
      customerUnreadCount: isCustomer
        ? conversation.customerUnreadCount
        : conversation.customerUnreadCount + 1,
      supplierUnreadCount: isCustomer
        ? conversation.supplierUnreadCount + 1
        : conversation.supplierUnreadCount,
    });

    const retrievedMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'conversation'],
    });

    if (!retrievedMessage) {
      throw new NotFoundException('پیام پس از ذخیره یافت نشد');
    }

    // Emit real-time update via WebSocket
    const updatedConversation = await this.conversationRepository.findOne({
      where: { id: conversation.id },
      relations: ['customer', 'supplier'],
    });
    
    if (updatedConversation && this.messagingGateway) {
      this.messagingGateway.emitNewMessage(updatedConversation, retrievedMessage);
      this.messagingGateway.emitConversationUpdate(conversation.customerId, updatedConversation);
      this.messagingGateway.emitConversationUpdate(conversation.supplierId, updatedConversation);
    }

    return retrievedMessage;
  }

  /**
   * Get messages for a conversation
   */
  async getMessagesForConversation(
    conversationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    const conversation = await this.getConversationById(conversationId, userId);

    return this.messageRepository.find({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const conversation = await this.getConversationById(conversationId, userId);

    // Mark all unread messages as read
    await this.messageRepository.update(
      {
        conversationId,
        senderId: userId === conversation.customerId ? conversation.supplierId : conversation.customerId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    // Update unread counts
    const isCustomer = conversation.customerId === userId;
    await this.conversationRepository.update(conversation.id, {
      customerUnreadCount: isCustomer ? 0 : conversation.customerUnreadCount,
      supplierUnreadCount: isCustomer ? conversation.supplierUnreadCount : 0,
    });

    // Emit real-time update via WebSocket
    const updatedConversation = await this.conversationRepository.findOne({
      where: { id: conversation.id },
      relations: ['customer', 'supplier'],
    });
    
    if (updatedConversation && this.messagingGateway) {
      this.messagingGateway.emitConversationUpdate(userId, updatedConversation);
      const otherUserId = isCustomer ? conversation.supplierId : conversation.customerId;
      this.messagingGateway.emitConversationUpdate(otherUserId, updatedConversation);
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await this.conversationRepository.find({
      where: [{ customerId: userId }, { supplierId: userId }],
    });

    return conversations.reduce((total, conv) => {
      if (conv.customerId === userId) {
        return total + conv.customerUnreadCount;
      } else {
        return total + conv.supplierUnreadCount;
      }
    }, 0);
  }
}

