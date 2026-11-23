import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { SupportMessage } from "@/models/SupportMessage";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || ((session.user as any).role !== "admin" && (session.user as any).role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { replyMessage } = await req.json();
    if (!replyMessage) {
      return NextResponse.json({ error: "Reply message is required" }, { status: 400 });
    }

    await dbConnect();
    
    const supportReq = await SupportMessage.findById(params.id);
    if (!supportReq) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Add reply to DB
    supportReq.replies.push({ message: replyMessage });
    supportReq.status = "replied";
    await supportReq.save();

    // Send email to customer
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="background: #000; padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 4px; text-transform: uppercase;">MYTHIUM</h1>
        </div>
        <div style="background: white; padding: 40px; border: 1px solid #000; border-top: none;">
          <h2 style="color: #000; margin: 0 0 16px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">Support Reply</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello ${supportReq.name},</p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">Our support team has replied to your message:</p>
          <div style="background: #fafafa; border-left: 4px solid #000; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #111; font-size: 15px;">${replyMessage}</p>
          </div>
          <p style="color: #000; font-size: 14px; font-weight: bold; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">- The Mythium Team</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: supportReq.email,
      subject: "Re: Your Support Request - Mythium",
      html: emailHtml,
    });

    return NextResponse.json({ success: true, data: supportReq });
  } catch (error) {
    console.error("Support reply error:", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
