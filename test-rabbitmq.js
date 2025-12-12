const amqp = require('amqplib');

async function connect() {
    try {
        const connection = await amqp.connect('amqp://admin:securepassword@localhost:5672');
        console.log('Connected to RabbitMQ');
        await connection.close();
    } catch (error) {
        console.error('Failed to connect', error);
    }
}

connect();
