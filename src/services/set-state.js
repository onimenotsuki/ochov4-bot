const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

// Variables de configuración
const fbPageToken = process.env.FB_PAGE_TOKEN;

module.exports = async (id, state = 'typing_on') => {
  const body = JSON.stringify({
    recipient: { id },
    sender_action: state,
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
