const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

module.exports = async ({ wit, body }, res) => {
  const { text } = body;

  try {
    const { intents, entities, traits } = await wit.message(text);
    const flatIntents = intents.map(({ name }) => name);

    if (flatIntents.includes('getIndex')) {
      const index = entities.hasOwnProperty('index:index')
        ? entities['index:index'][0]
        : { value: '' };

      return res.status(200).json({
        index: parseInt(index.value, 10),
      });
    }

    return res.status(200).json({ intents, entities, traits });
  } catch (error) {
    return res.status(400).json({ message: JSON.stringify(error) });
  }
};
