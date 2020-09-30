const axios = require('axios');
const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

module.exports = async ({ query }, res) => {
  let {
    title = '',
    limit = 5,
    sinceId,
    vendor,
    handle,
    productType,
    fields,
    status,
    collectionId,
    shop,
  } = query;

  if (typeof shop === 'undefined' || !shop) {
    return res.status(400).json({ error: 'El parámetro shop es necesario' });
  }

  try {
    const { data } = await axios.get(`https://${shop}/admin/products.json`, {
      params: {
        title,
        status,
        limit,
        vendor,
        handle,
        fields,
        published_status: 'published',
        product_type: productType,
        since_id: sinceId,
        collection_id: collectionId,
      },
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      },
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ error: JSON.stringify(error) });
  }
};
