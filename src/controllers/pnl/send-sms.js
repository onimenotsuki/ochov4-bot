const axios = require('axios');
const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

// Providers
const sms = require('../../providers/sms');
const shortUrl = require('../../providers/short-url');

module.exports = async ({ body }, res) => {
  const { phoneNumber, index } = body;

  const selectItem = (number) => {
    switch (number) {
      case 0:
        return '36353320943779';
      case 1:
        return '36392326201507';
      case 2:
        return '36441062211747';
      default:
        return '36441062211747';
    }
  };

  try {
    const { data: order } = await axios.post(
      `${process.env.FORWARDING_ADDRESS}/shopify/create-order`,
      {
        item: selectItem(parseInt(index, 10)),
      },
      {
        params: {
          shop: 'ocho-v4-bot.myshopify.com',
        },
      },
    );

    // const shortedUrl = shortUrl(order.draft_order.invoice_url);

    // sms({
    //   number: phoneNumber,
    //   message: `Se generó la orden: ${order.draft_order.id}, accede al enlace para terminar`,
    // });

    return res.status(200).json({
      message: 'Mensaje enviado correctamente',
      phoneNumber,
      order,
      shortedUrl,
    });
  } catch (error) {
    return res.status(200).json({
      message: 'Mensaje enviado correctamente',
      phoneNumber,
    });
  }
};
