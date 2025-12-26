import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachineListingsService } from './machine-listings.service';
import { MachineListingsController } from './machine-listings.controller';
import { MachineListing } from './entities/machine-listing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MachineListing])],
  controllers: [MachineListingsController],
  providers: [MachineListingsService],
  exports: [MachineListingsService],
})
export class MachineListingsModule {}

