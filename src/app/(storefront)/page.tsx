import { CategorySection } from "@/components/storefront/category-section";
import { HeroSlider } from "@/components/storefront/hero-slider";
import { NewestSection } from "@/components/storefront/newest-section";
import { SignaturePicksSection } from "@/components/storefront/signature-picks-section";
import { CommunitySection } from "@/components/storefront/community-section";
import { TrendingSection } from "@/components/storefront/trending-section";
import dbConnect from "@/lib/db";
import HeroSlide from "@/models/HeroSlide";
import Category from "@/models/Category";
import Product from "@/models/Product";
import SignaturePick from "@/models/SignaturePick";

export const revalidate = 60;

async function getHomePageData() {
  try {
    await dbConnect();
    const [slides, categories, trending, newest, signaturePicks] = await Promise.all([
      HeroSlide.find({ isActive: true }).sort({ order: 1 }).lean(),
      Category.find({}).sort({ name: 1 }).lean(),
      Product.find({ isTrending: true, status: "active" }).limit(12).populate("category").lean(),
      Product.find({ status: "active" }).sort({ createdAt: -1 }).limit(12).populate("category").lean(),
      SignaturePick.find({ isActive: true }).sort({ order: 1 }).lean(),
    ]);

    return {
      slides: JSON.parse(JSON.stringify(slides)),
      categories: JSON.parse(JSON.stringify(categories)),
      trending: JSON.parse(JSON.stringify(trending)),
      newest: JSON.parse(JSON.stringify(newest)),
      signaturePicks: JSON.parse(JSON.stringify(signaturePicks)),
    };
  } catch (error) {
    console.error("Failed to load server data for homepage:", error);
    return {
      slides: [],
      categories: [],
      trending: [],
      newest: [],
      signaturePicks: [],
    };
  }
}

export default async function HomePage() {
  const { slides, categories, trending, newest, signaturePicks } = await getHomePageData();

  return (
    <div className="scroll-smooth">
      <section className="py-2">
        <HeroSlider initialSlides={slides} />
      </section>
      <section className="py-2">
        <CategorySection initialCategories={categories} />
      </section>
      <section className="py-2">
        <TrendingSection initialProducts={trending} />
      </section>
      <section className="py-2">
        <NewestSection initialProducts={newest} />
      </section>
      <section className="py-2">
        <SignaturePicksSection initialImages={signaturePicks} />
      </section>
      <section className="py-2">
        <CommunitySection />
      </section>
    </div>
  );
}
