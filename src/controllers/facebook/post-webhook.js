const dotenv = require('dotenv');
const axios = require('axios');
const validator = require('validator');
const add = require('date-fns/add');

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
                message:
                  'Gracias por suscribirte a #OchoV4Team desde Messenger',
              });

              return setTimeout(() => {
                sendMessage(sender, 'Te envié un SMS para confirmar.');
              }, 1000);
            }

            if (quickReply.payload === 'schedule:reserve') {
              setState(sender, 'typing_on');

              return sendMessage(
                sender,
                'Por favor, escribe el día y la hora de tu cita.',
              );
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
                .then(async ({ intents, entities }) => {
                  if (Array.isArray(intents) && intents.length) {
                    const flatIntents = intents.map(({ name }) => name);

                    if (flatIntents.includes('compliment')) {
                      return sendMessage(
                        sender,
                        phrases.compliment[
                          Math.floor(Math.random() * phrases.compliment.length)
                        ],
                      );
                    }

                    if (flatIntents.includes('greetings')) {
                      return sendMessage(
                        sender,
                        phrases.greetings[
                          Math.floor(Math.random() * phrases.greetings.length)
                        ],
                      );
                    }

                    if (flatIntents.includes('askOriginals')) {
                      return sendMessage(
                        sender,
                        'Todos nuestros productos son 100% originales. Visita nuestro sitio web: https://ochov4.com para obtener más información.',
                      );
                    }

                    if (flatIntents.includes('help')) {
                      return sendQuickReplies(
                        sender,
                        'Te aparecerá en tu pantalla todo lo que puedo hacer, solo tienes que seleccionar una opción y te ayudaré con eso.',
                        [
                          {
                            content_type: 'text',
                            title: 'Buscar productos',
                            payload: 'shop:products',
                          },
                          {
                            content_type: 'text',
                            title: 'Enviame promociones',
                            payload: 'marketing:email',
                          },
                          {
                            content_type: 'text',
                            title: 'Reservar cita',
                            payload: 'schedule:reserve',
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

                    if (flatIntents.includes('getSchedule')) {
                      return sendMessage(
                        sender,
                        'Por supuesto, yo te ayudo. Solo escribe el día y la hora en que quieres hacer tu reservación.',
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
                        () => sendTemplate(sender, result.data.products),
                        1000,
                      );
                    }

                    if (flatIntents.includes('schedule')) {
                      const datetimeSchedule = entities.hasOwnProperty(
                        'wit$datetime:datetime',
                      )
                        ? entities['wit$datetime:datetime'][0]
                        : { value: '' };

                      if (datetimeSchedule.value) {
                        console.log(datetimeSchedule.value);

                        const start = new Date(datetimeSchedule.value);
                        const end = new Date(
                          add(new Date(datetimeSchedule.value), {
                            minutes: 20,
                          }),
                        );

                        try {
                          const result = await axios.post(
                            `${process.env.FORWARDING_ADDRESS}/google/calendars/me/events`,
                            {
                              summary: 'Evento creado desde Messenger',
                              start: {
                                dateTime: start,
                                timeZone: 'America/Mexico_City',
                              },
                              end: {
                                dateTime: end,
                                timeZone: 'America/Mexico_City',
                              },
                            },
                          );

                          return sendMessage(
                            sender,
                            `Tu cita ha sido agendada. Puedes visitar el siguiente enlace para confirmar: ${result.data.htmlLink}`,
                          );
                        } catch (error) {
                          return sendMessage(
                            sender,
                            'Hubo un error al agendar tu cita, intenta más tarde.',
                          );
                        }
                      }

                      return sendMessage(
                        sender,
                        'Por favor, sé más especifíco, no pude agendar la cita correctamente.',
                      );
                    }

                    if (flatIntents.includes('getProduct')) {
                      let products = [];

                      sendMessage(
                        sender,
                        phrases.getProduct[
                          Math.floor(Math.random() * phrases.getProduct.length)
                        ],
                      );

                      const genre = entities.hasOwnProperty('genre:genre')
                        ? entities['genre:genre'][0]
                        : { value: '' };

                      const brand = entities.hasOwnProperty('brand:brand')
                        ? entities['brand:brand'][0]
                        : { value: '' };

                      const model = entities.hasOwnProperty('model:model')
                        ? entities['model:model'][0]
                        : { value: '' };

                      const color = entities.hasOwnProperty('color:color')
                        ? entities['color:color'][0]
                        : { value: '' };

                      let collection = '';

                      switch (genre.value) {
                        case 'mujer':
                          collection = '222042521763';
                          break;
                        case 'hombre':
                          collection = '222042620067';
                          break;
                        default:
                          collection = '';
                          break;
                      }

                      setTimeout(() => setState(sender, 'typing_on'), 1000);

                      const result = await axios.get(
                        `${process.env.FORWARDING_ADDRESS}/shopify/products`,
                        {
                          params: {
                            shop: 'ocho-v4-bot.myshopify.com',
                            limit: 6,
                            accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
                            vendor: brand.value,
                            collectionId: collection,
                          },
                        },
                      );

                      products =
                        color.value !== ''
                          ? result.data.products.filter(({ tags }) => {
                              const tagsToArray = tags.split(', ');

                              return (
                                tagsToArray.includes(color.value) ||
                                tagsToArray.includes(model.value)
                              );
                            })
                          : result.data.products;

                      if (products.length < 1) {
                        sendMessage(
                          sender,
                          'No encontré ningún modelo con esas características.',
                        );

                        return sendQuickReplies(
                          sender,
                          '¿Deseas que te envíe a tu correo la información cuando nos hayan llegado nuevos modelos?',
                          [
                            {
                              content_type: 'text',
                              title: 'Si',
                              payload: 'marketing:email',
                            },
                            {
                              content_type: 'text',
                              title: 'No',
                              payload: 'salutation:bye',
                            },
                          ],
                        );
                      }

                      return sendTemplate(sender, products);
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
