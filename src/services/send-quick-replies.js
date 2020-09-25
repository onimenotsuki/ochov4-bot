const dotenv = require('dotenv');

// Cargamos las variables de entorno
dotenv.config();

// Variables de configuración
const fbPageToken = process.env.FB_PAGE_TOKEN;

module.exports = async (id, text, replies) => {
  const body = JSON.stringify({
    recipient: { id },
    message: { text, quick_replies: [...replies] },
  });
  const qs = 'access_token=' + encodeURIComponent(fbPageToken);

  try {
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
