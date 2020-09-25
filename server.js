const { Wit, log } = require('node-wit');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargamos las rutas
const shopifyRoutes = require('./src/routes/shopify');
const facebookRoutes = require('./src/routes/facebook');
const pnlRoutes = require('./src/routes/pnl');

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

app.use(cors());

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

// Shopify routes
app.use('/shopify', shopifyRoutes);

// Wit Ai routes
app.use('/pnl', pnlRoutes);

// Facebook routes
app.use('/facebook', facebookRoutes);

app.listen(PORT, () => console.log('Listening on :' + PORT + '...'));
