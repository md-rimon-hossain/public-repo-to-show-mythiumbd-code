import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Newsletter } from '@/models/Newsletter';
import { Product } from '@/models/Product';
import { checkAdmin } from '@/lib/auth-utils';
import { sendNewsletterSchema, formatZodErrors } from '@/lib/validations';
import { sendEmail, newsletterEmail, newProductEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const body = await req.json();
    const val = sendNewsletterSchema.safeParse(body);
    if (!val.success) return NextResponse.json({ success: false, errors: formatZodErrors(val.error) }, { status: 400 });
    
    const subscribers = await Newsletter.find({ isSubscribed: true });
    const emails = subscribers.map(s => s.email);
    
    if (val.data.type === 'product_launch' && val.data.productId) {
      const product = await Product.findById(val.data.productId);
      if (product) {
        const productLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${product.slug}`;
        const htmlContent = newProductEmail(product.title, product.images?.[0] || '', product.discountPrice || product.regularPrice, productLink);
        await sendEmail({ to: emails, subject: `New Launch: ${product.title}`, text: `Check out ${product.title}`, html: htmlContent });
      }
    } else {
      const htmlContent = newsletterEmail(val.data.subject, val.data.content);
      await sendEmail({ to: emails, subject: val.data.subject, text: val.data.content, html: htmlContent });
    }
    
    return NextResponse.json({ success: true, message: 'Newsletter sent' });
  } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 500 }); }
}