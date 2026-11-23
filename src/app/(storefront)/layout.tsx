import { Footer } from "@/components/storefront/footer";
import { Header } from "@/components/storefront/header";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { FloatingCart } from "@/components/shared/floating-cart";
import { CartSidebar } from "@/components/storefront/cart-sidebar";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingCart />
      <ScrollToTop />
      <CartSidebar />
    </div>
  );
}
