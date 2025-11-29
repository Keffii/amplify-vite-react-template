import React, { useState, useEffect, useRef } from 'react';
import { View, Card, Heading, Text, Flex, Button, Badge, SelectField } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { useIoTButtonInput } from './hooks/useIoTButtonInput';

// Create a typed client instance to interact with the Amplify Data (GraphQL API)
const client = generateClient<Schema>();

/*SpaceInvadersGame component
  Wraps the canvas game with React and provides UI for leaderboard/stats
 */
const SpaceInvadersGame: React.FC<{ username?: string; signOut?: () => void }> = ({ username, signOut }) => {
  const [highScores, setHighScores] = useState<Array<Schema["HighScore"]["type"]>>([]);
  const [devices, setDevices] = useState<Array<Schema["Device"]["type"]>>([]);
  const [esp32DeviceId, setEsp32DeviceId] = useState('ECE334663DD4');
  const [iotEnabled, setIotEnabled] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ESP32 button input hook
  useIoTButtonInput(esp32DeviceId, iframeRef, iotEnabled);

  const saveHighScore = async (username: string, score: number) => {
    await client.models.HighScore.create({
      username,
      score,
      timestamp: Date.now()
    })
  }

useEffect(() => {
  const highScoreSubscription = client.models.HighScore.observeQuery().subscribe({
    next: (data) => { setHighScores([...data.items]) },
  });

  return () => {
    highScoreSubscription.unsubscribe();
  };
}, []);

useEffect(() => {
  const handleGameMessage = (event: MessageEvent) => {
    if (event.data.type === 'GAME_OVER' && username) {
      saveHighScore(username || 'Anonymous', event.data.score);
    }
  };
  
  window.addEventListener('message', handleGameMessage);
  return () => {
    window.removeEventListener('message', handleGameMessage);
  };
}, [username]);

useEffect(() => {
  const deviceSubscription = client.models.Device.observeQuery().subscribe({
    next: (data) => {
      setDevices([...data.items]);
    },
  });

  return () => {
    deviceSubscription.unsubscribe();
  };
}, []);

  const handleConnectESP32 = () => {
    console.log('[ESP32] Connecting...');
    setIotEnabled(true);
  };

  const handleDisconnectESP32 = () => {
    console.log('[ESP32] Disconnecting...');
    
    // Release all button states in the game
    if (iframeRef.current?.contentWindow) {
      ['LEFT', 'RIGHT', 'CONFIRM'].forEach(btn => {
        iframeRef.current!.contentWindow!.postMessage({
          type: 'ESP32_BUTTON',
          btn: btn,
          action: 'release'
        }, '*');
      });
    }
    
    setIotEnabled(false);
  };

  // Compute leaderboard: top 10 unique scores across all users
  const leaderboard = React.useMemo(() => {
    // Group scores by user and get their best score
    // Use the Amplify 'owner' field when present so different owners with the same
    // username are not collapsed into one entry. Fallback to username when owner
    // isn't available.
    const userBestScores = highScores.reduce((acc, entry) => {
      const ownerId = ((entry as any).owner as string) || entry.username;
      if (!acc[ownerId] || acc[ownerId].score < entry.score) {
        acc[ownerId] = entry;
      }
      return acc;
    }, {} as Record<string, Schema["HighScore"]["type"]>);
    
    // Convert to array and sort by score descending
    return Object.values(userBestScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [highScores]);

  return (
    <View>
      <Flex direction="row" gap="1rem" wrap="nowrap" justifyContent="space-between" alignItems="flex-start">
        {/* Left Column: ESP32 Controller + Leaderboard (stacked) */}
        <Flex direction="column" gap="1rem" style={{ width: '280px', alignItems: 'stretch' }}>
          <Card variation="outlined" width="100%">
            <Heading level={4}>ESP32 Controller</Heading>
            <SelectField
              label="Device ID"
              value={esp32DeviceId}
              onChange={(e) => setEsp32DeviceId(e.target.value)}
              disabled={iotEnabled}
            >
              {devices.length > 0 ? (
                devices.map((device) => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.device_id}
                  </option>
                ))
              ) : (
                <option value="ECE334663DD4">ECE334663DD4</option>
              )}
            </SelectField>

            {(() => {
              const device = devices.find(d => d.device_id === esp32DeviceId);
              const isDeviceConnected = device?.status === "connected";

              return !iotEnabled ? (
                <Button onClick={handleConnectESP32} variation="primary" width="100%">
                  Connect
                </Button>
              ) : (
                <>
                  <Flex direction="row" gap="0.5rem" alignItems="center">
                    <Text fontSize="0.9rem">Status:</Text>
                    <Badge variation={isDeviceConnected ? "success" : "error"}>
                      {isDeviceConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </Flex>
                  <Button onClick={handleDisconnectESP32} variation="warning" width="100%">
                    Disconnect
                  </Button>
                </>
              );
            })()}

            <Text fontSize="0.8rem" color="gray">
              Topic: {esp32DeviceId}/events/button
            </Text>
            {signOut && (
              <Button onClick={signOut} variation="primary" width="100%" marginBottom="0.5rem">
                Sign out
              </Button>
            )}
          </Card>

          <Card variation="outlined" width="100%" height="480px">
            <Heading level={4} style={{ marginBottom: '0.5rem' }}>
              👑 Leaderboard
            </Heading>
            {leaderboard.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaderboard.map((entry, index) => {
                  const isTopThree = index < 3;
                  let medal = '';
                  let bgColor = 'transparent';
                  let borderColor = '#e0e0e0';

                  if (index === 0) {
                    medal = '🥇';
                    bgColor = 'rgba(255, 215, 0, 0.2)';
                    borderColor = '#ffd700';
                  } else if (index === 1) {
                    medal = '🥈';
                    bgColor = 'rgba(192, 192, 192, 0.2)';
                    borderColor = '#c0c0c0';
                  } else if (index === 2) {
                    medal = '🥉';
                    bgColor = 'rgba(205, 127, 50, 0.2)';
                    borderColor = '#cd7f32';
                  }

                  const isCurrentUser = entry.username === username;

                  return (
                    <div
                      key={entry.id}
                      style={{
                        backgroundColor: isCurrentUser ? 'rgba(100, 108, 255, 0.1)' : bgColor,
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `2px solid ${isCurrentUser ? '#646cff' : borderColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        fontSize: '0.9rem',
                        fontWeight: isTopThree ? '600' : '400',
                        boxShadow: isTopThree ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                        gap: '6px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                        <span style={{ 
                          minWidth: '28px', 
                          fontSize: '1.1rem',
                          color: isTopThree ? borderColor : '#666',
                          fontWeight: '700'
                        }}>
                          {medal || `#${index + 1}`}
                        </span>
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          flex: 1,
                          color: isCurrentUser ? '#646cff' : '#333'
                        }}>
                          {entry.username}
                        </span>
                      </span>
                      <span style={{ 
                        fontWeight: '700', 
                        color: isTopThree ? borderColor : '#333',
                        fontSize: isTopThree ? '1.05rem' : '0.95rem'
                      }}>
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Text fontSize="0.9rem" style={{ color: '#999', fontStyle: 'italic' }}>
                No players yet
              </Text>
            )}
          </Card>
        </Flex>

        
        {/* Game in iframe - Center */}
        <View>
          <iframe
            ref={iframeRef}
            src="/game/index.html"
            title="Space Invaders Game"
            width="800"
            height="940"
            style={{ border: 'none', display: 'block' }}
          />
        </View>

        {/* Highscores Card - Far Right */}
        <Card variation="outlined" width="330px" height="940px">
          <Heading level={4} style={{ marginBottom: '0.5rem' }}>
            🏆 Top 20 Highscores
          </Heading>
          {highScores.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {highScores
                .sort((a, b) => b.score - a.score)
                .slice(0, 20)
                .map((entry, index) => {
                  const ageInSeconds = (Date.now() - entry.timestamp) / 1000;
                  const isNew = ageInSeconds < 10;
                  const isTopThree = index < 3;
                  
                  let medal = '';
                  let bgColor = 'transparent';
                  let borderColor = '#e0e0e0';
                  
                  if (isNew) {
                    bgColor = 'rgba(255, 0, 0, 0.15)';
                    borderColor = '#ff6b6b';
                  } else if (isTopThree) {
                    if (index === 0) {
                      medal = '🥇';
                      bgColor = 'rgba(255, 215, 0, 0.15)';
                      borderColor = '#ffd700';
                    } else if (index === 1) {
                      medal = '🥈';
                      bgColor = 'rgba(192, 192, 192, 0.15)';
                      borderColor = '#c0c0c0';
                    } else {
                      medal = '🥉';
                      bgColor = 'rgba(205, 127, 50, 0.15)';
                      borderColor = '#cd7f32';
                    }
                  }
                  
                  return (
                    <div
                      key={entry.id}
                      style={{
                        backgroundColor: bgColor,
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: `1px solid ${borderColor}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        fontWeight: isTopThree ? '600' : '400',
                        boxShadow: isNew ? '0 2px 4px rgba(255,0,0,0.2)' : isTopThree ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ 
                          minWidth: '32px', 
                          color: isTopThree ? borderColor : '#666',
                          fontWeight: '600'
                        }}>
                          {medal || `#${index + 1}`}
                        </span>
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {entry.username}
                        </span>
                      </span>
                      <span style={{ 
                        fontWeight: '700', 
                        color: isTopThree ? borderColor : '#333',
                        marginLeft: '12px',
                        fontSize: isTopThree ? '1rem' : '0.9rem'
                      }}>
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <Text fontSize="0.9rem" style={{ color: '#999', fontStyle: 'italic' }}>
              No scores yet - be the first!
            </Text>
          )}
        </Card>
      </Flex>
    </View>
  );
};

export default SpaceInvadersGame;
