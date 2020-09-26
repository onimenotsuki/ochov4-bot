module.exports = (size) => {
  const stringSize = size.toString();

  if (stringSize.length === 1) {
    return parseInt(`2${stringSize}`, 10);
  }

  return parseInt(size, 10);
};
