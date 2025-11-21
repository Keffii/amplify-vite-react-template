import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { graphqlIoTCoreStatus } from './functions/graphqlIoTCoreStatus/resource';
//import { graphqlIoTCoreTelemetry } from './functions/graphqlIoTCoreTelemetry/resource';
defineBackend({
  auth,
  data,
  //graphqlIoTCoreTelemetry,
  graphqlIoTCoreStatus,
});