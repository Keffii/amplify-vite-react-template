import type { Schema } from '../resource'

export const handler: Schema["AddButtonEvents"]["functionHandler"] = async (event, context) => {
    return {
        device_id: event.arguments.device_id,
        owner: event.arguments.owner,
        btn: event.arguments.btn,
        action: event.arguments.action,
        ts: event.arguments.ts,
        timestamp: event.arguments.timestamp,
        createdAt: new Date(event.arguments.timestamp).toISOString(),
        updatedAt: new Date(event.arguments.timestamp).toISOString(),
    };
};