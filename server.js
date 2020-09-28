const { Wit, log } = require('node-wit');
const express = require('express');
const winston = require('winston');
const chalk = require('chalk');
const expressWinston = require('express-winston');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const health = require('express-ping');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const xss = require('xss-clean');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const dotenv = require('dotenv');

// Cargamos las rutas
const shopifyRoutes = require('./src/routes/shopify');
const facebookRoutes = require('./src/routes/facebook');
const pnlRoutes = require('./src/routes/pnl');
const googleRoutes = require('./src/routes/google');

// Providers
const mailchimp = require('./src/providers/mailchimp');
const { calendar } = require('./src/providers/google');

// Definimos un separador para el logger
const separator = '\n========================\n';

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

// Logger
app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
      winston.format.simple(),
    ),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: `${separator}HTTP:::{{req.method}} {{req.url}}${separator}`,
    colorize: true,
    ignoreRoute: () => {
      return false;
    },
  }),
);

app.use(express.urlencoded({ extended: true }));

// Protección de cabeceras
app.use(helmet());

// Ping
app.use(health.ping('/api/v1/ping'));

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

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '200kb' }));

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

// Configuración de la base de datos
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);

// Nos conectamos a las base de datos en mongo
mongoose.connect(
  process.env.NODE_ENV === 'development'
    ? process.env.MONGO_DB_URI_DEV
    : process.env.MONGO_DB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

mongoose.connection.on('error', (err) =>
  console.log(chalk.red('MONGODB::ERROR::'), chalk.red(err)),
);

mongoose.connection.on('connected', () => {
  console.log('\n');
  console.log(chalk.blue('==================== MONGO ===================='));
  console.log(chalk.blue('MONGO::CONNECT::Conexión hecha con éxito'));
  console.log(chalk.blue('==================== MONGO ===================='));
});

app.listen(PORT, () => console.log('Listening on :' + PORT + '...'));
