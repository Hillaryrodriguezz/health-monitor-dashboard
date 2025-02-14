const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (ws) => {
    console.log('Client connected');
    let filters = { systolic: true, diastolic: true, heartRate: true, bloodOxygen: true, breathingRhythm: true };

    ws.on('message', (message) => {
        message = message.toString().toLowerCase();

        if (message.includes("presión arterial") || message.includes("presion arterial") || message.includes("presión") || message.includes("presion") || message.includes("arterial")) {
            filters = { systolic: true, diastolic: true, heartRate: false, bloodOxygen: false, breathingRhythm: false };
        } else if (message.includes("frecuencia cardíaca") || message.includes("frecuencia cardiaca") || message.includes("frecuencia") || message.includes("cardiaca")) {
            filters = { systolic: false, diastolic: false, heartRate: true, bloodOxygen: false, breathingRhythm: false };
        } else if (message.includes("oxígeno en sangre") || message.includes("oxigeno en sangre") || message.includes("oxígeno") || message.includes("oxigeno") || message.includes("sangre")) {
            filters = { systolic: false, diastolic: false, heartRate: false, bloodOxygen: true, breathingRhythm: false };
        } else if (message.includes("ritmo respiratorio") || message.includes("ritmo") || message.includes("respiratorio")) {
            filters = { systolic: false, diastolic: false, heartRate: false, bloodOxygen: false, breathingRhythm: true };
        } else if (message.includes("todo") || message.includes("todos") || message.includes("todas")) {
            filters = { systolic: true, diastolic: true, heartRate: true, bloodOxygen: true, breathingRhythm: true };
        }

        ws.send(JSON.stringify({ message: `Filtrado por: ${message}` }));
    });

    const interval = setInterval(() => {
        const data = {
            time: new Date().toISOString(),
            systolic: filters.systolic ? Math.floor(Math.random() * (140 - 90 + 1)) + 90 : null,
            diastolic: filters.diastolic ? Math.floor(Math.random() * (90 - 60 + 1)) + 60 : null,
            heartRate: filters.heartRate ? Math.floor(Math.random() * (100 - 60 + 1)) + 60 : null,
            bloodOxygen: filters.bloodOxygen ? Math.floor(Math.random() * (100 - 95 + 1)) + 95 : null,
            breathingRhythm: filters.breathingRhythm ? Math.floor(Math.random() * (20 - 12 + 1)) + 12 : null
        };

        ws.send(JSON.stringify(data));
    }, 2000);

    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

console.log('WebSocket server running on ws://localhost:8080');