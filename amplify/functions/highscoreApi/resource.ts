import { defineFunction } from '@aws-amplify/backend';

export const highscoreApi = defineFunction({
  name: 'highscoreApi',
  entry: './handler.ts',
  environment: {
    HIGHSCORE_TABLE: 'HighScore'
  },
  timeoutSeconds: 30,
  bundling: {
    externalModules: ['@aws-sdk/*']
  }
});
