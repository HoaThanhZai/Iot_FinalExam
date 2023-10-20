const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');
const mysql = require('mysql2');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const paginate = require('express-paginate');
const { title } = require('process');

app.use(paginate.middleware(10, 50));
app.use(express.json());

// Kết nối tới MQTT broker
const mqttClient = mqtt.connect('mqtt://172.20.10.3:1883');

// Kết nối tới MySQL database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '17042002',
    database: 'iot_demo'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database (SENSOR)');
});


// Khi nhận được kết nối từ MQTT broker
mqttClient.on('connect', () => {
    mqttClient.subscribe('sensor/data');
});

mqttClient.on('message', (topic, message) => {
    const data = JSON.parse(message.toString());
    // Lưu dữ liệu vào MySQL database
    const sql = 'INSERT INTO sensor_data (temperature, humidity, light, dust) VALUES (?, ?, ?, ?)';
    const values = [data.temperature, data.humidity, data.light, data.dust];

    db.query(sql, values, (err) => {
        if (err) throw err;
        console.log('Data_sensor inserted');

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });
});

function insertLedEvent(status) {
    const query = 'INSERT INTO led_data (status) VALUES ( ?)';
    const values = [status];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return;
        }
        console.log('Data_LED inserted');
    });
}

function insertFanEvent(status) {
    const query = 'INSERT INTO fan_data (status) VALUES ( ?)';
    const values = [status];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return;
        }
        console.log('Data_Fan inserted');
    });
}


app.get('/control', (req, res) => {
    const command = req.query.command;

    if (command === '1') {
        mqttClient.publish('esp8266/led', '1');
        insertLedEvent(1);
    } else if (command === '0') {
        mqttClient.publish('esp8266/led', '0');
        insertLedEvent(0);
    } else if (command === '3') {
        mqttClient.publish('esp8266/led', '3');
        insertFanEvent(1);
    } else if (command === '2') {
        mqttClient.publish('esp8266/led', '2');
        insertFanEvent(0);
    }

    res.send(`Command sent: ${command}`);
});

app.get('/allSensorData', (req, res) => {
    const query = 'SELECT * FROM sensor_data';
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error executing MySQL query:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
});
app.get('/allLedData', (req, res) => {
    const query = 'SELECT * FROM led_data';
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error executing MySQL query:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
});
app.get('/allFanData', (req, res) => {
    const query = 'SELECT * FROM fan_data';
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error executing MySQL query:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
});


app.get('/getDataled', (req, res) => {
    const page = req.query.page || 1;
    const perPage = 10;
    const startIndex = (page - 1) * perPage;

    const query = `SELECT * FROM led_data LIMIT ${startIndex}, ${perPage}`;

    db.query(query, (err, results) => {
        if (err) throw err;

        res.json(results);
    });
});


app.get('/data', (req, res) => {
    const page = req.query.page || 1;
    const perPage = 10;
    const startIndex = (page - 1) * perPage;

    const query = `SELECT * FROM sensor_data LIMIT ${startIndex}, ${perPage}`;

    db.query(query, (err, results) => {
        if (err) throw err;

        res.json(results);
    });
});





app.use(express.static('views'));

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});