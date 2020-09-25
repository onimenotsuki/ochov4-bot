const crypto = require('crypto');

let fbVerifyToken = null;

crypto.randomBytes(8, (err, buff) => {
  if (err) throw err;
  fbVerifyToken = buff.toString('hex');
  console.log(`/webhook will accept the Verify Token "${fbVerifyToken}"`);
});

module.exports = ({ query }, res) => {
  if (
    query['hub.mode'] === 'subscribe' &&
    query['hub.verify_token'] === fbVerifyToken
  ) {
    return res.send(query['hub.challenge']);
  }

  return res.sendStatus(400);
};
