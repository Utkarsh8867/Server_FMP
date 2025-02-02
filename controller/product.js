const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");


function decodeBase64Image(dataString) {
  const matches = dataString.match(/^data:(.*?);base64,(.*)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 string");
  }

  return {
    type: matches[1],
    buffer: Buffer.from(matches[2], "base64"),
  };
}



router.post(
  "/create-product",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { shopId, image } = req.body;

      // Validate shop
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop ID is invalid!", 400));
      }

      // Validate image URL
      if (!image || typeof image !== "string") {
        return next(new ErrorHandler("Invalid or missing image URL!", 400));
      }

      // Prepare product data
      const productData = {
        ...req.body,
        image: image, // Store the image URL as a string in the database
        shop: shopId, // Store the shop ID for the product
      };

      // Create the product
      const product = await Product.create(productData);

      // Send response
      res.status(201).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error(error);
      return next(new ErrorHandler(error.message || "Server Error", 500));
    }
  })
);



router.get(
  "/get-products-by-category",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { isFeatured } = req.query;

      // Fetch products based on the 'isFeatured' flag
      const products = isFeatured
        ? await Product.find({ isFeatured: true })
        : await Product.find();

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);



router.get(
  "/product/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id).populate("shopId", "name");
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }
      res.status(200).json({
        success: true,
        product: {
          ...product._doc,
          shopName: product.shopId.name, // Include shop name
        },
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);







// Get featured products
router.get("/featured-products", async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true });
    res.status(200).json({ success: true, products: featuredProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get(
  "/get-all-Featured-products/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id });
      const featuredProducts = await Product.find({ isFeatured: true });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);






// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }    

      for (let i = 0; 1 < product.images.length; i++) {
        const result = await cloudinary.v2.uploader.destroy(
          product.images[i].public_id
        );
      }
    
      await product.remove();

      res.status(201).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all products
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

router.get(
  "/get-products-by-category",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { category } = req.query; // Get the category from query params
      const products = await Product.find(category ? { category } : {}).sort({
        createdAt: -1,
      });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

router.get(
  "/get-fruits",
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Fetch only products with the 'Fruits' category
      const products = await Product.find({ category: 'Fruits' })
        .sort({ createdAt: -1 }); // Sort by createdAt in descending order

      // Check if no products were found
      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No products found in the 'Fruits' category",
        });
      }

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 500)); // Server error
    }
  })
);


router.get(
  "/get-Vegetables",
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Fetch only products with the 'Fruits' category
      const products = await Product.find({ category: 'Vegetables' })
        .sort({ createdAt: -1 }); // Sort by createdAt in descending order

      // Check if no products were found
      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No products found in the 'Vegetables' category",
        });
      }

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 500)); // Server error
    }
  })
);



router.get(
  "/get-grains",
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Fetch only products with the 'Fruits' category
      const products = await Product.find({ category: 'Grains' })
        .sort({ createdAt: -1 }); // Sort by createdAt in descending order

      // Check if no products were found
      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No products found in the 'grains' category",
        });
      }

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 500)); // Server error
    }
  })
);

router.get(
  "/milk-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      // Fetch only products with the 'Fruits' category
      const products = await Product.find({ category: 'Milk-products' })
        .sort({ createdAt: -1 }); // Sort by createdAt in descending order

      // Check if no products were found
      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No products found in the 'Vegetables' category",
        });
      }

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 500)); // Server error
    }
  })
);





 


// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviwed succesfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// all products --- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
module.exports = router;
