# AWS IoT Core Permissions Setup

## Critical Next Step: Add Cognito IAM Permissions

Your ESP32 is publishing successfully to `ECE334663DD4/events/button`, but the browser needs permission to subscribe to this topic.

### Step 1: Find Your Cognito Identity Pool Role

1. Go to [AWS IAM Console → Roles](https://console.aws.amazon.com/iam/home?region=eu-central-1#/roles)
2. Find this role: **`amplify-d23tyi60vwuclv-ma-amplifyAuthauthenticatedU-xld966E1ZnPe`**
3. Click on the role name

### Step 2: Add IoT Permissions

1. Click "Add permissions" → "Create inline policy"
2. Click "JSON" tab
3. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:Connect"
      ],
      "Resource": "arn:aws:iot:eu-central-1:954572408019:client/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Subscribe"
      ],
      "Resource": "arn:aws:iot:eu-central-1:954572408019:topicfilter/ECE334663DD4/events/button"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Receive"
      ],
      "Resource": "arn:aws:iot:eu-central-1:954572408019:topic/ECE334663DD4/events/button"
    }
  ]
}
```

4. Click "Review policy"
5. Name it: `IoTCoreWebSocketAccess`
6. Click "Create policy"

### Step 3: Test the Connection

1. Run your dev server:
   ```bash
   npm run dev
   ```

2. Sign in to your app
3. You should see the ESP32 Controller card with device ID "ECE334663DD4"
4. Click "Connect"
5. Check browser console - you should see: `Subscribing to IoT topic: ECE334663DD4/events/button`

### Step 4: Test Physical Buttons

1. Press buttons on your ESP32
2. Watch the browser console for messages like:
   ```
   ESP32 Button Event: {button: "LEFT", action: "press", latency: "234ms"}
   ```
3. The game should respond to your button presses!

## Troubleshooting

### "Access Denied" or "Not Authorized"
- Double-check the IAM policy is attached to the correct Cognito authenticated role
- Verify the topic ARN matches exactly: `ECE334663DD4/events/button`
- Make sure you're signed in (not unauthenticated)

### No Messages in Console
- Verify ESP32 is still publishing (check AWS IoT Console → Test → MQTT test client)
- Check the device ID is exactly "ECE334663DD4" (case-sensitive)
- Make sure "Connect" button shows "Connected" status

### High Latency (>500ms)
- Check your WiFi connection
- Verify QoS 0 is being used (it is in the ESP32 sketch)
- Consider reducing debounce time in ESP32 code if < 200ms latency is critical

## Architecture Summary

```
ESP32 (GPIO pins) 
  → WiFi → MQTT/TLS (port 8883)
  → AWS IoT Core (topic: ECE334663DD4/events/button)
  → Browser MQTT/WebSocket (wss://)
  → React useIoTButtonInput hook
  → postMessage to game iframe
  → input.js updates game state
```

## Next Steps After Testing

1. Measure actual end-to-end latency
2. Tune debounce values if needed
3. Add button release handling if game needs it
4. Consider adding connection status UI in game
5. Add error recovery (auto-reconnect on disconnect)
