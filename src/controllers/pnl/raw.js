const is = require('is_js');

module.exports = async ({ wit, body }, res) => {
  const { text } = body;

  if (is.empty(text)) {
    return res.status(400).json({ message: 'Es necesario el parámetro text' });
  }

  try {
    const { intents, entities, traits } = await wit.message(text);

    return res.status(200).json({ intents, entities, traits });
  } catch (error) {
    return res.status(400).json({ mesage: JSON.stringify(error) });
  }
};
