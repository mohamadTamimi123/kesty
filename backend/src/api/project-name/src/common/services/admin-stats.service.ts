import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { Project, ProjectStatus } from '../../projects/entities/project.entity';
import { Conversation } from '../../messaging/entities/conversation.entity';
import { Message } from '../../messaging/entities/message.entity';
import { Quote, QuoteStatus } from '../../quotes/entities/quote.entity';
import { SupplierRating } from '../../rating/entities/supplier-rating.entity';

@Injectable()
export class AdminStatsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(SupplierRating)
    private ratingRepository: Repository<SupplierRating>,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalSuppliers,
      totalCustomers,
      activeProjects,
      totalProjects,
      newMessages,
      totalConversations,
      recentUsers,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: UserRole.SUPPLIER } }),
      this.userRepository.count({ where: { role: UserRole.CUSTOMER } }),
      this.projectRepository.count({
        where: { status: ProjectStatus.IN_PROGRESS },
      }),
      this.projectRepository.count(),
      this.messageRepository
        .createQueryBuilder('message')
        .where('message.createdAt > :date', {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .getCount(),
      this.conversationRepository.count(),
      this.userRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      totalUsers,
      totalSuppliers,
      totalCustomers,
      activeProjects,
      totalProjects,
      newMessages,
      totalConversations,
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      })),
    };
  }

  async getAnalyticsStats(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const [
      projectsByStatus,
      quotesByStatus,
      projectsOverTime,
      quotesOverTime,
      supplierRatingsDistribution,
      conversionRate,
    ] = await Promise.all([
      // Projects by status
      this.projectRepository
        .createQueryBuilder('project')
        .select('project.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('project.createdAt BETWEEN :start AND :end', { start, end })
        .groupBy('project.status')
        .getRawMany(),

      // Quotes by status
      this.quoteRepository
        .createQueryBuilder('quote')
        .select('quote.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('quote.createdAt BETWEEN :start AND :end', { start, end })
        .groupBy('quote.status')
        .getRawMany(),

      // Projects over time (daily)
      this.projectRepository
        .createQueryBuilder('project')
        .select('DATE(project.createdAt)', 'date')
        .addSelect('COUNT(*)', 'count')
        .where('project.createdAt BETWEEN :start AND :end', { start, end })
        .groupBy('DATE(project.createdAt)')
        .orderBy('DATE(project.createdAt)', 'ASC')
        .getRawMany(),

      // Quotes over time (daily)
      this.quoteRepository
        .createQueryBuilder('quote')
        .select('DATE(quote.createdAt)', 'date')
        .addSelect('COUNT(*)', 'count')
        .where('quote.createdAt BETWEEN :start AND :end', { start, end })
        .groupBy('DATE(quote.createdAt)')
        .orderBy('DATE(quote.createdAt)', 'ASC')
        .getRawMany(),

      // Supplier ratings distribution
      this.ratingRepository
        .createQueryBuilder('rating')
        .select('CASE WHEN rating.totalScore >= 80 THEN \'80-100\' WHEN rating.totalScore >= 60 THEN \'60-79\' WHEN rating.totalScore >= 40 THEN \'40-59\' ELSE \'0-39\' END', 'range')
        .addSelect('COUNT(*)', 'count')
        .groupBy('range')
        .getRawMany(),

      // Conversion rate (PENDING to COMPLETED)
      this.projectRepository
        .createQueryBuilder('project')
        .select('COUNT(*)', 'total')
        .where('project.status = :status', { status: ProjectStatus.COMPLETED })
        .andWhere('project.createdAt BETWEEN :start AND :end', { start, end })
        .getRawOne(),
    ]);

    const totalProjects = await this.projectRepository.count({
      where: {
        createdAt: Between(start, end),
      },
    });

    const conversionRateValue = totalProjects > 0 
      ? (parseInt(conversionRate?.total || '0') / totalProjects) * 100 
      : 0;

    return {
      projectsByStatus,
      quotesByStatus,
      projectsOverTime,
      quotesOverTime,
      supplierRatingsDistribution,
      conversionRate: Math.round(conversionRateValue * 100) / 100,
    };
  }
}


