import type { Handler } from 'aws-lambda';

const GRAPHQL_ENDPOINT = process.env.API_ENDPOINT as string;
const GRAPHQL_API_KEY = process.env.API_KEY as string;
const AMPLIFY_SSM_ENV_CONFIG = process.env.AMPLIFY_SSM_ENV_CONFIG as string;

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler: Handler = async (event, context) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    console.log(`GRAPHQL_ENDPOINT: ${GRAPHQL_ENDPOINT}`);
    console.log(`GRAPHQL_API_KEY: ${GRAPHQL_API_KEY}`);
    console.log(`AMPLIFY_SSM_ENV_CONFIG: ${AMPLIFY_SSM_ENV_CONFIG}`);


    let statusCode = 200;
    let response;
    let responseBody;
    let request;

    const headers = {
        'x-api-key': GRAPHQL_API_KEY,
        'Content-Type': 'application/json'
    }

    /** @type {import('node-fetch').RequestInit} */

    // Get owner from deviceID
    request = new Request(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            query: `query MyQuery {
                        getDevice(device_id: "${event.device_id}") {
                            device_id
                            owner
                        }
                        }
                `})
    });

    console.log("request:", request)

    try {
        response = await fetch(request);
        responseBody = await response.json();

        console.log("responseBody:", responseBody)
        if (responseBody.errors) statusCode = 400;
    } catch (error) {
        statusCode = 400;
        responseBody = {
            errors: [
                {
                    status: response?.status,
                    error: JSON.stringify(error),
                }
            ]
        };
    }

    // if the device exists and a owner is found, add the button event
    if (responseBody.data.getDevice?.owner) {
        // Mutate
        request = new Request(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                query: `mutation MyMutation {
                    createButtonEvents(input: {
                        device_id: "${event.device_id}", 
                        btn: "${event.btn}", 
                        action: "${event.action}", 
                        owner: "${responseBody.data.getDevice.owner}", 
                        ts: ${event.ts}, 
                        timestamp: ${Date.now()}
                        }) 
                    {
                        device_id
                        btn
                        action
                        ts
                        owner
                        createdAt
                        updatedAt
                        timestamp
                    }
                }
                `})
        });

        try {
            response = await fetch(request);
            responseBody = await response.json();
            if (responseBody.errors) statusCode = 400;
        } catch (error) {
            statusCode = 400;
            responseBody = {
                errors: [
                    {
                        status: response?.status,
                        error: JSON.stringify(error),
                    }
                ]
            };
        }
    }

    return {
        statusCode,
        body: JSON.stringify(responseBody)
    };

};