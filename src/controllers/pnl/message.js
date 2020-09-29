const dotenv = require('dotenv');
const axios = require('axios');
const is = require('is_js');

// Cargamos las variables de entorno
dotenv.config();

const phrases = require('../../training/phrases');

const shuffleArray = require('../../utilities/shuffle-array');

module.exports = async ({ wit, body }, res) => {
  const { text } = body;

  if (is.empty(text)) {
    return res.status(400).json({ message: 'Es necesario el parámetro text' });
  }

  try {
    const { intents, entities, traits } = await wit.message(text);
    const flatIntents = intents.map(({ name }) => name);

    if (flatIntents.includes('greetings')) {
      return res.status(200).json({
        message:
          phrases.greetings[
            Math.floor(Math.random() * phrases.greetings.length)
          ],
        intent: 'greetings',
      });
    }

    if (flatIntents.includes('bye')) {
      return res.status(200).json({
        message: phrases.bye[Math.floor(Math.random() * phrases.bye.length)],
        intent: 'bye',
      });
    }

    if (flatIntents.includes('getProduct')) {
      const missingPayload = [];

      if (
        Object.keys(entities).filter((el) => el.includes('color')).length === 0
      ) {
        missingPayload.push('color');
      }

      if (
        Object.keys(entities).filter((el) => el.includes('number')).length === 0
      ) {
        missingPayload.push('number');
      }

      const genre = entities.hasOwnProperty('genre:genre')
        ? entities['genre:genre'][0]
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

      if (missingPayload.length === 0) {
        let products = [];
        const { data } = await axios.get(
          `${process.env.FORWARDING_ADDRESS}/shopify/products`,
          {
            params: {
              shop: 'ocho-v4-bot.myshopify.com',
              limit: 50,
              accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
              collectionId: collection,
            },
          },
        );

        productsObj = data.products
          .map(({ title, tags, id }) => ({ title, tags, id }))
          .filter(({ tags }) => tags.includes(color.value));

        products = shuffleArray(productsObj.map(({ title }) => title)).filter(
          (_, idx) => idx <= 3,
        );

        return res.status(200).json({
          intent: 'getProduct',
          traits,
          missingPayload,
          products,
          productsObj,
          success: Boolean(products.length),
          message:
            products.length < 1
              ? 'Lo siento, no encontré ningún producto con las características que deseas'
              : `Encontré los siguientes productos para ti: ${products.reduce(
                  (a, b, idx) =>
                    idx === products.length - 1
                      ? a + '  y  ' + b + '.'
                      : a + ' . ' + b,
                )}`,
        });
      }

      return res.status(200).json({
        intent: 'getProduct',
        traits,
        missingPayload,
        products: [],
      });
    }

    return res.status(200).json({ intents, entities, traits });
  } catch (error) {
    return res.status(400).json({ message: JSON.stringify(error) });
  }
};
