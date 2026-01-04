import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  /**
   * Create a new quote (supplier)
   */
  @Post()
  @Roles(UserRole.SUPPLIER)
  @UseGuards(RolesGuard)
  async create(@Request() req, @Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(req.user.id, createQuoteDto);
  }

  /**
   * Get all quotes for current supplier (must be before :id route)
   */
  @Get('supplier/my-quotes')
  @Roles(UserRole.SUPPLIER)
  @UseGuards(RolesGuard)
  async getMyQuotes(@Request() req) {
    return this.quotesService.getQuotesForSupplier(req.user.id);
  }

  /**
   * Get quote statistics for a project (must be before :id route)
   */
  @Get('project/:projectId/stats')
  async getQuoteStats(@Param('projectId') projectId: string) {
    return this.quotesService.getQuoteStats(projectId);
  }

  /**
   * Get all quotes for a project (customer) (must be before :id route)
   */
  @Get('project/:projectId')
  async getQuotesForProject(
    @Request() req,
    @Param('projectId') projectId: string,
  ) {
    return this.quotesService.getQuotesForProject(projectId, req.user.id);
  }

  /**
   * Get a single quote (must be last as it matches any :id)
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.quotesService.findOne(id, req.user.id);
  }

  /**
   * Update a quote (supplier)
   */
  @Put(':id')
  @Roles(UserRole.SUPPLIER)
  @UseGuards(RolesGuard)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(id, req.user.id, updateQuoteDto);
  }

  /**
   * Accept a quote (customer)
   */
  @Post(':id/accept')
  @Roles(UserRole.CUSTOMER)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async acceptQuote(@Request() req, @Param('id') id: string) {
    return this.quotesService.acceptQuote(id, req.user.id);
  }

  /**
   * Reject a quote (customer)
   */
  @Post(':id/reject')
  @Roles(UserRole.CUSTOMER)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async rejectQuote(@Request() req, @Param('id') id: string) {
    return this.quotesService.rejectQuote(id, req.user.id);
  }

  /**
   * Withdraw a quote (supplier)
   */
  @Post(':id/withdraw')
  @Roles(UserRole.SUPPLIER)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async withdrawQuote(@Request() req, @Param('id') id: string) {
    return this.quotesService.withdrawQuote(id, req.user.id);
  }

  /**
   * Delete a quote (admin or supplier)
   */
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.quotesService.remove(id, req.user.id, req.user.role);
    return { success: true };
  }
}

