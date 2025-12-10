# SpaceSurvivors

**IoT-driven arcade game using AWS Amplify and ESP32**

SpaceSurvivors is a browser-based arcade game controlled by a physical ESP32 device. Button events are sent via MQTT to AWS IoT Core and consumed in real time by the React frontend. Highscores are persisted through AWS AppSync (GraphQL) and DynamoDB, with optional Discord notifications via webhook and monitoring through Grafana and CloudWatch.

---

## Architecture

![Project Architecture](https://github.com/user-attachments/assets/011b48a3-1bd5-4718-9159-0b2698a1b60e)

The architecture is divided into three logical groups:

### Devices & Webhook
- **ESP32** - Publishes button events over MQTT/TLS to AWS IoT Core.
- **AWS IoT Core** - MQTT broker that receives device messages and can route them via IoT Rules.
- **AWS Lambda** - Processes IoT events and can forward notifications to external services.
- **Discord Webhook** - Receives notifications (e.g., new highscores) from a Lambda function.

### Backend & Data
- **AWS AppSync (GraphQL)** - API layer for creating and querying highscores; supports real-time subscriptions.
- **Amazon DynamoDB** - Persistent storage for highscores, devices, and game data.
- **AWS Lambda** - Backend functions for data processing, external integrations, or scheduled tasks.
- **Amazon CloudWatch** - Logs and metrics from Lambda and other AWS services.
- **Grafana** - Dashboards for visualizing CloudWatch metrics or Timestream data.

### Frontend & Auth
- **Amazon Cognito** - User authentication; provides temporary AWS credentials to the browser for IoT and AppSync access.
- **SpaceSurvivors (React + Amplify)** - The web application that hosts the game, receives IoT button events via WebSocket, and displays leaderboards.

---

## Preview

![SpaceSurvivors](https://github.com/user-attachments/assets/1500ba11-9928-4c68-b19a-0658a983b906)

---

## Play Online

**[Play SpaceSurvivors](https://main.d23tyi60vwuclv.amplifyapp.com/)**

- To create an account, use a temporary email from [10MinuteMail](https://10minutemail.com/) for quick registration without sharing your personal email.
- Once registered, you can view the leaderboard, track highscores, and experience the real-time gameplay (note: click on the game and use your keyboard, WASD+E for controls.)

---

## Hardware

- ESP32 development board
- Push buttons (Left, Right, Confirm)
- Jumper wires and breadboard

---

## Software & Services

- **AWS**
  - IoT Core
  - Lambda
  - AppSync (GraphQL)
  - DynamoDB
  - Cognito
  - CloudWatch
- **Amplify** - Frontend hosting, backend provisioning, CI/CD
- **Grafana** - Metrics visualization
- **Discord** - Webhook notifications
- **React + Vite** - Frontend framework
- **Arduino / PlatformIO** - ESP32 firmware development

---

## Graphics

SpaceSurvivors uses HTML Canvas for rendering all game graphics, providing smooth 2D animations and pixel-perfect collision detection. The game features retro pixel art assets that create a nostalgic arcade atmosphere:

- **Player Model** - Spaceship sprite sheets. Assets from [CraftPix Free Spaceship Pixel Art](https://craftpix.net/freebies/free-spaceship-pixel-art-sprite-sheets/?num=1&count=25&sq=spaceship&pos=3)
- **Enemy Models** - Animated slime mobs in various colors with attack and movement animations. Assets from [CraftPix Free Slime Mobs Pack](https://craftpix.net/freebies/free-slime-mobs-pixel-art-top-down-sprite-pack/)
- **Background** - Sky with clouds. Assets from [CraftPix Free Sky Background Set](https://craftpix.net/freebies/free-sky-with-clouds-background-pixel-art-set/)

The Canvas API enables efficient sprite rendering, frame-by-frame animation, and real-time game state updates synchronized with the physical controller input from the ESP32 device.

---

## Setup ESP32

1. Create an IoT Thing in **AWS IoT Core → All devices → Things → Create thing**.
2. Auto-generate a certificate and attach a policy with permissions for `iot:Connect`, `iot:Publish`, `iot:Subscribe`, and `iot:Receive` scoped to your device and topic.
3. Download the certificate bundle (device cert, private key, Amazon Root CA).
4. Flash the ESP32 with firmware that:
   - Connects to WiFi
   - Establishes an MQTT/TLS connection to your IoT Core endpoint
   - Publishes button events as JSON to `deviceId/events/button`
5. Verify messages arrive using the **MQTT test client** in the AWS Console.

### Example IoT policy (JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iot:Connect",
      "Resource": "arn:aws:iot:REGION:ACCOUNT:client/DEVICE_ID"
    },
    {
      "Effect": "Allow",
      "Action": "iot:Publish",
      "Resource": "arn:aws:iot:REGION:ACCOUNT:topic/DEVICE_ID/events/button"
    },
    {
      "Effect": "Allow",
      "Action": "iot:Subscribe",
      "Resource": "arn:aws:iot:REGION:ACCOUNT:topicfilter/DEVICE_ID/events/button"
    },
    {
      "Effect": "Allow",
      "Action": "iot:Receive",
      "Resource": "arn:aws:iot:REGION:ACCOUNT:topic/DEVICE_ID/events/button"
    }
  ]
}
```

---

## Setup AWS (Amplify)

### Prerequisites
- Node.js and npm installed
- AWS account with Amplify access

### Local development
```bash
npm install
npm run dev
```

### Deploy backend
The Amplify backend is defined in `amplify/`. Use the Amplify CLI or Amplify Console to deploy:

### Add IoT permissions to Cognito role
After deploying, add an inline policy to the Cognito **authenticated** role so the browser can subscribe to IoT topics. See `IAM_SETUP.md` for the full policy JSON.

---

## Security

- **Transport encryption** - MQTT/TLS (device) and WSS (browser).
- **Device authentication** - X.509 certificates registered in AWS IoT.
- **User authentication** - Cognito User Pool; temporary credentials for IoT and AppSync.
- **Least-privilege** - Narrow IAM policies scoped to specific topics and resources.
- **Secrets management** - Use AWS Secrets Manager for API keys and webhook URLs.

---

## Visualization

- **React frontend** - Real-time leaderboard using AppSync subscriptions.
- **Grafana** - Dashboards connected to CloudWatch or Timestream for device/Lambda metrics.
- **Discord** - Instant notifications for events like new highscores.

---

## Grafana

![Grafana Dashboard](https://github.com/user-attachments/assets/f1e8266b-835e-486c-9bc8-48baa2c3d746)

The Grafana dashboard provides insight into the current leaderboard which is top 5 highscores.

---

## Discord Webhook

![Discord Events](https://github.com/user-attachments/assets/6ff2c7f8-ea7a-4be3-9b68-476163be764a)

Discord webhook integration shows connected/disconnected status message when a player connects their ESP32.

---

## Scalability

- **Support for multiple devices** - In realtime track connected IoTCore devices and choose your device from the dropdown list
- **Renew cognito tokens yearly** - At the moment cognito tokens doesn't have a expire date. Make cognito tokens only alive for 365 days and ask for the user to renew their token yearly
- **Expand gameanalytics** - Track how long each user is playing per session, their events (button events)
- **Threshold message for when near token cap** - Add a threshold message rule for when the project expands and need more tokens than provided by the free plan
