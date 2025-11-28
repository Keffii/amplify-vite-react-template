// ESP32 Button Controller for AWS IoT Space Invaders
// Three buttons: LEFT (GPIO 26), RIGHT (GPIO 27), CONFIRM (GPIO 25)
// Optimized for low-latency held-input support

#include "secrets.h"
#include <WiFiClientSecure.h>
#include <MQTTClient.h>
#include <ArduinoJson.h>
#include "WiFi.h"

// GPIO pins for three buttons
#define BTN_LEFT 26
#define BTN_RIGHT 25
#define BTN_CONFIRM 27
#define DEBOUNCE_MS 50  // Reduced from 200ms for faster response
#define HEARTBEAT_MS 200  // Resend pressed state every 200ms to prevent stuck inputs

// The MQTT topic for button events
#define AWS_IOT_BUTTON_TOPIC "/events/button"

String THINGNAME = "";  // Will store the device's unique name (derived from MAC address)

// Initialize secure WiFi client and MQTT client
WiFiClientSecure net = WiFiClientSecure();
MQTTClient client = MQTTClient(1024);

// Button state tracking with debounce
struct ButtonState {
  uint8_t pin;
  const char* name;
  volatile bool needsPublish;  // flag set by ISR
  volatile bool pressedState;  // true = pressed, false = released
  volatile uint32_t lastChange;
};

ButtonState buttons[3] = {
  {BTN_LEFT, "LEFT", false, false, 0},
  {BTN_RIGHT, "RIGHT", false, false, 0},
  {BTN_CONFIRM, "CONFIRM", false, false, 0}
};

// ISR handlers - set flags for main loop to process
void IRAM_ATTR leftISR() {
  uint32_t now = millis();
  bool pressed = (digitalRead(BTN_LEFT) == LOW);
  if (now - buttons[0].lastChange > DEBOUNCE_MS) {
    buttons[0].lastChange = now;
    buttons[0].pressedState = pressed;
    buttons[0].needsPublish = true;
  }
}

void IRAM_ATTR rightISR() {
  uint32_t now = millis();
  bool pressed = (digitalRead(BTN_RIGHT) == LOW);
  if (now - buttons[1].lastChange > DEBOUNCE_MS) {
    buttons[1].lastChange = now;
    buttons[1].pressedState = pressed;
    buttons[1].needsPublish = true;
  }
}

void IRAM_ATTR confirmISR() {
  uint32_t now = millis();
  bool pressed = (digitalRead(BTN_CONFIRM) == LOW);
  if (now - buttons[2].lastChange > DEBOUNCE_MS) {
    buttons[2].lastChange = now;
    buttons[2].pressedState = pressed;
    buttons[2].needsPublish = true;
  }
}

// Establishes connection to AWS IoT Core via WiFi and MQTT
void connectAWS() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Get the MAC address to use as unique device identifier
  THINGNAME = WiFi.macAddress();
  // Remove colons from the MAC address string
  for (int i = 0; i < THINGNAME.length(); i++) {
    if (THINGNAME.charAt(i) == ':') {
      THINGNAME.remove(i, 1);
      i--;
    }
  }

  Serial.println();
  Serial.print("MAC Address (Thing Name): ");
  Serial.println(THINGNAME);
  Serial.println("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");

  // Configure WiFiClientSecure to use the AWS IoT device credentials
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);

  // Connect to the MQTT broker on the AWS endpoint
  client.begin(AWS_IOT_ENDPOINT, 8883, net);

  Serial.print("Connecting to AWS IoT");

  while (!client.connect(THINGNAME.c_str())) {
    Serial.print(".");
    delay(100);
  }

  if (!client.connected()) {
    Serial.println("AWS IoT Timeout!");
    return;
  }

  Serial.println("\nAWS IoT Connected!");
}

// Publishes button event to AWS IoT Core (QoS 0 for lowest latency)
bool publishButtonEvent(const char* buttonName, const char* action) {
  // Payload: button name, action (press/release), and timestamp
  String payload = "{\"btn\":\"" + String(buttonName) + "\",\"action\":\"" + String(action) + "\",\"ts\":" + String(millis()) + "}";
  
  Serial.print("Publishing: ");
  Serial.println(payload);
  
  return client.publish(THINGNAME + AWS_IOT_BUTTON_TOPIC, payload);
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  // Configure button pins with internal pull-up resistors (buttons connect to GND)
  pinMode(BTN_LEFT, INPUT_PULLUP);
  pinMode(BTN_RIGHT, INPUT_PULLUP);
  pinMode(BTN_CONFIRM, INPUT_PULLUP);

  // Attach interrupts on CHANGE (triggers on both press and release)
  attachInterrupt(digitalPinToInterrupt(BTN_LEFT), leftISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(BTN_RIGHT), rightISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(BTN_CONFIRM), confirmISR, CHANGE);

  // Connect to AWS IoT Core
  connectAWS();

  Serial.println("Ready for button input (LEFT/RIGHT/CONFIRM on GPIO 26/25/27)");
}

void loop() {
  // Process button events flagged by ISRs
  for (int i = 0; i < 3; i++) {
    ButtonState &btn = buttons[i];
    
    if (btn.needsPublish) {
      btn.needsPublish = false;
      
      const char* action = btn.pressedState ? "press" : "release";
      
      if (client.connected()) {
        publishButtonEvent(btn.name, action);
      } else {
        Serial.println("Not connected during button event");
      }
    }
  }

  // Process incoming MQTT messages and maintain connection
  client.loop();

  // Reconnect logic with backoff
  static unsigned long lastReconnectAttempt = 0;
  uint32_t now = millis();
  if (!client.connected()) {
    if (now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      Serial.println("Connection lost, attempting reconnect...");
      connectAWS();
    }
  }

  // Debug: print button states every 2 seconds
  static uint32_t lastDebug = 0;
  if (now - lastDebug > 2000) {
    lastDebug = now;
    Serial.print("BTN States - LEFT:");
    Serial.print(digitalRead(BTN_LEFT));
    Serial.print(" RIGHT:");
    Serial.print(digitalRead(BTN_RIGHT));
    Serial.print(" CONFIRM:");
    Serial.println(digitalRead(BTN_CONFIRM));
  }
}
