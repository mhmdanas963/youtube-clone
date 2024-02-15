// Promise version
const asyncHandler = (requestHandler) => (req, res, next) => {
  return new Promise.resolve(requestHandler(req, res, next)).catch((error) =>
    next(error)
  );
};
