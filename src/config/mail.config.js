// notification-service/src/config/mail.config.js
const nodemailer = require('nodemailer');

// On charge dotenv ici aussi par sécurité pour être SÛR qu'il lit le fichier
require('dotenv').config();

const host = process.env.EMAIL_HOST;
const port = parseInt(process.env.EMAIL_PORT) || 587;
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

console.log("--------------------------------------------------");
console.log(`[Email Config] Tentative de connexion SMTP :`);
console.log(` -> HÔTE : ${host}`);
console.log(` -> PORT : ${port}`);
console.log(` -> UTILISATEUR : ${user}`);
console.log("--------------------------------------------------");

if (!host) {
  console.error("[Email CRITICAL] EMAIL_HOST n'est pas configuré dans le .env !");
}

// Création directe du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  host: host,
  port: port,
  secure: port === 465, // true pour le port 465, false pour le port 587
  auth: {
    user: user,
    pass: pass
  },
  tls: {
    // Indispensable pour LWS et les serveurs d'hébergement mutualisés
    rejectUnauthorized: false
  }
});

/**
 * Fonction générique d'envoi de mail
 */
async function sendMail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Plateforme CERH" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`[Email Success] Message envoyé : ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Error] Échec de l'envoi à ${to}:`, error.message);
    throw error;
  }
}

/**
 * Fonction spécifique pour l'OTP
 */
async function otpNotifier(to, name, otpCode) {
  const htmlTemplate = `
  <div style="font-family: sans-serif; padding: 20px;">
    <h2>🔐 Votre code OTP CERH</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Votre code de validation temporaire est :</p>
    <h1 style="color: #166534; letter-spacing: 2px;">${otpCode}</h1>
    <p style="color: gray; font-size: 12px;">Valable pendant 5 minutes.</p>
  </div>`;

  return sendMail(to, "🔐 Votre code de validation d'accès - CERH", `Code : ${otpCode}`, htmlTemplate);
}

// On exporte directement les fonctions
module.exports = {
  sendMail,
  otpNotifier
};