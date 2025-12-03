  <h1 align="center">SpaceSurvivors</h1>
  <p align="center">IoT-driven arcade game using AWS Amplify and ESP32</p>
</div>

<p align="left">
SpaceSurvivors is a browser-based arcade game controlled by a physical ESP32 device. Button events are sent via MQTT to AWS IoT Core and consumed in real time by the React frontend. Highscores are persisted through AWS AppSync (GraphQL) and DynamoDB, with optional Discord notifications via webhook and monitoring through Grafana and CloudWatch.
</p>

---

<h2 align="center">Architecture</h2>

<div align="center">
<img width="691" height="802" alt="Project Architecture drawio(12)" src="https://github.com/user-attachments/assets/011b48a3-1bd5-4718-9159-0b2698a1b60e" />
</div>

<p align="left">
The architecture is divided into three logical groups:

<b>Devices & Webhook</b>
<ul>
  <li><b>ESP32</b> - Publishes button events over MQTT/TLS to AWS IoT Core.</li>
  <li><b>AWS IoT Core</b> - MQTT broker that receives device messages and can route them via IoT Rules.</li>
  <li><b>AWS Lambda</b> - Processes IoT events and can forward notifications to external services.</li>
  <li><b>Discord Webhook</b> - Receives notifications (e.g., new highscores) from a Lambda function.</li>
</ul>

<b>Backend & Data</b>
<ul>
  <li><b>AWS AppSync (GraphQL)</b> - API layer for creating and querying highscores; supports real-time subscriptions.</li>
  <li><b>Amazon DynamoDB</b> - Persistent storage for highscores, devices, and game data.</li>
  <li><b>AWS Lambda</b> - Backend functions for data processing, external integrations, or scheduled tasks.</li>
  <li><b>Amazon CloudWatch</b> - Logs and metrics from Lambda and other AWS services.</li>
  <li><b>Grafana</b> - Dashboards for visualizing CloudWatch metrics or Timestream data.</li>
</ul>

<b>Frontend & Auth</b>
<ul>
  <li><b>Amazon Cognito</b> - User authentication; provides temporary AWS credentials to the browser for IoT and AppSync access.</li>
  <li><b>SpaceSurvivors (React + Amplify)</b> - The web application that hosts the game, receives IoT button events via WebSocket, and displays leaderboards.</li>
</ul>
</p>

---

<h2 align="center">Hardware</h2>

<ul>
  <li>ESP32 development board</li>
  <li>Push buttons (Left, Right, Confirm)</li>
  <li>Jumper wires and breadboard</li>
</ul>

---

<h2 align="center">Software & Services</h2>

<ul>
  <li><b>AWS</b>
    <ul>
      <li>IoT Core</li>
      <li>Lambda</li>
      <li>AppSync (GraphQL)</li>
      <li>DynamoDB</li>
      <li>Cognito</li>
      <li>CloudWatch</li>
    </ul>
  </li>
  <li><b>Amplify</b> - Frontend hosting, backend provisioning, CI/CD</li>
  <li><b>Grafana</b> - Metrics visualization</li>
  <li><b>Discord</b> - Webhook notifications</li>
  <li><b>React + Vite</b> - Frontend framework</li>
  <li><b>Arduino / PlatformIO</b> - ESP32 firmware development</li>
</ul>

---

<h2 align="center">Data Flow</h2>

<h3>Real-time button input</h3>
<pre>
ESP32 (MQTT/TLS)
  -> AWS IoT Core (topic: deviceId/events/button)
    -> Browser (WebSocket subscribe via Cognito credentials)
      -> React hook (useIoTButtonInput)
        -> Game iframe (postMessage)
</pre>

<h3>Highscore persistence</h3>
<pre>
Game iframe
  -> postMessage({ type: 'GAME_OVER', score })
    -> React parent (SpaceInvadersGame.tsx)
      -> AppSync mutation (HighScore.create)
        -> DynamoDB
          -> AppSync subscription
            -> UI updates leaderboard
</pre>

<h3>Discord notification (optional)</h3>
<pre>
DynamoDB Stream or AppSync event
  -> Lambda function
    -> Discord Webhook
</pre>

---

<h2 align="center">Setup ESP32</h2>

<p align="left">
1. Create an IoT Thing in <b>AWS IoT Core -> All devices -> Things -> Create thing</b>.<br>
2. Auto-generate a certificate and attach a policy with permissions for <code>iot:Connect</code>, <code>iot:Publish</code>, <code>iot:Subscribe</code>, and <code>iot:Receive</code> scoped to your device and topic.<br>
3. Download the certificate bundle (device cert, private key, Amazon Root CA).<br>
4. Flash the ESP32 with firmware that:
   <ul>
     <li>Connects to WiFi</li>
     <li>Establishes an MQTT/TLS connection to your IoT Core endpoint</li>
     <li>Publishes button events as JSON to <code>deviceId/events/button</code></li>
   </ul>
5. Verify messages arrive using the <b>MQTT test client</b> in the AWS Console.
</p>

<b>Example IoT policy (JSON):</b>
<pre>
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
</pre>

---

<h2 align="center">Setup AWS (Amplify)</h2>

<h3>Prerequisites</h3>
<ul>
  <li>Node.js and npm installed</li>
  <li>AWS account with Amplify access</li>
</ul>

<h3>Local development</h3>
<pre>
npm ci
npm run dev
</pre>

<h3>Deploy backend</h3>
<p>
The Amplify backend is defined in <code>amplify/</code>. Use the Amplify CLI or Amplify Console to deploy:
</p>
<pre>
npx ampx sandbox   # local sandbox
npx ampx deploy    # deploy to cloud
</pre>

<h3>Add IoT permissions to Cognito role</h3>
<p>
After deploying, add an inline policy to the Cognito <b>authenticated</b> role so the browser can subscribe to IoT topics. See <code>IAM_SETUP.md</code> for the full policy JSON.
</p>

---


<h2 align="center">Security</h2>

<ul>
  <li><b>Transport encryption</b> - MQTT/TLS (device) and WSS (browser).</li>
  <li><b>Device authentication</b> - X.509 certificates registered in AWS IoT.</li>
  <li><b>User authentication</b> - Cognito User Pool; temporary credentials for IoT and AppSync.</li>
  <li><b>Least-privilege</b> - Narrow IAM policies scoped to specific topics and resources.</li>
  <li><b>Secrets management</b> - Use AWS Secrets Manager for API keys and webhook URLs.</li>
</ul>

---

<h2 align="center">Visualization</h2>

<ul>
  <li><b>React frontend</b> - Real-time leaderboard using AppSync subscriptions.</li>
  <li><b>Grafana</b> - Dashboards connected to CloudWatch or Timestream for device/Lambda metrics.</li>
  <li><b>Discord</b> - Instant notifications for events like new highscores.</li>
</ul>

---
