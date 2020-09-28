module.exports = async ({ calendar }, res) => {
  const result = await calendar.calendarList.get({
    calendarId: '9t9mv0lcct9l71hfcsr8oo7be0@group.calendar.google.com',
  });

  return res.status(200).json(result.data);
};
