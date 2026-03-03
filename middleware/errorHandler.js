module.exports = (err, req, res, next) => {
  console.error("❌ Error Details:", {
    message: err.message,
    code: err.code,
    stack: err.stack
  });
  
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
