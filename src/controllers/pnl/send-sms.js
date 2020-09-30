const axios = require('axios');
const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

// Providers
const sms = require('../../providers/sms');

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

    sms({
      number: phoneNumber,
      message: `Se generó la orden: ${order.draft_order.id}. Puedes pasar a la tienda a hacer el pago: ochov4.com`,
    });

    return res.status(200).json({
      message: 'Mensaje enviado correctamente',
      phoneNumber,
      order,
    });
  } catch (error) {
    return res.status(200).json({
      message: 'Mensaje enviado correctamente',
      phoneNumber,
    });
  }
};
