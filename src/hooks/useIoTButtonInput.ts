import { useEffect } from 'react';
import {
  CONNECTION_STATE_CHANGE,
  ConnectionState,
  PubSub,
} from '@aws-amplify/pubsub';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

interface ButtonEvent {
  btn: 'LEFT' | 'RIGHT' | 'CONFIRM';
  action: 'press' | 'release' | 'held';
  ts: number;
}

export const useIoTButtonInput = (
  deviceId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
  enabled: boolean
) => {
  useEffect(() => {
    if (!enabled || !deviceId || !iframeRef.current) {
      console.log('PubSub not starting:', { enabled, deviceId, hasIframe: !!iframeRef.current });
      return;
    }

    const topic = `${deviceId}/events/button`;
    console.log('[IoT] Subscribing to topic:', topic);

    let subscription: any;
    let pubsub: PubSub | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let removeHubListener: (() => void) | null = null;
    let isUnmounted = false;
    let retry = 0;
    const pendingReleaseTimers = new Map<string, ReturnType<typeof setTimeout>>();

    const clearTimersAndListeners = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (removeHubListener) {
        removeHubListener();
        removeHubListener = null;
      }
    };

    const scheduleReconnect = (reason: string) => {
      if (isUnmounted) return;
      if (reconnectTimer) return;

      const delay = Math.min(15000, 500 * Math.pow(2, retry));
      retry += 1;

      console.warn(`[IoT] Reconnecting after disconnect (${reason}) in ${delay}ms`);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        setupSubscription();
      }, delay);
    };

    const setupSubscription = async () => {
      if (isUnmounted) return;

      clearTimersAndListeners();
      pendingReleaseTimers.forEach(timer => clearTimeout(timer));
      pendingReleaseTimers.clear();
      subscription?.unsubscribe();
      subscription = null;
      pubsub = null;

      try {
        const session = await fetchAuthSession();
        console.log('[IoT] Auth session obtained:', {
          identityId: session.identityId,
          authenticated: !!session.credentials
        });

        const clientIdBase = session.identityId?.split(':')[1] || 'anon';
        const clientId = `web-${clientIdBase}-${Math.random().toString(36).slice(-6)}`;

        pubsub = new PubSub({
          region: 'eu-central-1',
          endpoint: 'wss://a1v0zs4dzvjg7n-ats.iot.eu-central-1.amazonaws.com/mqtt',
          clientId
        });

        removeHubListener = Hub.listen('pubsub', capsule => {
          const payload: any = (capsule as any)?.payload ?? {};
          const data: any = payload.data ?? {};
          const connectionState = data.connectionState as ConnectionState | undefined;
          const provider = data.provider;
          if (
            payload.event === CONNECTION_STATE_CHANGE &&
            provider === pubsub &&
            (connectionState === ConnectionState.ConnectionDisrupted ||
              connectionState === ConnectionState.Disconnected)
          ) {
            scheduleReconnect(connectionState);
          }
        });

        console.log('[IoT] Creating subscription with topic:', topic);
        subscription = pubsub.subscribe({ topics: [topic] }).subscribe({
          next: (data: any) => {
            retry = 0;
            console.log('[IoT] Raw message received:', data);

            // Extract topic: some providers attach it as a Symbol key (Paho),
            // so check both plain property and symbol properties.
            let msgTopic: string | undefined;
            if (data && typeof data === 'object') {
              if ((data as any).topic) msgTopic = (data as any).topic;
              else {
                const syms = Object.getOwnPropertySymbols(data);
                const sym = syms.find(s => s.description === 'topic' || String(s) === 'Symbol(topic)');
                if (sym) msgTopic = (data as any)[sym];
              }
            }
            console.log('[IoT] Message topic:', msgTopic || 'no topic');

            // Determine where the payload is located. PubSub wrappers can provide
            // the payload as `value`, `payloadString`, or as the message object itself.
            let rawValue: any = undefined;
            if (data && typeof data === 'object' && 'value' in data && (data as any).value !== undefined) {
              rawValue = (data as any).value;
            } else if (data && typeof data === 'object' && 'payloadString' in data && (data as any).payloadString !== undefined) {
              rawValue = (data as any).payloadString;
            } else {
              // sometimes the message object is already the payload
              rawValue = data;
            }

            console.log('[IoT] Message value type:', typeof rawValue);

            try {
              const payload = (typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue) as ButtonEvent;

              if (!payload || !payload.btn || !payload.action) {
                throw new Error('payload missing required btn or action properties');
              }

              console.log('[IoT] ESP32 Button Event:', {
                button: payload.btn,
                action: payload.action,
                timestamp: payload.ts
              });

              // Forward to game iframe
              // Track last known state to filter press/release duplicates but allow held events
              const stateKey = `${payload.btn}_state`;
              const lastState = (iframeRef.current as any)[stateKey];
              const currentState = payload.action === 'press' || payload.action === 'held';
              
              // Always forward 'held' actions for continuous movement
              // Only forward press/release if state changed
              if (payload.action === 'held' || lastState !== currentState) {
                if (payload.action !== 'held') {
                  (iframeRef.current as any)[stateKey] = currentState;
                }
                
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.postMessage({
                    type: 'ESP32_BUTTON',
                    btn: payload.btn,
                    action: payload.action
                  }, '*');
                }
              }
            } catch (parseError) {
              console.error('Failed to parse message:', parseError, 'rawValue:', rawValue, 'data:', data);
            }
          },
          error: (error: any) => {
            console.error('[IoT] PubSub subscription error:', error);
            scheduleReconnect('subscription error');
          },
          complete: () => {
            console.log('[IoT] PubSub subscription completed');
            scheduleReconnect('subscription completed');
          }
        });

        console.log('[IoT] PubSub subscription created successfully');
      } catch (error) {
        console.error('[IoT] Failed to create subscription:', error);
        scheduleReconnect('auth or setup failure');
      }
    };

    setupSubscription();

    return () => {
      isUnmounted = true;
      clearTimersAndListeners();
      console.log('[IoT] Unsubscribing from topic:', topic);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [deviceId, iframeRef, enabled]);
};
