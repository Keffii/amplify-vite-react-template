import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

import { graphqlIoTCoreButtonEvents } from './functions/graphqlIoTCoreButtonEvents/resource';
import { graphqlIoTCoreStatus } from './functions/graphqlIoTCoreStatus/resource';
import { buttonEventsApi } from './functions/buttonEventsApi/resource';
import { highscoreApi } from './functions/highscoreApi/resource';

import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';

const backend = defineBackend({
  auth,
  data,
  graphqlIoTCoreButtonEvents,
  graphqlIoTCoreStatus,
  buttonEventsApi,
  highscoreApi,
});

// Add Function URLs for Grafana API access
const buttonEventsLambda = backend.buttonEventsApi.resources.lambda;
const buttonEventsUrl = buttonEventsLambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    // Use either specific methods or the wildcard ALL. Don't mix ALL with specific methods,
    // because AWS Lambda FunctionUrl CORS rejects combining the wildcard '*' with extra fields.
    // Use ALL to allow all methods for Grafana access.
    allowedMethods: [HttpMethod.ALL],
    allowedHeaders: ['*'],
  }
});

const highscoreLambda = backend.highscoreApi.resources.lambda;
const highscoreUrl = highscoreLambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    // See note above: allow all HTTP methods for this Function URL.
    allowedMethods: [HttpMethod.ALL],
    allowedHeaders: ['*'],
  }
});

// Output the Function URLs
backend.addOutput({
  custom: {
    buttonEventsApiUrl: buttonEventsUrl.url,
    highscoreApiUrl: highscoreUrl.url,
  }
});
