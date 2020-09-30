const axios = require('axios');
const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

module.exports = async ({ body, query }, res) => {
  const { shop } = query;
  const { item } = body;

  if (typeof shop === 'undefined' || !shop) {
    return res.status(400).json({ error: 'El parámetro shop es necesario' });
  }

  try {
    const { data } = await axios.post(
      `https://${shop}/admin/draft_orders.json`,
      {
        draft_order: {
          line_items: [
            {
              variant_id: item,
              quantity: 1,
            },
          ],
        },
      },
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
