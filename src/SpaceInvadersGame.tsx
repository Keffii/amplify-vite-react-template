import React from 'react';
import { Button, View, Divider } from '@aws-amplify/ui-react';

/**
 * SpaceInvadersGame component
 * Embeds the Space Invaders game in an iframe or provides a link to open it standalone
 */
const SpaceInvadersGame: React.FC<{ mode?: 'embed' | 'link' }> = ({ mode = 'link' }) => {
  
  if (mode === 'embed') {
    return (
      <View>
        <Divider padding="xs" />
        <h3>Space Invaders Game</h3>
        <iframe
          src="/game/index.html"
          title="Space Invaders Vertical"
          style={{
            width: '820px',
            height: '960px',
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: '#000'
          }}
        />
      </View>
    );
  }

  // Default: link mode
  return (
    <View>
      <Divider padding="xs" />
      <h3>Space Invaders Game</h3>
      <Button
        variation="primary"
        loadingText=""
        onClick={() => window.open('/game/index.html', '_blank')}
      >
        🎮 Play Space Invaders
      </Button>
      <Divider padding="xs" />
    </View>
  );
};

export default SpaceInvadersGame;
