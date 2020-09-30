const axios = require('axios');
const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

module.exports = async ({ params: { id }, query: { shop } }, res) => {
  if (typeof shop === 'undefined' || !shop) {
    return res.status(400).json({ error: 'El parámetro shop es necesario' });
  }

  try {
    const { data } = await axios.get(
      `https://${shop}/admin/products/${id}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
        },
      },
    );

    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ error: JSON.stringify(error) });
  }
};
