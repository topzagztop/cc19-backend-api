const notFound = (req, res, next) => {
  res.status(404).json({ message: "Resource not found this server" });
};

module.exports = notFound;
