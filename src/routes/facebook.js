const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const axios = require('axios');
const crypto = require('crypto');

// Cargamos las variables de entorno
dotenv.config();

// Variables de configuración
const fbPageToken = process.env.FB_PAGE_TOKEN;

let fbVerifyToken = null;

crypto.randomBytes(8, (err, buff) => {
  if (err) throw err;
  fbVerifyToken = buff.toString('hex');
  console.log(`/webhook will accept the Verify Token "${fbVerifyToken}"`);
});

const fbTemplate = async (id, data) => {
  const body = JSON.stringify({
    recipient: { id },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: data.products.map((product) => ({
            title: product.title,
            image_url: product.images[0].src,
            subtitle: product.title,
            default_action: {
              type: 'web_url',
              url: 'https://ochov4.com/products/nike-zoom-freak-1-oreo',
              webview_height_ratio: 'tall',
            },
            buttons: [
              {
                type: 'web_url',
                url: 'https://ochov4.com/products/nike-zoom-freak-1-oreo',
                title: 'Verlo en la tienda',
              },
            ],
          })),
        },
      },
    },
  });

  try {
    const qs = 'access_token=' + encodeURIComponent(fbPageToken);

    const result = await fetch('https://graph.facebook.com/me/messages?' + qs, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const json = await result.json();

    return json;
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

const fbMessage = async (id, text) => {
  const body = JSON.stringify({
    recipient: { id },
    message: { text },
  });
  const qs = 'access_token=' + encodeURIComponent(fbPageToken);

  try {
    const result = await fetch('https://graph.facebook.com/me/messages?' + qs, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const json = await result.json();

    return json;
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

router.post('/webhook', (req, res) => {
  // Parse the Messenger payload
  // See the Webhook reference
  // https://developers.facebook.com/docs/messenger-platform/webhook-reference
  const data = req.body;

  if (data.object === 'page') {
    data.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        console.log(event);

        if (event.message && !event.message.is_echo) {
          // Yay! We got a new message!
          // We retrieve the Facebook user ID of the sender
          const sender = event.sender.id;

          // We could retrieve the user's current session, or create one if it doesn't exist
          // This is useful if we want our bot to figure out the conversation history
          // const sessionId = findOrCreateSession(sender);

          // We retrieve the message content
          const { text, attachments } = event.message;

          if (attachments) {
            // We received an attachment
            // Let's reply with an automatic message
            fbMessage(
              sender,
              'Sorry I can only process text messages for now.',
            ).catch(console.error);
          } else if (text) {
            // We received a text message
            // Let's run /message on the text to extract some entities, intents and traits
            req.wit
              .message(text)
              .then(async ({ intents }) => {
                if (Array.isArray(intents) && intents.length) {
                  const flatIntents = intents.map(({ name }) => name);

                  if (flatIntents.includes('greetings')) {
                    return fbMessage(sender, `Hola, pregúntame algo.`);
                  }

                  if (flatIntents.includes('get_products')) {
                    const result = await axios.get(
                      `${process.env.FORWARDING_ADDRESS}/shopify/products`,
                      {
                        params: {
                          shop: 'ocho-v4-bot.myshopify.com',
                          limit: 5,
                        },
                      },
                    );

                    return fbTemplate(sender, result.data);
                  }

                  return fbMessage(
                    sender,
                    'No te entendí, repítelo, por favor. Deep 2',
                  );
                }

                return fbMessage(
                  sender,
                  'No te entendí, repítelo, por favor. Deep 1',
                );
              })
              .catch((err) => {
                console.error(
                  'Oops! Got an error from Wit: ',
                  err.stack || err,
                );

                return fbMessage(
                  sender,
                  'No te entendí, repite tu pregunta, por favor.',
                );
              });
          }
        } else {
          console.log('received event', JSON.stringify(event));
        }
      });
    });
  }
  res.sendStatus(200);
});

// Webhook setup
router.get('/webhook', (req, res) => {
  if (
    req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === fbVerifyToken
  ) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

module.exports = router;
