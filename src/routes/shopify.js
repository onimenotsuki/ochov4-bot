const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const nonce = require('nonce')();
const querystring = require('querystring');
const cookie = require('cookie');
const crypto = require('crypto');
const axios = require('axios');

// Cargamos las variables de entorno
dotenv.config();

// Controllers
const shopifyController = require('../controllers/shopify');

// Variables de configuración
const shApiKey = process.env.SHOPIFY_API_KEY;
const shApiSecret = process.env.SHOPIFY_API_SECRET;
const scope = 'read_products';
const forwardingAddress = process.env.FORWARDING_ADDRESS;

router.get('/', (req, res) => {
  const shop = req.query.shop;

  if (shop) {
    const state = nonce();
    const redirectUri = `${forwardingAddress}/shopify/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${shApiKey}&scope=${scope}&state=${state}&redirect_uri=${redirectUri}`;

    res.cookie('state', state);
    res.redirect(installUrl);
  }

  return res
    .status(400)
    .send(
      'Missing shop parameter. Please add ?shop=your-development-shop to your request',
    );
});

router.get('/callback', async (req, res) => {
  const { shop, hmac, code, state } = req.query;
  const stateCookie = cookie.parse(req.headers.cookie).state;

  if (state !== stateCookie) {
    return res.status(403).send('Request origin cannot be verified.');
  }

  if (shop && hmac && code) {
    const map = Object.assign({}, req.query);

    // Eliminamos la propiedad hmac del objecto
    delete map.hmac;

    const message = querystring.stringify(map);
    const generatedHash = crypto
      .createHmac('sha256', shApiSecret)
      .update(message)
      .digest('hex');

    if (generatedHash !== hmac) {
      return res.status(400).send('HMAC validation failed');
    }

    const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
    const accessTokenPayload = {
      client_id: shApiKey,
      client_secret: shApiSecret,
      code,
    };

    try {
      const result = await axios.post(
        accessTokenRequestUrl,
        accessTokenPayload,
      );

      console.log(result.data);

      return res.send(`access_token: ${result.data.access_token}`);
    } catch (error) {
      console.log(error);
      return res.send('Hubo un error');
    }
  }

  return res.status(400).send('Required parameters missing');
});

router.get('/products', shopifyController.getProducts);

module.exports = router;
