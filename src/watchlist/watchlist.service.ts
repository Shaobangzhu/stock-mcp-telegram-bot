import { Injectable, NotFoundException } from '@nestjs/common';
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

  async removeBySymbol(symbol: string) {
    const normalizedSymbol = symbol.toUpperCase();

    const existingItem = await this.prisma.watchlistItem.findUnique({
      where: {
        symbol: normalizedSymbol,
      },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `Watchlist item with symbol ${symbol} not found`,
      );
    }

    return this.prisma.watchlistItem.delete({
      where: {
        symbol: normalizedSymbol,
      },
    });
  }
}
