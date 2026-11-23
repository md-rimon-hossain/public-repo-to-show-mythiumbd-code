import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { User } from '@/models/User';
import { ActivityLog } from '@/models/ActivityLog';
import { checkAuth, checkAdmin } from '@/lib/auth-utils';
import { updateOrderStatusSchema, formatZodErrors } from '@/lib/validations';
import { auth, clientPromise } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    // Ensure User model is registered before population to prevent Schema hasn't been registered error
    if (User) {
      console.log('User model loaded:', User.modelName);
    }
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    
    const client = await clientPromise;
    const db = client.db();
    const dbUser = await db.collection('users').findOne({ email: session.user.email });
    
    const order = await Order.findById(params.id).populate('user').populate('items.product');
    if (!order) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    
    if (order.user._id.toString() !== dbUser?._id.toString() && !['admin', 'superadmin'].includes(dbUser?.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const body = await req.json();
    const val = updateOrderStatusSchema.safeParse(body);
    if (!val.success) return NextResponse.json({ success: false, errors: formatZodErrors(val.error) }, { status: 400 });
    
    const order = await Order.findById(params.id);
    if (!order) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    
    let updateDetails = `Updated order ${order._id}`;
    if (val.data.orderStatus) {
      order.orderStatus = val.data.orderStatus;
      updateDetails += ` status to ${val.data.orderStatus}`;
    }
    if (val.data.paymentStatus) {
      order.paymentStatus = val.data.paymentStatus;
      updateDetails += ` payment status to ${val.data.paymentStatus}`;
    }

    await order.save();
    
    await ActivityLog.create({
      userId: authRes.dbUser!._id,
      entityType: 'order',
      entityId: order._id,
      action: 'update',
      details: updateDetails
    });
    
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}