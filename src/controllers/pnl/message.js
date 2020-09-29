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
      let products = [];

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

      if (missingPayload.length === 0) {
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

        const { data } = await axios.get(
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

        products = shuffleArray(
          data.products
            .filter(({ tags }) => {
              const tagsToArray = tags.split(', ');

              return (
                tagsToArray.includes(color.value) ||
                tagsToArray.includes(model.value)
              );
            })
            .map(({ title, id }) => ({ title, id })),
        ).filter((_, idx) => idx <= 3);

        return res.status(200).json({
          intent: 'getProduct',
          traits,
          missingPayload,
          products,
          message: `Encontré los siguientes productos para ti ¡papirrín!: ${products.reduce(
            (a, b, idx) =>
              idx === products.length - 1
                ? a.title + '  y  ' + b.title + '.'
                : a.title + ' . ' + b.title,
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
