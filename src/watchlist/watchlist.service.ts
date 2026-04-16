import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWatchlistItemDto } from './dto/create-watchlist-item.dto';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  create(createWatchlistItemDto: CreateWatchlistItemDto) {
    return this.prisma.watchlistItem.create({
      data: {
        symbol: createWatchlistItemDto.symbol.toUpperCase(),
        companyName: createWatchlistItemDto.companyName,
      },
    });
  }

  findAll() {
    return this.prisma.watchlistItem.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  removeBySymbol(symbol: string) {
    return this.prisma.watchlistItem.delete({
      where: {
        symbol: symbol.toUpperCase(),
      },
    });
  }
}
