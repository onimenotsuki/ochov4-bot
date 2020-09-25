const axios = require('axios');
const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

// Servicios
const setState = require('./set-state');
const sendMessage = require('./send-message');
const sendTemplate = require('./send-template');

// Frases de respuesta
const phrases = require('../training/phrases');

module.exports = async (sender) => {
  sendMessage(
    sender,
    phrases.getProducts[Math.floor(Math.random() * phrases.greetings.length)],
  );

  setTimeout(() => setState(sender, 'typing_on'), 1000);

  const result = await axios.get(
    `${process.env.FORWARDING_ADDRESS}/shopify/products`,
    {
      params: {
        shop: 'ocho-v4-bot.myshopify.com',
        limit: 6,
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
      },
    },
  );

  return setTimeout(() => sendTemplate(sender, result.data), 1000);
};
