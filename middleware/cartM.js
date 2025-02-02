const jwt = require("jsonwebtoken");
const Joi = require("joi");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const ErrorHandler = require("../utils/ErrorHandler");




// **1. Authentication Middleware**
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new ErrorHandler("Unauthorized. No token provided.", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (error) {
    return next(new ErrorHandler("Unauthorized. Invalid token.", 401));
  }
};

// **2. Validation Middleware**
const validateAddToCart = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    productId: Joi.string().required(),
    quantity: Joi.number().integer().positive().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(error.details[0].message, 400));

  next();
};

const validateRemoveFromCart = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    productId: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(error.details[0].message, 400));

  next();
};

// **3. Rate Limiting Middleware**
const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit to 10 requests per minute
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// **4. Sanitization Middleware**
const sanitizeInputs = (req, res, next) => {
  mongoSanitize()(req, res, () => {
    xss()(req, res, next);
  });
};

module.exports = {
  authenticateUser,
  validateAddToCart,
  validateRemoveFromCart,
  cartLimiter,
  sanitizeInputs,
};
