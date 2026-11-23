import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/products/${params.slug}`, { next: { revalidate: 60 } });
    const data = await res.json();
    
    if (data.success && data.data) {
      const product = data.data;
      return {
        title: `${product.title || product.name} | Mythium`,
        description: product.description?.replace(new RegExp('<[^>]*>?', 'gm'), '').substring(0, 160) || `Buy ${product.name} at Mythium`,
        keywords: product.keywords?.join(', '),
        openGraph: {
          title: `${product.title || product.name} | Mythium`,
          description: product.description?.replace(new RegExp('<[^>]*>?', 'gm'), '').substring(0, 160) || `Buy ${product.name} at Mythium`,
          images: product.images?.[0] ? [{ url: product.images[0] }] : [],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `${product.title || product.name} | Mythium`,
          description: product.description?.replace(new RegExp('<[^>]*>?', 'gm'), '').substring(0, 160),
          images: product.images?.[0] ? [product.images[0]] : [],
        }
      };
    }
  } catch (e) {
    console.error("Failed to generate metadata for product slug:", params.slug, e);
  }
  
  return {
    title: 'Product Details | Mythium',
    description: 'Shop the latest products at Mythium.',
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
