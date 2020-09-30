const axios = require('axios');

// Providers
const sms = require('../../providers/sms');

module.exports = async ({ body }, res) => {
  const { phoneNumber, productId } = body;

  const {
    data: product,
  } = await axios.get(
    `${process.env.FORWARDING_ADDRESS}/shopify/products/${productId}`,
    { params: { shop: 'ocho-v4-bot.myshopify.com' } },
  );

  const { data: order } = await axios.post(
    `${process.env.FORWARDING_ADDRESS}/shopify/create-order`,
    {
      item: product.variants[0].id,
    },
  );

  sms({
    number: phoneNumber,
    message: order.invoice_url,
  });

  return res
    .status(200)
    .json({ message: 'Mensaje enviado correctamente', phoneNumber, productId });
};
