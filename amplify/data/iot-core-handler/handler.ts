import type { Schema } from '../resource'

export const handler: Schema["AddButtonEvents"]["functionHandler"] = async (event, context) => {
    const args = event.arguments;
    return {
        id: `${args.device_id}#${args.timestamp}`,
        device_id: args.device_id,
        owner: args.owner,
        btn: args.btn,
        action: args.action,
        ts: args.ts,
        timestamp: args.timestamp,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};