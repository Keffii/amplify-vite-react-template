import React, { useState } from 'react';
import { View, Card, Heading, Text, Flex } from '@aws-amplify/ui-react';

// TODO: Import generateClient and Schema types for database integration
// TODO: Create client instance for database operations

interface LeaderboardEntry {
  username: string;
  score: number;
  rank: number;
}

/*SpaceInvadersGame component
  Wraps the canvas game with React and provides UI for leaderboard/stats
 */
const SpaceInvadersGame: React.FC<{ username?: string }> = ({ username }) => {
  const [leaderboard] = useState<LeaderboardEntry[]>([]);
  const [highScore] = useState(0);
  const [activePlayerCount] = useState(0);

  // TODO: Fetch leaderboard data from database

  // TODO: Track active players from database

  // TODO: Fetch high score from database

  return (
    <View padding="1rem">
      <Flex direction="row" gap="1rem" wrap="nowrap" justifyContent="space-between" alignItems="flex-start">
        {/* Leaderboard Card - Far Left */}
        <Card variation="outlined" width="200px" height="940px">
          <Heading level={4}>Leaderboard</Heading>
          <Text fontSize="0.9rem">#1, User1: 24</Text>
          <Text fontSize="0.9rem">#1, User2: 24</Text>
          <Text fontSize="0.9rem">#2, User3: 18</Text>
          {leaderboard.length > 0 && (
            leaderboard.map((entry) => (
              <Text key={entry.rank} fontSize="0.9rem">
                #{entry.rank} {entry.username}: {entry.score}
              </Text>
            ))
          )}
        </Card>

        {/* Game in iframe - Center */}
        <View>
          <iframe
            src="/game/index.html"
            title="Space Invaders Game"
            width="800"
            height="940"
            style={{ border: 'none', display: 'block' }}
          />
        </View>

        {/* Highscores Card - Far Right */}
        <Card variation="outlined" width="200px" height="940px">
          <Heading level={4}>Highscores</Heading>
          <Text fontSize="0.9rem">#1: 24</Text>
          <Text fontSize="0.9rem">#2: 24</Text>
          <Text fontSize="0.9rem">#3: 18</Text>
          <View marginTop="1.5rem">
            <Heading level={5}>Stats</Heading>
            <Text fontSize="0.9rem">High Score: {highScore}</Text>
            <Text fontSize="0.9rem">Active Players: {activePlayerCount}</Text>
            {username && (
              <Text fontSize="0.9rem" marginTop="1rem">
                Playing as: {username}
              </Text>
            )}
          </View>
        </Card>
      </Flex>
    </View>
  );
};

export default SpaceInvadersGame;