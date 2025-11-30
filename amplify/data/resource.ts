import { type ClientSchema, a, defineData, defineFunction } from "@aws-amplify/backend";

const iotCoreHandler = defineFunction({
  entry: './iot-core-handler/handler.ts'
})

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
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
      allow.owner(),                      // Owner can create, update, delete their own
      allow.authenticated().to(['read']), // All logged-in users can read all scores
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

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>