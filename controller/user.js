
const express = require("express");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated } = require("../middleware/auth");

const router = express.Router();

// Create User API
router.post("/create-user", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const user = await User.create({ name, email, password });
    sendToken(user, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});




router.post("/login-user", catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("Login request received:", email);

    // Validate input
    if (!email || !password) {
      console.log("Validation failed: Missing email or password");
      return next(new ErrorHandler("Email and password are required!", 400));
    }

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("User not found for email:", email);
      return next(new ErrorHandler("No account found with this email.", 404));
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password for email:", email);
      return next(new ErrorHandler("Invalid email or password.", 400));
    }

    console.log("User authenticated successfully:", email);

    // Generate and send token
    sendToken(user, 200, res);

  } catch (error) {
    console.error("Error during login:", error);
    return next(new ErrorHandler("Something went wrong. Please try again later.", 500));
  }
}));



// Get User Info (Authenticated)
router.get("/getuser", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(new ErrorHandler("User doesn't exist", 400));
    res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Logout User API
router.get("/logout", catchAsyncErrors(async (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true, secure: true });
  res.status(200).json({ success: true, message: "Logout successful!" });
}));

// Update User Info API
router.put("/update-user-info", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password, name, phoneNumber } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) return next(new ErrorHandler("User not found", 400));

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return next(new ErrorHandler("Incorrect password", 400));

    user.name = name;
    user.phoneNumber = phoneNumber;
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Update User Avatar API
router.put("/update-avatar", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const existsUser = await User.findById(req.user.id);
    if (req.body.avatar) {
      const imageId = existsUser.avatar?.public_id;
      if (imageId) await cloudinary.v2.uploader.destroy(imageId);

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
      });

      existsUser.avatar = { public_id: myCloud.public_id, url: myCloud.secure_url };
    }

    await existsUser.save();
    res.status(200).json({ success: true, user: existsUser });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Update User Address API
router.put("/update-user-addresses", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    const sameTypeAddress = user.addresses.find(
      (address) => address.addressType === req.body.addressType
    );
    if (sameTypeAddress) return next(new ErrorHandler(`${req.body.addressType} address already exists`));

    const existsAddress = user.addresses.find(
      (address) => address._id === req.body._id
    );
    if (existsAddress) {
      Object.assign(existsAddress, req.body);
    } else {
      user.addresses.push(req.body);
    }

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Delete User Address API
router.delete("/delete-user-address/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const addressId = req.params.id;

    await User.updateOne({ _id: userId }, { $pull: { addresses: { _id: addressId } } });

    const user = await User.findById(userId);
    res.status(200).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// Update User Password API
router.put("/update-user-password", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if (!isPasswordMatched) return next(new ErrorHandler("Old password is incorrect", 400));

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(new ErrorHandler("Passwords do not match", 400));
    }

    user.password = req.body.newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));


router.post("/user/:userId/add-address", catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const { address1, address2, city, state, country, postalCode, addressType } = req.body;

  try {
      const user = await User.findById(userId);

      if (!user) {
          return next(new ErrorHandler("User not found", 404));
      }

      const newAddress = {
          address1,
          address2,
          city,
          state,
          country,
          postalCode,
          addressType,
      };

      user.addresses.push(newAddress);
      await user.save();

      res.status(200).json({ success: true, message: "Address added successfully", address: newAddress });
  } catch (error) {
      return next(new ErrorHandler(error.message, 500));
  }
}));

// Fetch all addresses for a user
router.get("/user/:userId/addresses", catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  try {
      const user = await User.findById(userId);

      if (!user) {
          return next(new ErrorHandler("User not found", 404));
      }

      res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
      return next(new ErrorHandler(error.message, 500));
  }
}));

module.exports = router;
