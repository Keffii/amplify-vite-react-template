import { defineFunction } from '@aws-amplify/backend';

export const buttonEventsApi = defineFunction({
  name: 'buttonEventsApi',
  entry: './handler.ts',
  environment: {
    BUTTON_EVENTS_TABLE: 'ButtonEvents'
  },
  timeoutSeconds: 30,
  bundling: {
    externalModules: ['@aws-sdk/*']
  }
});
