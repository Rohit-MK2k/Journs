import { Controller, Get, Query, Req } from '@nestjs/common';
import { SemanticSearchService } from '../../services/semantic-search.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly semanticSearchService: SemanticSearchService,
  ) {}

  @Get()
  async semanticSearch(@Req() req: any, @Query('q') query: string) {
    if (!query) {
      return { matches: [] };
    }
    
    const matches = await this.semanticSearchService.search(req.user.uid, query);
    return { matches };
  }
}
