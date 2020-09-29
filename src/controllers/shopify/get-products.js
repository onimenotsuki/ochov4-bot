const axios = require('axios');

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
    accessToken,
    collectionId,
    shop,
  } = query;

  if (typeof accessToken === 'undefined' || !accessToken) {
    return res.status(403).json({
      error:
        'Necesitas un access_token de Shopify para realizar la petición, pídelo al administrador',
    });
  }

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
        'X-Shopify-Access-Token': accessToken,
      },
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ error: JSON.stringify(error) });
  }
};
