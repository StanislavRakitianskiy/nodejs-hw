import { HttpError } from 'http-errors';

export const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = 'Internal server error';

  if (err instanceof HttpError) {
    status = err.status || err.statusCode || 500;
    message = err.message;
  } else if (err.status || err.statusCode) {
    status = err.status || err.statusCode;
    message = err.message || 'Internal server error';
  }

  res.status(status).json({
    message
  });
};
