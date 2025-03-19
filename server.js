const WebSocket = require('ws');

class Semaphore {
	constructor(max) {
		this.max = max; // Máximo de operaciones concurrentes permitidas
		this.queue = [];
		this.count = 0;
	}

	async acquire() {
		return new Promise((resolve, reject) => {
			try {
				const attempt = () => {
					if (this.count < this.max) {
						this.count++;
						resolve(this.release.bind(this));
					} else {
						this.queue.push(attempt);
					}
				};
				attempt();
			} catch (error) {
				reject(new Error("Error al adquirir el semáforo: " + error.message));
			}
		});
	}

	release() {
		try {
			if (this.count > 0) {
				this.count--;
				if (this.queue.length > 0) {
					const next = this.queue.shift();
					next();
				}
			} else {
				throw new Error("Liberación inválida: no hay procesos activos");
			}
		} catch (error) {
			console.error("Error en release():", error.message);
		}
	}
}

class FilterManager {
	constructor() {
		this.filters = { systolic: true, diastolic: true, heartRate: true, bloodOxygen: true, breathingRhythm: true };
		this.semaphore = new Semaphore(1); // Solo un proceso a la vez
	}

	async updateFilter(metric, status) {
		const release = await this.semaphore.acquire();
		try {
			if (!(metric in this.filters)) {
				throw new Error("Métrica no reconocida: " + metric);
			}
			if (typeof status !== "boolean") {
				throw new Error("Estado inválido para la métrica " + metric);
			}
			this.filters[metric] = status;
		} catch (error) {
			console.error("Error al actualizar el filtro:", error.message);
		} finally {
			release();
		}
	}
}

const server = new WebSocket.Server({ port: 8080 });
const filterManager = new FilterManager();

server.on('connection', (ws) => {
	console.log('Client connected');

	ws.on('message', async (message) => {
		try {
			message = message.toString().toLowerCase();

			if (message.includes("presión arterial") || message.includes("presion arterial") || message.includes("presión") || message.includes("presion") || message.includes("arterial")) {
				await filterManager.updateFilter("systolic", true);
				await filterManager.updateFilter("diastolic", true);
				await filterManager.updateFilter("heartRate", false);
				await filterManager.updateFilter("bloodOxygen", false);
				await filterManager.updateFilter("breathingRhythm", false);
			} else if (message.includes("frecuencia cardíaca") || message.includes("frecuencia cardiaca") || message.includes("frecuencia") || message.includes("cardiaca")) {
				await filterManager.updateFilter("systolic", false);
				await filterManager.updateFilter("diastolic", false);
				await filterManager.updateFilter("heartRate", true);
				await filterManager.updateFilter("bloodOxygen", false);
				await filterManager.updateFilter("breathingRhythm", false);
			} else if (message.includes("oxígeno en sangre") || message.includes("oxigeno en sangre") || message.includes("oxígeno") || message.includes("oxigeno") || message.includes("sangre")) {
				await filterManager.updateFilter("systolic", false);
				await filterManager.updateFilter("diastolic", false);
				await filterManager.updateFilter("heartRate", false);
				await filterManager.updateFilter("bloodOxygen", true);
				await filterManager.updateFilter("breathingRhythm", false);
			} else if (message.includes("ritmo respiratorio") || message.includes("ritmo") || message.includes("respiratorio")) {
				await filterManager.updateFilter("systolic", false);
				await filterManager.updateFilter("diastolic", false);
				await filterManager.updateFilter("heartRate", false);
				await filterManager.updateFilter("bloodOxygen", false);
				await filterManager.updateFilter("breathingRhythm", true);
			} else if (message.includes("todo") || message.includes("todos") || message.includes("todas")) {
				await filterManager.updateFilter("systolic", true);
				await filterManager.updateFilter("diastolic", true);
				await filterManager.updateFilter("heartRate", true);
				await filterManager.updateFilter("bloodOxygen", true);
				await filterManager.updateFilter("breathingRhythm", true);
			}

			ws.send(JSON.stringify({ message: `Filtrado por: ${message}` }));
		} catch (error) {
			console.error('Error processing message:', error);
			ws.send(JSON.stringify({ error: 'An error occurred while processing your message.' }));
		}
	});

	const interval = setInterval(() => {
		try {
			const data = {
				time: new Date().toISOString(),
				...filterManager.filters,
				systolic: filterManager.filters.systolic ? Math.floor(Math.random() * (140 - 90 + 1)) + 90 : null,
				diastolic: filterManager.filters.diastolic ? Math.floor(Math.random() * (90 - 60 + 1)) + 60 : null,
				heartRate: filterManager.filters.heartRate ? Math.floor(Math.random() * (100 - 60 + 1)) + 60 : null,
				bloodOxygen: filterManager.filters.bloodOxygen ? Math.floor(Math.random() * (100 - 95 + 1)) + 95 : null,
				breathingRhythm: filterManager.filters.breathingRhythm ? Math.floor(Math.random() * (20 - 12 + 1)) + 12 : null
			};

			ws.send(JSON.stringify(data));
		} catch (error) {
			console.error('Error sending data:', error);
			ws.send(JSON.stringify({ error: 'An error occurred while sending data.' }));
		}
	}, 2000);

	ws.on('close', () => {
		try {
			clearInterval(interval);
			console.log('Client disconnected');
		} catch (error) {
			console.error('Error during client disconnection:', error);
		}
	});
});

server.on('error', (error) => {
	console.error('WebSocket server error:', error);
});

console.log('WebSocket server running on ws://localhost:8080');