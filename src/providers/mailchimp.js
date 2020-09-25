const mailchimp = require('@mailchimp/mailchimp_marketing');
const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: 'us17',
});

module.exports = mailchimp;
