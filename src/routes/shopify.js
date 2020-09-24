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

      req.redis.set('shopifyAccessToken', result.data.access_token);

      return res.send('HMAC Validate');
    } catch (error) {
      console.log(error);
      return res.send('Hubo un error');
    }
  }

  return res.status(400).send('Required parameters missing');
});

router.get('/products', ({ redis, query }, res) => {
  const { shop } = query;
  let {
    title = '',
    limit = 5,
    sinceId,
    vendor,
    handle,
    productType,
    fields,
    status,
  } = query;

  redis.get('shopifyAccessToken', async (error, accessToken) => {
    if (error) {
      return res.status(400).json({ error: JSON.stringify(error) });
    }

    const { data } = await axios.get(`https://${shop}/admin/products.json`, {
      params: {
        title,
        published_status: 'published',
        status,
        limit,
        since_id: sinceId,
        vendor,
        handle,
        product_type: productType,
        fields,
      },
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    return res.status(200).json(data);
  });
});

module.exports = router;
