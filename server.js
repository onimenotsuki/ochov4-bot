const { Wit, log } = require('node-wit');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const health = require('express-ping');
const xss = require('xss-clean');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargamos las rutas
const shopifyRoutes = require('./src/routes/shopify');
const facebookRoutes = require('./src/routes/facebook');
const pnlRoutes = require('./src/routes/pnl');
const googleRoutes = require('./src/routes/google');

// Providers
const mailchimp = require('./src/providers/mailchimp');
const { calendar } = require('./src/providers/google');

// Cargamos las variables de entorno
dotenv.config();

// Webserver parameter
const PORT = process.env.PORT || 8445;

// Wit.ai parameters
const WIT_TOKEN = process.env.WIT_TOKEN;

// ----------------------------------------------------------------------------
// Messenger API specific code
// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference

// Setting up our bot
const wit = new Wit({
  accessToken: WIT_TOKEN,
  logger: new log.Logger(log.INFO),
});

// Starting our webserver and putting it all together
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Protección de cabeceras
app.use(helmet());

// CORS
app.use(cors());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 2000, // limite el número de solicitudes por IP
  }),
);

// Un poco de seguridad
app.use(mongoSanitize());
app.use(xss());

app.use(({ method, url }, rsp, next) => {
  rsp.on('finish', () => {
    console.log(`${rsp.statusCode} ${method} ${url}`);
  });
  next();
});

// Agregamos wit como Middleware para
// poder utilizarlo en nuestras peticiones
app.use((req, _res, next) => {
  req.wit = wit;
  next();
});

// Agregamos mailchimp como Middleware para
// poder utilizarla en nuestras peticiones
app.use((req, _res, next) => {
  req.mailchimp = mailchimp;
  next();
});

// // Metemos en la solicitud a Google Calendar API
// // como Middlewares
app.use((req, _, next) => {
  req.calendar = calendar;
  next();
});

// Ping
app.use(health.ping('/ping'));

// Shopify routes
app.use('/shopify', shopifyRoutes);

// Google routes
app.use('/google', googleRoutes);

// Wit Ai routes
app.use('/pnl', pnlRoutes);

// Facebook routes
app.use('/facebook', facebookRoutes);

app.listen(PORT, () => console.log('Listening on :' + PORT + '...'));
