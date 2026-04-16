import { Body, Controller, Post } from '@nestjs/common';
import { CreateWatchlistItemDto } from './dto/create-watchlist-item.dto';
import { WatchlistService } from './watchlist.service';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  create(@Body() createWatchlistItemDto: CreateWatchlistItemDto) {
    return this.watchlistService.create(createWatchlistItemDto);
  }
}
