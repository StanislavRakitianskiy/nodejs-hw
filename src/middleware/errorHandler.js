export const errorHandler = (err, req, res, next) => {
  // Handle mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' || (err.kind === 'ObjectId')) {
    return res.status(404).json({
      message: 'Note not found'
    });
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: err.message
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    message
  });
};
