import { type ClientSchema, a, defineData, defineFunction } from "@aws-amplify/backend";

const iotCoreHandler = defineFunction({
  entry: './iot-core-handler/handler.ts'
})

const schema = a.schema({
  Device: a
    .model({
      device_id: a.string().required(),
      owner: a.string().required(),
      status: a.string()
    })
    .identifier(['device_id'])
    .authorization((allow) => [allow.owner(), allow.publicApiKey()]),

  ButtonEvents: a
    .model({
      device_id: a.string().required(),
      owner: a.string().required(),
      btn: a.string().required(),
      action: a.string().required(),
      ts: a.integer().required(),
      timestamp: a.timestamp().required(),
    })
    .identifier(['device_id', 'timestamp'])
    .authorization((allow) => [allow.owner(), allow.publicApiKey()]),

  HighScore: a
    .model({
      username: a.string().required(),
      score: a.integer().required(),
      timestamp: a.timestamp().required()
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']), // All logged in users can read all scores
      allow.publicApiKey()
    ]),

  AddButtonEvents: a
    .mutation()
    .arguments({
      device_id: a.string().required(),
      owner: a.string().required(),
      btn: a.string().required(),
      action: a.string().required(),
      ts: a.integer().required(),
      timestamp: a.timestamp().required(),
    })
    .returns(a.ref("ButtonEvents"))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(iotCoreHandler)),
});



export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});