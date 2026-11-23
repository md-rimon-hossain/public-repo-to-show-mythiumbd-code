/**
 * Seed script for initial super admin setup
 * Run: npm run seed
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mythium";
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

async function seed() {
  if (!SUPER_ADMIN_EMAIL) {
    console.error("❌ SUPER_ADMIN_EMAIL is not set in .env.local");
    console.error("   Please set SUPER_ADMIN_EMAIL=your-google-email@gmail.com");
    process.exit(1);
  }

  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db!;

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: SUPER_ADMIN_EMAIL });

    if (existingUser) {
      // Update to superadmin
      await db.collection("users").updateOne(
        { email: SUPER_ADMIN_EMAIL },
        { $set: { role: "superadmin", isBlocked: false } }
      );
      console.log(`✅ User ${SUPER_ADMIN_EMAIL} promoted to superadmin`);
    } else {
      console.log(`⚠️  User ${SUPER_ADMIN_EMAIL} not found in database.`);
      console.log("   Please sign in with Google first, then run this script again.");
      console.log("   Or the user will be auto-promoted on first Google sign-in.");
    }

    // Create default header links
    const headerLinksCount = await db.collection("headerlinks").countDocuments();
    if (headerLinksCount === 0) {
      await db.collection("headerlinks").insertMany([
        { title: "Home", href: "/", order: 0, isActive: true, isExternal: false, createdAt: new Date(), updatedAt: new Date() },
        { title: "Products", href: "/products", order: 1, isActive: true, isExternal: false, createdAt: new Date(), updatedAt: new Date() },
        { title: "Trending", href: "/products?trending=true", order: 2, isActive: true, isExternal: false, createdAt: new Date(), updatedAt: new Date() },
        { title: "New Arrivals", href: "/products?sort=newest", order: 3, isActive: true, isExternal: false, createdAt: new Date(), updatedAt: new Date() },
        { title: "Support", href: "/support", order: 4, isActive: true, isExternal: false, createdAt: new Date(), updatedAt: new Date() },
      ]);
      console.log("✅ Default header links created");
    }

    // Create default categories
    const categoriesCount = await db.collection("categories").countDocuments();
    if (categoriesCount === 0) {
      await db.collection("categories").insertMany([
        {
          name: "Shirt",
          slug: "shirt",
          image: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/shirt",
          categoryType: "shirt",
          sizes: ["S", "M", "L", "XL", "XXL", "XXXL"],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "T-Shirt",
          slug: "t-shirt",
          image: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/tshirt",
          categoryType: "tshirt",
          sizes: ["S", "M", "L", "XL", "XXL", "XXXL"],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Half Shirt",
          slug: "half-shirt",
          image: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/half-shirt",
          categoryType: "half_shirt",
          sizes: ["S", "M", "L", "XL", "XXL", "XXXL"],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Pant",
          slug: "pant",
          image: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/pant",
          categoryType: "pant",
          sizes: ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Shorts",
          slug: "shorts",
          image: "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/shorts",
          categoryType: "shorts",
          sizes: ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      console.log("✅ Default categories created");
    }

    console.log("\n🎉 Seed completed successfully!");
    console.log("   Next steps:");
    console.log("   1. Run: npm run dev");
    console.log("   2. Sign in with your Google account");
    console.log("   3. Go to /admin to access the admin panel");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();
