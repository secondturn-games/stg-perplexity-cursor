/**
 * BGG Test Component
 * Component for testing BGG API integration
 */

'use client';

import { useState } from 'react';
import { useBGG } from '@/hooks/useBGG';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';

export function BGGTestComponent() {
  const {
    searchGames,
    searchState,
    getGameDetails,
    gameState,
    getUserCollection,
    collectionState,
    batchUpdateGames,
    batchState,
    clearError,
    clearData,
  } = useBGG();

  const [searchQuery, setSearchQuery] = useState('');
  const [gameType, setGameType] = useState<
    'all' | 'base-game' | 'expansion' | 'accessory'
  >('all');
  const [exactMatch, setExactMatch] = useState(false);
  const [gameId, setGameId] = useState('');
  const [username, setUsername] = useState('');
  const [batchGameIds, setBatchGameIds] = useState('');
  const [cacheStats, setCacheStats] = useState<any>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    console.log('Starting search for:', searchQuery, 'with filters:', {
      gameType,
      exactMatch,
    });
    try {
      const result = await searchGames(searchQuery, { gameType, exactMatch });
      console.log('Search result:', result);
    } catch (error) {
      console.error('Search error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  };

  const handleGetGameDetails = async () => {
    if (!gameId.trim()) {
      return;
    }
    try {
      await getGameDetails(gameId, true);
    } catch (error) {
      console.error('Game details error:', error);
    }
  };

  const handleGetCollection = async () => {
    if (!username.trim()) {
      return;
    }
    try {
      await getUserCollection(username);
    } catch (error) {
      console.error('Collection error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  };

  const handleGetCacheStats = async () => {
    try {
      const response = await fetch('/api/bgg/cache-stats');
      const stats = await response.json();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await fetch('/api/bgg/clear-cache', { method: 'POST' });
      setCacheStats(null);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const handleBatchUpdate = async () => {
    if (!batchGameIds.trim()) {
      return;
    }
    const ids = batchGameIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id);
    try {
      await batchUpdateGames(ids);
    } catch (error) {
      console.error('Batch update error:', error);
    }
  };

  const testPopularGames = async () => {
    const popularIds = ['13', '9209', '266192']; // Catan, Ticket to Ride, Wingspan
    try {
      await batchUpdateGames(popularIds);
    } catch (error) {
      console.error('Popular games test error:', error);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-8'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          BGG API Integration Test
        </h1>
        <p className='text-gray-600 mb-4'>
          Test the BoardGameGeek API integration with various operations
        </p>
        <div className='flex items-center justify-center gap-2 text-sm text-gray-500'>
          <span>Data provided by</span>
          <a
            href='https://boardgamegeek.com'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-1 hover:text-blue-600 transition-colors'
          >
            <img
              src='/powered-by-bgg-rgb.svg'
              alt='Powered by BGG'
              className='h-4'
            />
          </a>
        </div>
      </div>

      {/* Search Games */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold mb-4'>Search Games</h2>
        <div className='space-y-4 mb-4'>
          <div className='flex gap-4'>
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder='Enter game name (e.g., Catan)'
              className='flex-1'
            />
            <Button onClick={handleSearch} disabled={searchState.loading}>
              {searchState.loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className='flex gap-4 items-center'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-medium'>Type:</label>
              <Select
                value={gameType}
                onChange={e => setGameType(e.target.value as any)}
                className='w-32'
              >
                <option value='all'>All</option>
                <option value='base-game'>Base Games</option>
                <option value='expansion'>Expansions</option>
                <option value='accessory'>Accessories</option>
              </Select>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='exactMatch'
                checked={exactMatch}
                onChange={e => setExactMatch(e.target.checked)}
                className='rounded'
              />
              <label htmlFor='exactMatch' className='text-sm'>
                Exact Match Only
              </label>
            </div>
          </div>
        </div>

        <div className='text-sm text-gray-500 mb-4'>
          State: Loading: {searchState.loading.toString()}, Error:{' '}
          {searchState.error ? 'Yes' : 'No'}, Data:{' '}
          {searchState.data ? 'Yes' : 'No'}
        </div>

        {searchState.error && (
          <Alert variant='error' className='mb-4'>
            <div>
              <div className='font-medium'>
                {searchState.error.userMessage || searchState.error.message}
              </div>
              {searchState.error.retryAfter && (
                <div className='text-sm mt-1'>
                  Retry after {searchState.error.retryAfter} seconds
                </div>
              )}
              {process.env.NODE_ENV === 'development' &&
                searchState.error.details && (
                  <div className='text-xs mt-2 opacity-75'>
                    <details>
                      <summary>Debug Info</summary>
                      <pre className='mt-1 whitespace-pre-wrap'>
                        {JSON.stringify(searchState.error.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
            </div>
          </Alert>
        )}

        {searchState.data && (
          <div className='mt-4'>
            <h3 className='font-medium mb-2'>Search Results:</h3>
            <div className='text-sm text-gray-500 mb-2'>
              Strategy: {searchState.data.searchStrategy} | Time:{' '}
              {searchState.data.performance?.queryTime}ms | API Calls:{' '}
              {searchState.data.performance?.apiCalls} | Cache:{' '}
              {searchState.data.performance?.cacheHit ? 'Hit' : 'Miss'}
            </div>
            <div className='text-xs text-gray-400 mb-3 flex items-center gap-1'>
              <span>Data source:</span>
              <a
                href='https://boardgamegeek.com'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-blue-600 transition-colors'
              >
                BoardGameGeek
              </a>
            </div>
            <div className='space-y-2'>
              {searchState.data.items
                ?.filter(
                  (game: any, index: number, self: any[]) =>
                    self.findIndex(g => g.id === game.id) === index
                )
                ?.map((game: any) => (
                  <div key={game.id} className='p-3 bg-gray-50 rounded'>
                    <div className='flex justify-between items-start'>
                      <div className='flex-1'>
                        <div className='font-medium'>{game.name}</div>
                        <div className='text-sm text-gray-600'>
                          ID: {game.id} | Year:{' '}
                          {game.displayYear || game.yearpublished || 'N/A'} |
                          Type: {game.typeDisplay || game.type}
                        </div>
                        {game.searchScore && (
                          <div className='text-xs text-blue-600 mt-1'>
                            Score: {game.searchScore.toFixed(1)} |
                            {game.isExactMatch && ' Exact Match'} | Name:{' '}
                            {(game.relevanceFactors?.nameMatch * 100).toFixed(
                              0
                            )}
                            % | Year:{' '}
                            {(game.relevanceFactors?.yearMatch * 100).toFixed(
                              0
                            )}
                            %
                          </div>
                        )}
                        <div className='text-xs text-gray-500 mt-1'>
                          Type: {game.typeDisplay || game.type}
                          {game.correctedType &&
                            game.correctedType !== game.type && (
                              <span className='text-orange-600'>
                                {' '}
                                → {game.correctedType}
                              </span>
                            )}
                          {game.isExpansion && ' (Expansion)'}
                          {game.hasInboundExpansionLink &&
                            ' (Has Expansion Links)'}
                          {game.isHighQuality && ' | High Quality'}
                          {game.ageInYears > 0 &&
                            ` | ${game.ageInYears} years old`}
                        </div>

                        {/* Enhanced metadata for top results */}
                        {game.relevanceFactors?.enhancedMetadata && (
                          <div className='text-xs text-green-600 mt-2 p-2 bg-green-50 rounded border-l-2 border-green-300'>
                            <div className='font-medium mb-1'>
                              ✨ Enhanced Details:
                            </div>
                            {game.minPlayers && game.maxPlayers && (
                              <div>
                                Players: {game.minPlayers}-{game.maxPlayers}
                              </div>
                            )}
                            {game.playTime && (
                              <div>Play Time: {game.playTime}</div>
                            )}
                            {game.complexity && (
                              <div>Complexity: {game.complexity}/5</div>
                            )}
                            {game.rating && (
                              <div>Rating: {game.rating.toFixed(1)}/10</div>
                            )}
                            {game.description && (
                              <div className='mt-1 text-gray-600 truncate'>
                                {game.description.substring(0, 100)}...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {game.thumbnail && (
                        <img
                          src={game.thumbnail}
                          alt={game.name}
                          className='w-12 h-12 object-cover rounded ml-2'
                        />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Game Details */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold mb-4'>Get Game Details</h2>
        <div className='flex gap-4 mb-4'>
          <Input
            value={gameId}
            onChange={e => setGameId(e.target.value)}
            placeholder='Enter BGG ID (e.g., 13 for Catan)'
            className='flex-1'
          />
          <Button onClick={handleGetGameDetails} disabled={gameState.loading}>
            {gameState.loading ? 'Loading...' : 'Get Details'}
          </Button>
        </div>

        {gameState.error && (
          <Alert variant='error' className='mb-4'>
            <div>
              <div className='font-medium'>
                {gameState.error.userMessage || gameState.error.message}
              </div>
              {gameState.error.retryAfter && (
                <div className='text-sm mt-1'>
                  Retry after {gameState.error.retryAfter} seconds
                </div>
              )}
            </div>
          </Alert>
        )}

        {gameState.data && (
          <div className='mt-4'>
            <h3 className='font-medium mb-2'>Game Details:</h3>

            {/* Debug Information - Always Show */}
            <div className='mb-4 p-3 bg-gray-100 rounded text-xs'>
              <details open>
                <summary className='cursor-pointer font-medium'>
                  Debug: Raw Data Structure (Click to collapse)
                </summary>
                <pre className='mt-2 whitespace-pre-wrap overflow-auto max-h-96 text-xs'>
                  {JSON.stringify(gameState.data, null, 2)}
                </pre>
              </details>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Basic Information */}
              <div className='space-y-3'>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-900 mb-3'>
                    Basic Information
                  </h4>
                  <div className='space-y-2'>
                    <div>
                      <span className='font-medium text-gray-700'>Name:</span>
                      <span className='ml-2 text-gray-900'>
                        {gameState.data.name || gameState.data.title || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>BGG ID:</span>
                      <span className='ml-2 text-gray-900'>
                        {gameState.data.id || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Year Published:
                      </span>
                      <span className='ml-2 text-gray-900'>
                        {gameState.data.yearpublished ||
                          gameState.data.year_published ||
                          'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Players:
                      </span>
                      <span className='ml-2 text-gray-900'>
                        {gameState.data.playerCount ||
                          (gameState.data.minplayers &&
                          gameState.data.maxplayers
                            ? `${gameState.data.minplayers}-${gameState.data.maxplayers}`
                            : 'N/A')}
                      </span>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Playing Time:
                      </span>
                      <span className='ml-2 text-gray-900'>
                        {gameState.data.playTimeDisplay ||
                          (gameState.data.playingtime
                            ? `${gameState.data.playingtime} minutes`
                            : 'N/A')}
                      </span>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Min Age:
                      </span>
                      <span className='ml-2 text-gray-900'>
                        {gameState.data.ageDisplay ||
                          (gameState.data.minage
                            ? `${gameState.data.minage}+`
                            : 'N/A')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BGG Ratings */}
                <div className='bg-blue-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-900 mb-3'>
                    BGG Ratings
                  </h4>
                  <div className='space-y-2'>
                    <div>
                      <span className='font-medium text-gray-700'>
                        BGG Rating:
                      </span>
                      <span className='ml-2 text-gray-900'>
                        {gameState.data.ratingDisplay ||
                          (gameState.data.bgg_rating
                            ? gameState.data.bgg_rating.toFixed(1)
                            : 'N/A')}
                      </span>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        BGG Rank:
                      </span>
                      <span className='ml-2 text-gray-900'>
                        {gameState.data.rankDisplay ||
                          (gameState.data.bgg_rank
                            ? `#${gameState.data.bgg_rank}`
                            : 'Unranked')}
                      </span>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Weight Rating:
                      </span>
                      <span className='ml-2 text-gray-900'>
                        {gameState.data.weightDisplay ||
                          (gameState.data.weight_rating
                            ? gameState.data.weight_rating.toFixed(1)
                            : 'N/A')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories and Mechanics */}
              <div className='space-y-3'>
                <div className='bg-green-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-900 mb-3'>
                    Categories
                  </h4>
                  <div className='text-sm text-gray-700'>
                    {gameState.data.categories &&
                    gameState.data.categories.length > 0 ? (
                      <div className='flex flex-wrap gap-1'>
                        {gameState.data.categories.map(
                          (category: string, index: number) => (
                            <span
                              key={index}
                              className='inline-block bg-green-200 text-green-800 px-2 py-1 rounded text-xs'
                            >
                              {category}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <span className='text-gray-500'>
                        No categories available
                      </span>
                    )}
                  </div>
                </div>

                <div className='bg-purple-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-900 mb-3'>
                    Mechanics
                  </h4>
                  <div className='text-sm text-gray-700'>
                    {gameState.data.mechanics &&
                    gameState.data.mechanics.length > 0 ? (
                      <div className='flex flex-wrap gap-1'>
                        {gameState.data.mechanics.map(
                          (mechanic: string, index: number) => (
                            <span
                              key={index}
                              className='inline-block bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs'
                            >
                              {mechanic}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <span className='text-gray-500'>
                        No mechanics available
                      </span>
                    )}
                  </div>
                </div>

                {/* Designers and Artists */}
                {(gameState.data.designers?.length > 0 ||
                  gameState.data.artists?.length > 0) && (
                  <div className='bg-yellow-50 p-4 rounded-lg'>
                    <h4 className='font-semibold text-gray-900 mb-3'>
                      Credits
                    </h4>
                    <div className='space-y-2 text-sm'>
                      {gameState.data.designers?.length > 0 && (
                        <div>
                          <span className='font-medium text-gray-700'>
                            Designers:
                          </span>
                          <span className='ml-2 text-gray-900'>
                            {gameState.data.designers.join(', ')}
                          </span>
                        </div>
                      )}
                      {gameState.data.artists?.length > 0 && (
                        <div>
                          <span className='font-medium text-gray-700'>
                            Artists:
                          </span>
                          <span className='ml-2 text-gray-900'>
                            {gameState.data.artists.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Images */}
                {(gameState.data.image || gameState.data.thumbnail) && (
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <h4 className='font-semibold text-gray-900 mb-3'>Images</h4>
                    <div className='space-y-2'>
                      {gameState.data.thumbnail && (
                        <div>
                          <span className='font-medium text-gray-700'>
                            Thumbnail:
                          </span>
                          <div className='mt-1'>
                            <img
                              src={gameState.data.thumbnail}
                              alt={gameState.data.name || 'Game thumbnail'}
                              className='w-16 h-16 object-cover rounded border'
                              onError={e => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {gameState.data.image && (
                        <div>
                          <span className='font-medium text-gray-700'>
                            Full Image:
                          </span>
                          <div className='mt-1'>
                            <a
                              href={gameState.data.image}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-600 hover:text-blue-800 text-sm'
                            >
                              View full image →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alternate Names - Always Show */}
            <div className='mt-6 bg-orange-50 p-4 rounded-lg'>
              {(() => {
                const allNames = gameState.data.alternateNames || [];
                const alternateNames = allNames.filter(
                  (name: any) => name.type !== 'primary'
                );
                return (
                  <>
                    <h4 className='font-semibold text-gray-900 mb-3'>
                      Alternate Names ({alternateNames.length} of{' '}
                      {allNames.length} total names)
                    </h4>
                    {alternateNames.length > 0 ? (
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                        {alternateNames
                          .slice(0, 20)
                          .map((name: any, index: number) => (
                            <div
                              key={index}
                              className='p-2 bg-white rounded border'
                            >
                              <span className='text-sm text-gray-900'>
                                {name.value}
                              </span>
                              <span className='text-xs text-gray-400 ml-1'>
                                ({name.type})
                              </span>
                            </div>
                          ))}
                        {alternateNames.length > 20 && (
                          <div className='col-span-full text-sm text-gray-500 text-center py-2'>
                            ... and {alternateNames.length - 20} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className='text-sm text-gray-500 text-center py-4'>
                        {allNames.length === 0
                          ? '⚠️ No name data in response'
                          : '⚠️ No alternate names (only primary name present)'}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Game Versions - Always Show */}
            <div className='mt-6 bg-indigo-50 p-4 rounded-lg'>
              <h4 className='font-semibold text-gray-900 mb-3'>
                Game Versions ({gameState.data.editions?.length || 0} editions)
              </h4>
              <p className='text-sm text-gray-600 mb-3'>
                Different editions and versions of this game (regional
                editions, special editions, anniversary editions, etc.)
              </p>
              {gameState.data.editions && gameState.data.editions.length > 0 ? (
                <div className='space-y-2 max-h-60 overflow-y-auto'>
                  {gameState.data.editions
                    .slice(0, 10)
                    .map((edition: any, index: number) => (
                      <div
                        key={index}
                        className='flex items-start justify-between p-3 bg-white rounded border'
                      >
                        <div className='flex-1'>
                          <div className='font-medium text-gray-900'>
                            {edition.name}
                          </div>
                          <div className='text-sm text-gray-600 space-y-1'>
                            <div>
                              Publisher:{' '}
                              {edition.publishers?.join(', ') || 'Unknown'}
                            </div>
                            {edition.languages &&
                              edition.languages.length > 0 && (
                                <div>
                                  Language: {edition.languages.join(', ')}
                                </div>
                              )}
                            {edition.yearpublished && (
                              <div>Year: {edition.yearpublished}</div>
                            )}
                            {edition.productCode && (
                              <div>Product Code: {edition.productCode}</div>
                            )}
                            <div className='text-xs text-gray-500'>
                              ID: {edition.id} | Type: {edition.type}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2 ml-4'>
                          {edition.thumbnail && (
                            <img
                              src={edition.thumbnail}
                              alt={edition.name}
                              className='w-12 h-12 object-cover rounded border'
                              onError={e => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <a
                            href={edition.bggLink}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-indigo-600 hover:text-indigo-800 text-sm font-medium'
                          >
                            View →
                          </a>
                        </div>
                      </div>
                    ))}
                  {gameState.data.editions.length > 10 && (
                    <div className='text-sm text-gray-500 text-center py-2'>
                      ... and {gameState.data.editions.length - 10} more
                      versions
                    </div>
                  )}
                </div>
              ) : (
                <div className='text-sm text-gray-500 text-center py-4'>
                  ⚠️ No game versions/editions found in response
                </div>
              )}
            </div>

            {/* Language Dependence - Always Show */}
            <div className='mt-6 bg-teal-50 p-4 rounded-lg'>
              <h4 className='font-semibold text-gray-900 mb-3'>
                Language Dependence
              </h4>
              {gameState.data.languageDependence &&
              gameState.data.languageDependence.level !== 0 ? (
                <div className='bg-white p-3 rounded border'>
                  <div className='text-sm space-y-1'>
                    <p className='text-gray-900 font-medium'>
                      Level {gameState.data.languageDependence.level}:{' '}
                      {gameState.data.languageDependence.description}
                    </p>
                    <p className='text-gray-600'>
                      {gameState.data.languageDependence.votes} of{' '}
                      {gameState.data.languageDependence.totalVotes} voters (
                      {gameState.data.languageDependence.percentage}%)
                    </p>
                  </div>
                </div>
              ) : (
                <div className='text-sm text-gray-500 text-center py-4'>
                  ⚠️ No language dependence data found in response or
                  insufficient votes
                </div>
              )}
            </div>

            {/* Description */}
            {gameState.data.description && (
              <div className='mt-6 bg-gray-50 p-4 rounded-lg'>
                <h4 className='font-semibold text-gray-900 mb-3'>
                  Description
                </h4>
                <div
                  className='text-sm text-gray-700 prose prose-sm max-w-none'
                  dangerouslySetInnerHTML={{
                    __html:
                      gameState.data.description.substring(0, 500) +
                      (gameState.data.description.length > 500 ? '...' : ''),
                  }}
                />
              </div>
            )}

            {/* BGG Link */}
            <div className='mt-4 text-center'>
              <a
                href={`https://boardgamegeek.com/boardgame/${gameState.data.id}`}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <span>View on BoardGameGeek</span>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                  />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* User Collection */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold mb-4'>Get User Collection</h2>
        <div className='flex gap-4 mb-4'>
          <Input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder='Enter BGG username'
            className='flex-1'
          />
          <Button
            onClick={handleGetCollection}
            disabled={collectionState.loading}
          >
            {collectionState.loading ? 'Loading...' : 'Get Collection'}
          </Button>
        </div>

        {collectionState.error && (
          <Alert variant='error' className='mb-4'>
            <div>
              <div className='font-medium'>
                {collectionState.error.userMessage ||
                  collectionState.error.message}
              </div>
              {collectionState.error.retryAfter && (
                <div className='text-sm mt-1'>
                  Retry after {collectionState.error.retryAfter} seconds
                </div>
              )}
            </div>
          </Alert>
        )}

        {collectionState.data && (
          <div className='mt-4'>
            <h3 className='font-medium mb-2'>Collection Results:</h3>
            <div className='text-sm text-gray-600 mb-2'>
              Total items: {collectionState.data.total}
            </div>
            <div className='space-y-2 max-h-60 overflow-y-auto'>
              {collectionState.data.items?.slice(0, 10).map((item: any) => (
                <div key={item.id} className='p-3 bg-gray-50 rounded'>
                  <div className='font-medium'>{item.name}</div>
                  <div className='text-sm text-gray-600'>
                    Year: {item.yearpublished} | Owned:{' '}
                    {item.owned ? 'Yes' : 'No'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Batch Update */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold mb-4'>Batch Update Games</h2>
        <div className='flex gap-4 mb-4'>
          <Input
            value={batchGameIds}
            onChange={e => setBatchGameIds(e.target.value)}
            placeholder='Enter BGG IDs separated by commas (e.g., 13,9209,266192)'
            className='flex-1'
          />
          <Button onClick={handleBatchUpdate} disabled={batchState.loading}>
            {batchState.loading ? 'Processing...' : 'Batch Update'}
          </Button>
        </div>

        <div className='mb-4'>
          <Button
            onClick={testPopularGames}
            variant='secondary'
            disabled={batchState.loading}
          >
            Test Popular Games (Catan, Ticket to Ride, Wingspan)
          </Button>
        </div>

        {batchState.error && (
          <Alert variant='error' className='mb-4'>
            {batchState.error.message}
          </Alert>
        )}

        {batchState.data && (
          <div className='mt-4'>
            <h3 className='font-medium mb-2'>Batch Update Results:</h3>
            <div className='text-sm text-gray-600 mb-2'>
              Status: {batchState.data.status} | Processed:{' '}
              {batchState.data.results?.length || 0} games
            </div>
            <div className='space-y-1'>
              {batchState.data.results?.map((result: any, index: number) => (
                <div key={index} className='text-sm'>
                  Game {result.gameId}: {result.status}
                  {result.error && (
                    <span className='text-red-600'> - {result.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cache Monitoring */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-xl font-semibold mb-4'>Cache Monitoring</h2>

        <div className='flex gap-4 mb-4'>
          <Button onClick={handleGetCacheStats} variant='secondary'>
            Get Cache Stats
          </Button>
          <Button onClick={handleClearCache} variant='secondary'>
            Clear Cache
          </Button>
        </div>

        {cacheStats && (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='bg-gray-50 p-3 rounded'>
                <div className='text-sm text-gray-600'>Cache Size</div>
                <div className='text-lg font-semibold'>{cacheStats.size}</div>
              </div>
              <div className='bg-gray-50 p-3 rounded'>
                <div className='text-sm text-gray-600'>Hit Rate</div>
                <div className='text-lg font-semibold'>
                  {cacheStats.hitRate}%
                </div>
              </div>
              <div className='bg-gray-50 p-3 rounded'>
                <div className='text-sm text-gray-600'>Total Queries</div>
                <div className='text-lg font-semibold'>
                  {cacheStats.totalQueries}
                </div>
              </div>
              <div className='bg-gray-50 p-3 rounded'>
                <div className='text-sm text-gray-600'>Memory Usage</div>
                <div className='text-lg font-semibold'>
                  {(cacheStats.memoryUsage / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
              <div className='bg-gray-50 p-3 rounded'>
                <div className='text-sm text-gray-600'>Total Hits</div>
                <div className='text-lg font-semibold text-green-600'>
                  {cacheStats.totalHits}
                </div>
              </div>
              <div className='bg-gray-50 p-3 rounded'>
                <div className='text-sm text-gray-600'>Total Misses</div>
                <div className='text-lg font-semibold text-red-600'>
                  {cacheStats.totalMisses}
                </div>
              </div>
              <div className='bg-gray-50 p-3 rounded'>
                <div className='text-sm text-gray-600'>Avg Query Time</div>
                <div className='text-lg font-semibold'>
                  {cacheStats.averageQueryTime}ms
                </div>
              </div>
            </div>

            {cacheStats.adaptive && (
              <div className='mt-4'>
                <h4 className='font-medium mb-2'>Adaptive Cache Stats</h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='bg-blue-50 p-3 rounded'>
                    <div className='text-sm text-gray-600'>Avg TTL</div>
                    <div className='text-lg font-semibold'>
                      {(cacheStats.adaptive.averageTTL / 1000 / 60).toFixed(1)}m
                    </div>
                  </div>
                  <div className='bg-blue-50 p-3 rounded'>
                    <div className='text-sm text-gray-600'>TTL Multiplier</div>
                    <div className='text-lg font-semibold'>
                      {cacheStats.adaptive.ttlMultiplier}x
                    </div>
                  </div>
                  <div className='bg-blue-50 p-3 rounded'>
                    <div className='text-sm text-gray-600'>Cache Age</div>
                    <div className='text-lg font-semibold'>
                      {(cacheStats.adaptive.cacheAge / 1000 / 60).toFixed(1)}m
                    </div>
                  </div>
                  <div className='bg-blue-50 p-3 rounded'>
                    <div className='text-sm text-gray-600'>
                      Adaptive Entries
                    </div>
                    <div className='text-lg font-semibold'>
                      {cacheStats.adaptive.adaptiveEntries}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className='text-sm text-gray-500'>
              Last Cleanup: {new Date(cacheStats.lastCleanup).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Clear Data */}
      <div className='flex gap-4 justify-center'>
        <Button onClick={clearError} variant='secondary'>
          Clear Errors
        </Button>
        <Button onClick={clearData} variant='secondary'>
          Clear Data
        </Button>
      </div>
    </div>
  );
}
