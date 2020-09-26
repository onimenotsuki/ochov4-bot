const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

// Utilidades
const shuffleArray = require('../utilities/shuffle-array');

// Variables de configuración
const fbPageToken = process.env.FB_PAGE_TOKEN;

module.exports = async (id, data) => {
  const body = JSON.stringify({
    recipient: { id },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: shuffleArray(data.products).map((product) => ({
            title: product.title,
            image_url:
              product.images[Math.floor(Math.random() * product.images.length)]
                .src,
            subtitle: product.title,
            default_action: {
              type: 'web_url',
              url: `https://ochov4.com/products/${product.handle}`,
              webview_height_ratio: 'tall',
            },
            buttons: [
              {
                type: 'web_url',
                url: `https://ochov4.com/products/${product.handle}`,
                title: 'Verlo en la tienda',
              },
            ],
          })),
        },
      },
    },
  });

  try {
    const qs = 'access_token=' + encodeURIComponent(fbPageToken);

    const result = await fetch('https://graph.facebook.com/me/messages?' + qs, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const json = await result.json();

    return json;
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};
