/**
 * Search Engine
 * Handles search logic, scoring, and result enhancement
 */

import {
  BGGSearchResponse,
  BGGSearchItem,
  SearchFilters,
  BGGDataUtils,
} from '@/types/bgg.types';

export class SearchEngine {
  /**
   * Enhance search results with scoring and relevance factors
   */
  enhanceSearchResults(
    results: BGGSearchResponse,
    query: string,
    strategy: 'exact' | 'fuzzy'
  ): BGGSearchResponse {
    const enhancedItems = results.items.map(item => {
      const relevanceFactors = this.calculateRelevanceFactors(item, query);
      const searchScore = this.calculateSearchScore(
        item,
        query,
        relevanceFactors
      );
      const isExactMatch = this.isExactMatch(item, query);

      // Classify game type
      const typeClassification = this.classifyGameType(item);

      const enhancedItem: BGGSearchItem = {
        ...item,
        searchScore,
        isExactMatch,
        isExpansion: typeClassification.isExpansion,
        hasInboundExpansionLink: typeClassification.hasInboundExpansionLink,
        correctedType: typeClassification.correctedType,
        relevanceFactors,
      };

      // Compute additional fields using BGGDataUtils
      return BGGDataUtils.computeSearchItemFields(enhancedItem);
    });

    return {
      ...results,
      items: enhancedItems,
      searchStrategy: strategy,
    };
  }

  /**
   * Calculate relevance factors for a search item
   */
  private calculateRelevanceFactors(
    item: BGGSearchItem,
    query: string
  ): {
    nameMatch: number;
    yearMatch: number;
    typeMatch: number;
    popularity: number;
  } {
    const queryLower = query.toLowerCase();
    const nameLower = item.name.toLowerCase();

    // Name matching (most important)
    let nameMatch = 0;
    if (nameLower === queryLower) {
      nameMatch = 1.0; // Exact match
    } else if (nameLower.startsWith(queryLower)) {
      nameMatch = 0.9; // Starts with query
    } else if (nameLower.includes(queryLower)) {
      nameMatch = 0.7; // Contains query
    } else {
      // Levenshtein distance for fuzzy matching
      const distance = this.levenshteinDistance(queryLower, nameLower);
      const maxLength = Math.max(queryLower.length, nameLower.length);
      nameMatch = Math.max(0, 1 - distance / maxLength) * 0.6;
    }

    // Year matching (if query contains year)
    let yearMatch = 0;
    const yearInQuery = parseInt(query.match(/\d{4}/)?.[0] || '0');
    if (yearInQuery > 0 && item.yearpublished) {
      const itemYear = parseInt(item.yearpublished);
      const yearDiff = Math.abs(yearInQuery - itemYear);
      yearMatch = Math.max(0, 1 - yearDiff / 10); // 10 year tolerance
    }

    // Type matching (prefer boardgames)
    let typeMatch = 0;
    if (item.type === 'boardgame') {
      typeMatch = 1.0;
    } else if (item.type === 'boardgameexpansion') {
      typeMatch = 0.8;
    } else {
      typeMatch = 0.6;
    }

    // Popularity (based on BGG rank if available)
    const popularity = 0.5; // Default neutral score
    // This would need to be enhanced with actual BGG rank data

    return {
      nameMatch: Math.round(nameMatch * 100) / 100,
      yearMatch: Math.round(yearMatch * 100) / 100,
      typeMatch: Math.round(typeMatch * 100) / 100,
      popularity: Math.round(popularity * 100) / 100,
    };
  }

  /**
   * Calculate overall search score
   */
  private calculateSearchScore(
    item: BGGSearchItem,
    query: string,
    relevanceFactors: any
  ): number {
    const weights = {
      nameMatch: 0.6,
      yearMatch: 0.2,
      typeMatch: 0.1,
      popularity: 0.1,
    };

    const score =
      relevanceFactors.nameMatch * weights.nameMatch +
      relevanceFactors.yearMatch * weights.yearMatch +
      relevanceFactors.typeMatch * weights.typeMatch +
      relevanceFactors.popularity * weights.popularity;

    return Math.round(score * 100);
  }

  /**
   * Check if item is exact match
   */
  private isExactMatch(item: BGGSearchItem, query: string): boolean {
    const queryLower = query.toLowerCase();
    const nameLower = item.name.toLowerCase();
    return nameLower === queryLower;
  }

