import { NextResponse } from "next/server";
import { sendEmail, supportAutoReplyEmail } from "@/lib/mailer";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { SupportMessage } from "@/models/SupportMessage";
const supportSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const validatedData = supportSchema.parse(body);

    const { name, email, message } = validatedData;

    await dbConnect();

    // Save to database
    await SupportMessage.create({
      name,
      email,
      message,
      status: "unread",
    });

    // Send auto-reply to customer
    await sendEmail({
      to: email,
      subject: "We've received your message - Mythium Support",
      html: supportAutoReplyEmail(name, message),
    });

    return NextResponse.json({ 
      success: true, 
      message: "Message sent successfully! We've sent you a confirmation email." 
    });
  } catch (error: any) {
    console.error("Support API Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
