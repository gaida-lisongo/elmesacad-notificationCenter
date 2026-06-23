// notification-service/src/server.js
const express = require('express');
const amqp = require('amqplib');
require('dotenv').config();
const mailService = require('./config/mail.config');


const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

async function connectRabbitMQ() {
  try {
    const amqpUrl = process.env.RABBITMQ_URL || "amqp://localhost";
    const connection = await amqp.connect(amqpUrl);
    const channel = await connection.createChannel();
    
    const queueName = "user_notifications";
    
    await channel.assertQueue(queueName, { durable: true });
    console.log(`[RabbitMQ] En attente de messages dans la file: ${queueName}`);

    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          const notificationData = JSON.parse(msg.content.toString());
          console.log("[RabbitMQ] Message reçu pour traitement.");

          const { email, nomComplet, otpCode } = notificationData;

          // Utilisation de la méthode spécifique avec le joli template HTML
          await mailService.otpNotifier(email, nomComplet, otpCode);

          console.log(`[Email] Joli mail HTML OTP envoyé avec succès à ${email}`);
          channel.ack(msg);
        } catch (error) {
          console.error("[RabbitMQ Processing Error] Échec de l'opération :", error.message);
          channel.nack(msg, false, true); // Remet le message dans la file en cas de bug
        }
      }
    });

  } catch (error) {
    console.error("[RabbitMQ Error] Impossible de se connecter à RabbitMQ :", error.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}

app.listen(PORT, () => {
  console.log(`[Notification Service] En cours d'exécution sur le port ${PORT}`);
  connectRabbitMQ();
});