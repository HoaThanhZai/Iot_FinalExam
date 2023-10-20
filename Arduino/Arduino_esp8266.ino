#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <BH1750.h>
#include <Wire.h>
#include <ArduinoJson.h>

const char* ssid = "Đình Long";
const char* password = "17042002";
const char* mqtt_server = "172.20.10.3";

const int DHT_PIN = D4; // Chân GPIO kết nối với DHT11
const int LED_PIN1 = D6; // Chân GPIO kết nối với LED1
const int LED_PIN2 = D7;// Chân GPIO kết nối với LED2


WiFiClient espClient;
PubSubClient client(espClient);

DHT dht(DHT_PIN, DHT11);
BH1750 lightMeter;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
    Serial.print("Message arrived [");
    Serial.print(topic);
    Serial.print("] ");

    char receivedChar = (char)payload[0];
    Serial.println(receivedChar);

    if (receivedChar == '1') {
        digitalWrite(LED_PIN1, HIGH); // Bật đèn 1 khi nhận '1'
    } else if (receivedChar == '0') {
        digitalWrite(LED_PIN1, LOW);  // Tắt đèn 1 khi nhận '0'
    }
    else if (receivedChar == '3') {
        digitalWrite(LED_PIN2, HIGH);  // Bật đèn 2 khi nhận '3'
    }
    else if (receivedChar == '2') {
        digitalWrite(LED_PIN2, LOW);  // Tắt đèn 2 khi nhận '2'
    }

}

void reconnect() {
    while (!client.connected()) {
        Serial.print("Attempting MQTT connection...");
        if (client.connect("arduinoClient")) {
            Serial.println("connected");
            client.subscribe("esp8266/led");
        } else {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}

void setup() {
     Serial.begin(115200);
    setup_wifi();
    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);

    pinMode(LED_PIN1, OUTPUT);
    pinMode(LED_PIN2, OUTPUT);
    Wire.begin();
    dht.begin();
    lightMeter.begin();

    client.setCallback(callback);
}

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop();

    // Đọc dữ liệu từ DHT11 và gửi lên MQTT dưới dạng JSON
    int humidity = dht.readHumidity();
    int temperature = dht.readTemperature();
    int light = lightMeter.readLightLevel();
    int dust = random(0,100);

    if (!isnan(humidity) && !isnan(temperature)) {
        // Tạo đối tượng JSON
        StaticJsonDocument<200> doc;
        doc["temperature"] = temperature;
        doc["humidity"] = humidity;
        doc["light"] = light;
        doc["dust"] = dust;

        char json[400];
        serializeJson(doc, json);
        client.publish("sensor/data", json);
        Serial.print("Đã gửi dữ liệu lên MQTT - ");
        Serial.print("Nhiệt độ: ");
        Serial.print(temperature);
        Serial.print(" °C, Độ ẩm: ");
        Serial.print(humidity);
        Serial.print("%, Độ sáng: ");
        Serial.print(light);
        Serial.print(" lux, Độ bụi: ");
        Serial.print(dust);
        Serial.println("mg/m3 \n");
        if (dust > 60) {
            alert();
            digitalWrite(LED_PIN1, LOW);
            digitalWrite(LED_PIN2, LOW); 
        }
        else{
          delay(5000);
        }
    }
}

void alert() {
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_PIN1, HIGH);
    digitalWrite(LED_PIN2, LOW);
    delay(250);
    digitalWrite(LED_PIN1, LOW);
    digitalWrite(LED_PIN2, HIGH);
    delay(250);
  }
}


