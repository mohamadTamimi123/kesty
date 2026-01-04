import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteRankingService } from './quote-ranking.service';
import { CacheService } from '../common/services/cache.service';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class QuotesService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(Quote)
    private quotesRepository: Repository<Quote>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private quoteRankingService: QuoteRankingService,
    private cacheService: CacheService,
    @Inject(forwardRef(() => MessagingService))
    private messagingService: MessagingService,
  ) {}

  /**
   * Create a new quote
   */
  async create(supplierId: string, createQuoteDto: CreateQuoteDto): Promise<Quote> {
    // Check if project exists
    const project = await this.projectsRepository.findOne({
      where: { id: createQuoteDto.projectId },
      relations: ['customer'],
    });

    if (!project) {
      throw new NotFoundException('پروژه یافت نشد');
    }

    // Check if project is still pending
    if (project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException('این پروژه دیگر درخواست پیشنهاد نمی‌پذیرد');
    }

    // Check if supplier already has a quote for this project
    const existingQuote = await this.quotesRepository.findOne({
      where: {
        projectId: createQuoteDto.projectId,
        supplierId,
        status: QuoteStatus.PENDING,
      },
    });

    if (existingQuote) {
      throw new BadRequestException('شما قبلاً برای این پروژه پیشنهاد ارسال کرده‌اید');
    }

    // Create quote
    const quote = this.quotesRepository.create({
      projectId: createQuoteDto.projectId,
      supplierId,
      price: createQuoteDto.price,
      description: createQuoteDto.description || null,
      deliveryTimeDays: createQuoteDto.deliveryTimeDays || null,
      status: QuoteStatus.PENDING,
    });

    const savedQuote = await this.quotesRepository.save(quote);
    
    // Invalidate cache for project quotes
    await this.cacheService.invalidate(`quotes:project:${createQuoteDto.projectId}`);
    await this.cacheService.invalidate(`quotes:supplier:${supplierId}`);
    
    // Send quote message to customer conversation
    try {
      const customerId = project.customerId || project.customer?.id;
      if (customerId) {
        // Get or create conversation between supplier and customer
        const conversation = await this.messagingService.getOrCreateConversation(
          customerId,
          supplierId,
        );

        // Format quote message
        const priceFormatted = new Intl.NumberFormat('fa-IR').format(savedQuote.price);
        const deliveryText = savedQuote.deliveryTimeDays 
          ? `\nزمان تحویل: ${savedQuote.deliveryTimeDays} روز` 
          : '';
        const descriptionText = savedQuote.description || '';
        
        const quoteMessage = `پیشنهاد جدید برای شما\n\n` +
          `پروژه: ${project.title}\n` +
          `قیمت: ${priceFormatted} تومان${deliveryText}` +
          (descriptionText ? `\n\n${descriptionText}` : '');

        // Create message with quote metadata
        await this.messagingService.sendMessage(supplierId, {
          conversationId: conversation.id,
          content: quoteMessage,
          metadata: {
            type: 'quote',
            quoteId: savedQuote.id,
            projectId: project.id,
            projectTitle: project.title,
            price: savedQuote.price,
            deliveryTimeDays: savedQuote.deliveryTimeDays,
            description: savedQuote.description,
          },
        });
      }
    } catch (error) {
      // Log error but don't fail quote creation
      console.error('Error sending quote message to conversation:', error);
    }
    
    return savedQuote;
  }

  /**
   * Get all quotes for a project (customer view)
   */
  async getQuotesForProject(
    projectId: string,
    customerId: string,
  ): Promise<Quote[]> {
    // Verify project belongs to customer using QueryBuilder
    const projectQuery = this.projectsRepository
      .createQueryBuilder('project')
      .select(['project.id', 'project.customerId'])
      .where('project.id = :projectId', { projectId })
      .getOne();

    const project = await projectQuery;

    if (!project) {
      throw new NotFoundException('پروژه یافت نشد');
    }

    if (project.customerId !== customerId) {
      throw new ForbiddenException('شما دسترسی به این پروژه ندارید');
    }

    // Use cache for frequently accessed quotes
    const cacheKey = `quotes:project:${projectId}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Use QueryBuilder to load only needed fields
        const quotes = await this.quotesRepository
          .createQueryBuilder('quote')
          .leftJoinAndSelect('quote.supplier', 'supplier')
          .leftJoinAndSelect('quote.project', 'project')
          .where('quote.projectId = :projectId', { projectId })
          .select([
            'quote.id',
            'quote.projectId',
            'quote.supplierId',
            'quote.price',
            'quote.description',
            'quote.deliveryTimeDays',
            'quote.status',
            'quote.createdAt',
            'quote.updatedAt',
            'supplier.id',
            'supplier.fullName',
            'supplier.phone',
            'supplier.email',
            'project.id',
            'project.title',
          ])
          .orderBy('quote.createdAt', 'DESC')
          .getMany();

        // Rank quotes
        return await this.quoteRankingService.rankQuotes(quotes);
      },
      this.CACHE_TTL,
    );
  }

  /**
   * Get all quotes for a supplier
   */
  async getQuotesForSupplier(supplierId: string): Promise<Quote[]> {
    return await this.quotesRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.project', 'project')
      .leftJoinAndSelect('project.category', 'category')
      .leftJoinAndSelect('project.city', 'city')
      .where('quote.supplierId = :supplierId', { supplierId })
      .select([
        'quote.id',
        'quote.projectId',
        'quote.supplierId',
        'quote.price',
        'quote.description',
        'quote.deliveryTimeDays',
        'quote.status',
        'quote.createdAt',
        'quote.updatedAt',
        'project.id',
        'project.title',
        'project.description',
        'project.status',
        'project.createdAt',
        'category.id',
        'category.title',
        'category.slug',
        'city.id',
        'city.title',
        'city.slug',
      ])
      .orderBy('quote.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get a single quote by ID
   */
  async findOne(quoteId: string, userId: string): Promise<Quote> {
    const quote = await this.quotesRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.supplier', 'supplier')
      .leftJoinAndSelect('quote.project', 'project')
      .leftJoinAndSelect('project.customer', 'customer')
      .where('quote.id = :quoteId', { quoteId })
      .select([
        'quote.id',
        'quote.projectId',
        'quote.supplierId',
        'quote.price',
        'quote.description',
        'quote.deliveryTimeDays',
        'quote.status',
        'quote.createdAt',
        'quote.updatedAt',
        'supplier.id',
        'supplier.fullName',
        'supplier.phone',
        'supplier.email',
        'project.id',
        'project.title',
        'project.description',
        'project.customerId',
        'customer.id',
        'customer.fullName',
        'customer.phone',
      ])
      .getOne();

    if (!quote) {
      throw new NotFoundException('پیشنهاد یافت نشد');
    }

    // Check access: supplier can see their own quotes, customer can see quotes for their projects
    if (
      quote.supplierId !== userId &&
      quote.project.customerId !== userId
    ) {
      throw new ForbiddenException('شما دسترسی به این پیشنهاد ندارید');
    }

    return quote;
  }

  /**
   * Update a quote
   */
  async update(
    quoteId: string,
    supplierId: string,
    updateQuoteDto: UpdateQuoteDto,
  ): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({
      where: { id: quoteId },
      relations: ['project'],
    });

    if (!quote) {
      throw new NotFoundException('پیشنهاد یافت نشد');
    }

    if (quote.supplierId !== supplierId) {
      throw new ForbiddenException('شما نمی‌توانید این پیشنهاد را ویرایش کنید');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('فقط پیشنهادهای در انتظار قابل ویرایش هستند');
    }

    // Check if project is still pending
    if (quote.project.status !== ProjectStatus.PENDING) {
      throw new BadRequestException('این پروژه دیگر درخواست پیشنهاد نمی‌پذیرد');
    }

    Object.assign(quote, updateQuoteDto);
    const updatedQuote = await this.quotesRepository.save(quote);
    
    // Invalidate cache
    await this.cacheService.invalidate(`quotes:project:${quote.projectId}`);
    await this.cacheService.invalidate(`quotes:supplier:${supplierId}`);
    
    return updatedQuote;
  }

  /**
   * Accept a quote (customer action)
   */
  async acceptQuote(quoteId: string, customerId: string): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({
      where: { id: quoteId },
      relations: ['project', 'supplier'],
    });

    if (!quote) {
      throw new NotFoundException('پیشنهاد یافت نشد');
    }

    if (quote.project.customerId !== customerId) {
      throw new ForbiddenException('شما نمی‌توانید این پیشنهاد را بپذیرید');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('این پیشنهاد قبلاً پردازش شده است');
    }

    // Reject all other quotes for this project
    const otherQuotes = await this.quotesRepository.find({
      where: {
        projectId: quote.projectId,
        status: QuoteStatus.PENDING,
      },
    });

    for (const otherQuote of otherQuotes) {
      if (otherQuote.id !== quoteId) {
        otherQuote.status = QuoteStatus.REJECTED;
        otherQuote.rejectedAt = new Date();
        await this.quotesRepository.save(otherQuote);
      }
    }

    // Accept this quote
    quote.status = QuoteStatus.ACCEPTED;
    quote.acceptedAt = new Date();

    // Update project status
    quote.project.status = ProjectStatus.IN_PROGRESS;
    await this.projectsRepository.save(quote.project);

    const savedQuote = await this.quotesRepository.save(quote);
    
    // Invalidate cache
    await this.cacheService.invalidate(`quotes:project:${quote.projectId}`);
    await this.cacheService.invalidate(`quotes:supplier:${quote.supplierId}`);
    
    return savedQuote;
  }

  /**
   * Reject a quote (customer action)
   */
  async rejectQuote(quoteId: string, customerId: string): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({
      where: { id: quoteId },
      relations: ['project'],
    });

    if (!quote) {
      throw new NotFoundException('پیشنهاد یافت نشد');
    }

    if (quote.project.customerId !== customerId) {
      throw new ForbiddenException('شما نمی‌توانید این پیشنهاد را رد کنید');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('این پیشنهاد قبلاً پردازش شده است');
    }

    quote.status = QuoteStatus.REJECTED;
    quote.rejectedAt = new Date();

    return await this.quotesRepository.save(quote);
  }

  /**
   * Withdraw a quote (supplier action)
   */
  async withdrawQuote(quoteId: string, supplierId: string): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new NotFoundException('پیشنهاد یافت نشد');
    }

    if (quote.supplierId !== supplierId) {
      throw new ForbiddenException('شما نمی‌توانید این پیشنهاد را لغو کنید');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('فقط پیشنهادهای در انتظار قابل لغو هستند');
    }

    quote.status = QuoteStatus.WITHDRAWN;
    return await this.quotesRepository.save(quote);
  }

  /**
   * Delete a quote (admin or supplier before acceptance)
   */
  async remove(quoteId: string, userId: string, userRole: string): Promise<void> {
    const quote = await this.quotesRepository.findOne({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new NotFoundException('پیشنهاد یافت نشد');
    }

    // Only admin or supplier (before acceptance) can delete
    if (
      userRole !== 'ADMIN' &&
      (quote.supplierId !== userId || quote.status !== QuoteStatus.PENDING)
    ) {
      throw new ForbiddenException('شما نمی‌توانید این پیشنهاد را حذف کنید');
    }

    await this.quotesRepository.remove(quote);
  }

  /**
   * Get quote statistics for a project
   */
  async getQuoteStats(projectId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
  }> {
    const quotes = await this.quotesRepository.find({
      where: { projectId },
    });

    const prices = quotes.map((q) => Number(q.price));
    const averagePrice =
      prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

    return {
      total: quotes.length,
      pending: quotes.filter((q) => q.status === QuoteStatus.PENDING).length,
      accepted: quotes.filter((q) => q.status === QuoteStatus.ACCEPTED).length,
      rejected: quotes.filter((q) => q.status === QuoteStatus.REJECTED).length,
      averagePrice: Math.round(averagePrice * 100) / 100,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    };
  }
}

