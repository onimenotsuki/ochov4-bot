const dotenv = require('dotenv');
const axios = require('axios');
const validator = require('validator');

// Cargamos las variables de entorno
dotenv.config();

// Frases de respuesta
const phrases = require('../../training/phrases');

// Providers
const sms = require('../../providers/sms');

// Servicios
const sendMessage = require('../../services/send-message');
const sendTemplate = require('../../services/send-template');
const setState = require('../../services/set-state');
const sendQuickReplies = require('../../services/send-quick-replies');
const sendProducts = require('../../services/send-products');
const addSubscriber = require('../../services/add-subscriber');

module.exports = (req, res) => {
  // Parse the Messenger payload
  // See the Webhook reference
  // https://developers.facebook.com/docs/messenger-platform/webhook-reference
  const data = req.body;

  if (data.object === 'page') {
    data.entry.forEach((entry) => {
      entry.messaging.forEach(async (event) => {
        if (event.message && !event.message.is_echo) {
          // Yay! We got a new message!
          // We retrieve the Facebook user ID of the sender
          const sender = event.sender.id;

          // We could retrieve the user's current session, or create one if it doesn't exist
          // This is useful if we want our bot to figure out the conversation history
          // const sessionId = findOrCreateSession(sender);

          console.log(event);

          setState(sender, 'mark_seen');

          // We retrieve the message content
          const { text, attachments, quick_reply: quickReply } = event.message;

          if (quickReply) {
            if (validator.isEmail(quickReply.payload)) {
              // const response = await addSubscriber({
              //   email: quickReply.payload,
              //   sender,
              // });

              setState(sender, 'typing_on');

              // setTimeout(() => {
              //   sendMessage(sender, response.message);
              // }, 1000);

              return setTimeout(() => {
                sendQuickReplies(
                  sender,
                  'Deseas recibir las promociones por SMS?',
                  [
                    {
                      content_type: 'text',
                      title: 'Si',
                      payload: 'marketing:sms',
                    },
                    {
                      content_type: 'text',
                      title: 'No',
                      payload: 'salutation:bye',
                    },
                  ],
                );
              }, 1000);
            }

            if (validator.isMobilePhone(quickReply.payload, 'es-MX')) {
              setState(sender, 'typing_on');

              sms({
                number: quickReply.payload.replace('+52', ''),
                message: 'Gracias por suscribirte a #OchoV4Team',
              });

              return setTimeout(() => {
                sendMessage(sender, 'Te envié un SMS para confirmar.');
              }, 1000);
            }

            if (quickReply.payload === 'shop:products') {
              setState(sender, 'typing_on');

              return sendProducts(sender);
            }

            if (quickReply.payload === 'marketing:email') {
              setState(sender, 'typing_on');

              return sendQuickReplies(sender, 'Envíame tu correo, por favor.', [
                {
                  content_type: 'user_email',
                },
              ]);
            }

            if (quickReply.payload === 'marketing:sms') {
              setState(sender, 'typing_on');

              return sendQuickReplies(
                sender,
                'Envíame tu número de teléfono, por favor.',
                [
                  {
                    content_type: 'user_phone_number',
                  },
                ],
              );
            }

            if (quickReply.payload === 'salutation:bye') {
              setState(sender, 'typing_on');

              return sendMessage(
                sender,
                phrases.bye[Math.floor(Math.random() * phrases.bye.length)],
              );
            }
          }

          if (validator.isEmail(text)) {
            const response = await addSubscriber({ email: text, sender });

            setState(sender, 'typing_on');

            return setTimeout(() => {
              sendMessage(sender, response.message);
            }, 1000);
          }

          if (attachments) {
            // We received an attachment
            // Let's reply with an automatic message
            setTimeout(() => {
              setState(sender);
            }, 1000);

            setTimeout(() => {
              sendMessage(
                sender,
                'Lo siento, por el momento, solo puedo procesar mensajes de texto.',
              );
            }, 1000);
          } else if (text) {
            // We receivped a text message
            // Let's run /message on the text to extract some entities, intents and traits
            setTimeout(() => setState(sender, 'typing_on'), 1000);

            setTimeout(() => {
              req.wit
                .message(text)
                .then(async ({ intents }) => {
                  if (Array.isArray(intents) && intents.length) {
                    const flatIntents = intents.map(({ name }) => name);

                    if (flatIntents.includes('greetings')) {
                      return sendMessage(
                        sender,
                        phrases.greetings[
                          Math.floor(Math.random() * phrases.greetings.length)
                        ],
                      );
                    }

                    if (flatIntents.includes('help')) {
                      return sendQuickReplies(
                        sender,
                        'Te aparecerá en tu pantalla todo lo que puedo hacer, solo tienes que seleccionar una opción y te ayudaré con eso.',
                        [
                          {
                            content_type: 'text',
                            title: 'Todos los productos',
                            payload: 'shop:products',
                          },
                          {
                            content_type: 'text',
                            title: 'Checar cupones',
                            payload: 'shop:codes',
                          },
                          {
                            content_type: 'text',
                            title: 'Enviame promociones',
                            payload: 'marketing:email',
                          },
                        ],
                      );
                    }

                    if (flatIntents.includes('bye')) {
                      return sendMessage(
                        sender,
                        phrases.bye[
                          Math.floor(Math.random() * phrases.bye.length)
                        ],
                      );
                    }

                    if (flatIntents.includes('getProducts')) {
                      sendMessage(
                        sender,
                        phrases.getProducts[
                          Math.floor(Math.random() * phrases.greetings.length)
                        ],
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

                      return setTimeout(
                        () => sendTemplate(sender, result.data),
                        1000,
                      );
                    }

                    return sendMessage(
                      sender,
                      'No te entendí, repítelo, por favor.',
                    );
                  }

                  return sendMessage(
                    sender,
                    'No te entendí, repítelo, por favor.',
                  );
                })
                .catch((err) => {
                  console.error(
                    '¡Ups! Hay un error con Wit.Ai: ',
                    err.stack || err,
                  );

                  return sendMessage(
                    sender,
                    'No te entendí, repite tu pregunta, por favor.',
                  );
                });
            }, 1000);
          }
        } else {
          console.log('received event', JSON.stringify(event));
        }
      });
    });
  }
  res.sendStatus(200);
};
