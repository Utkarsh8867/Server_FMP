// // create token and saving that in cookies
// const sendToken = (user, statusCode, res) => {
//   const token = user.getJwtToken();

//   // Options for cookies
//   const options = {
//     expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
//     httpOnly: true,
//     sameSite: "none",
//     secure: true,
//   };

//   res.status(statusCode).cookie("token", token, options).json({
//     success: true,
//     user,
//     token,
//   });
// };

// module.exports = sendToken;


// const sendToken = (user, statusCode, res) => {
//   const token = user.getJwtToken(); // Assumes your User model has a method for generating JWT

//   const options = {
//     httpOnly: true, // Prevents client-side JavaScript access
//     expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
//     secure: process.env.NODE_ENV === "production", // Ensures cookies are only sent over HTTPS in production
//   };

//   res.status(statusCode).cookie("token", token, options).json({
//     success: true,
//     token,
//     user: {
//       id: user._id,
//       name: user.name,
//       email: user.email,
//     },
//   });
// };


// const sendToken = (user, statusCode, res) => {
//   const token = user.getJwtToken(); // Get JWT token

//   const options = {
//     expires: new Date(Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000), // Set token expiry
//     httpOnly: true, // Ensure the token is sent in an HTTP-only cookie
//   };

//   res.status(statusCode).cookie('token', token, options).json({
//     success: true,
//     token,
//     userId: user._id,
//   });
// };



const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken(); // Get JWT token

  // Ensure the expires field is a valid Date object
  const expiresIn = process.env.JWT_EXPIRES_IN || 30;  // Default to 30 days if not set
  const expiresDate = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000); // Expiry in days

  const options = {
    expires: expiresDate, // Corrected expires field
    httpOnly: true, // Ensure the token is sent in an HTTP-only cookie
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    userId: user._id,
  });
};


module.exports = sendToken;