  /**
   * Classify game type with inbound link analysis
   * This is a simplified version - in production, you'd fetch game details
   * to analyze actual inbound links from the BGG API
   */
  private classifyGameType(item: BGGSearchItem): {
    isExpansion: boolean;
    hasInboundExpansionLink: boolean;
    correctedType: 'base-game' | 'expansion' | 'accessory';
  } {
    // Start with BGG's classification
    let isExpansion = item.type === 'boardgameexpansion';
    let hasInboundExpansionLink = false;
    let correctedType: 'base-game' | 'expansion' | 'accessory' = 'base-game';

    // Check for expansion indicators in the name
    const expansionKeywords = [
      'expansion',
      'exp',
      'extension',
      'add-on',
      'addon',
      'supplement',
      'scenario',
      'campaign',
      'adventure',
      'module',
      'pack',
      'deck',
      'season',
      'edition',
      'version',
      'update',
      'upgrade',
    ];

    const name = item.name.toLowerCase();
    const hasExpansionKeywords = expansionKeywords.some(
      keyword => name.includes(keyword) || name.includes(keyword + 's')
    );

    // Check for common expansion patterns
    const expansionPatterns = [
      /^.*\s+(expansion|exp|extension)$/i,
      /^.*\s+(scenario|campaign|adventure)\s+pack$/i,
      /^.*\s+(season|edition)\s+\d+$/i,
      /^.*\s+(add-on|addon|supplement)$/i,
    ];

    const matchesExpansionPattern = expansionPatterns.some(pattern =>
      pattern.test(item.name)
    );

    // Determine if this is actually an expansion
    if (
      item.type === 'boardgameexpansion' ||
      hasExpansionKeywords ||
      matchesExpansionPattern
    ) {
      isExpansion = true;
      hasInboundExpansionLink = true;
      correctedType = 'expansion';
    } else if (item.type === 'boardgameaccessory') {
      correctedType = 'accessory';
    } else {
      correctedType = 'base-game';
    }

    // Additional heuristics for misclassified games
    if (
      item.type === 'boardgame' &&
      (hasExpansionKeywords || matchesExpansionPattern)
    ) {
      console.log(
        `🔍 Correcting type for "${item.name}": boardgame -> expansion`
      );
      isExpansion = true;
      hasInboundExpansionLink = true;
      correctedType = 'expansion';
    }

    return {
      isExpansion,
      hasInboundExpansionLink,
      correctedType,
    };
  }

  /**
   * Analyze inbound links for accurate type classification
   * This analyzes game details to check for inbound expansion links
   */
  public analyzeInboundLinks(gameDetails: any): boolean {
    if (!gameDetails || !gameDetails.item) {
      return false;
    }

    const item = gameDetails.item;

    // Check for inbound links that indicate this is an expansion
    // BGG provides relationship data in the thing API response
    const hasInboundExpansion = this.checkInboundExpansionLinks(item);

    if (hasInboundExpansion) {
      console.log(
        `🔍 Found inbound expansion links for "${item.name?.[0]?.$.value || 'Unknown'}"`
      );
    }

    return hasInboundExpansion;
  }

  /**
   * Check for inbound expansion links in BGG item data
   */
  private checkInboundExpansionLinks(item: any): boolean {
    // Check for various relationship indicators that suggest this is an expansion

    // 1. Check for expansion-related links in the item data
    const links = item.link || [];
    const expansionLinkTypes = [
      'boardgameexpansion',
      'boardgameintegration',
      'boardgamecompilation',
      'boardgamefamily',
    ];

    // Look for links that indicate this item is related to expansions
    const hasExpansionLinks = links.some(
      (link: any) =>
        expansionLinkTypes.includes(link.$.type) && link.$.inbound === 'true'
    );

    // 2. Check for expansion indicators in the item's own type
    const itemType = item.$.type;
    if (itemType === 'boardgameexpansion') {
      return true;
    }

    // 3. Check for expansion-related attributes
    const hasExpansionAttributes = this.checkExpansionAttributes(item);

    return hasExpansionLinks || hasExpansionAttributes;
  }

  /**
   * Check for expansion-related attributes in the item
   */
  private checkExpansionAttributes(item: any): boolean {
    // Check for expansion-related mechanics or categories
    const mechanics = item.mechanics || [];
    const categories = item.categories || [];

    const expansionMechanics = ['expansion', 'modular', 'scenario', 'campaign'];

    const expansionCategories = ['expansion', 'scenario', 'campaign'];

    const hasExpansionMechanics = mechanics.some((mech: any) =>
      expansionMechanics.some(expMech =>
        mech.$.value.toLowerCase().includes(expMech)
      )
    );

    const hasExpansionCategories = categories.some((cat: any) =>
      expansionCategories.some(expCat =>
        cat.$.value.toLowerCase().includes(expCat)
      )
    );

    return hasExpansionMechanics || hasExpansionCategories;
  }

  /**
   * Apply type filter to search results
   */
  applyTypeFilter(
    results: BGGSearchResponse,
    gameType: string
  ): BGGSearchResponse {
    if (gameType === 'all') {
      return results;
    }

    const filteredItems = results.items.filter(item => {
      switch (gameType) {
        case 'base-game':
          return !item.isExpansion && item.correctedType === 'base-game';
        case 'expansion':
          return item.isExpansion || item.correctedType === 'expansion';
        case 'accessory':
          return item.correctedType === 'accessory';
        default:
          return true;
      }
    });

    return {
      ...results,
      items: filteredItems,
      total: filteredItems.length,
    };
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      if (matrix[0]) {
        matrix[0]![i] = i;
      }
    }

    for (let j = 0; j <= str2.length; j++) {
      if (matrix[j]) {
        matrix[j]![0] = j;
      }
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        if (matrix[j] && matrix[j - 1]) {
          matrix[j]![i] = Math.min(
            matrix[j]![i - 1] + 1, // deletion
            matrix[j - 1]![i] + 1, // insertion
            matrix[j - 1]![i - 1] + indicator // substitution
          );
        }
      }
    }

    return matrix[str2.length]?.[str1.length] || 0;
  }
}
