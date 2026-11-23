import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { User } from '@/models/User';
import { checkAdmin } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const authRes = await checkAdmin();
    if (authRes.error) return authRes.error;
    
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'month';
    const customStart = searchParams.get('start');
    const customEnd = searchParams.get('end');
    
    const now = new Date();
    let startDate = new Date(0); // lifetime
    let endDate = new Date(); // now
    
    if (timeframe === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      // set endDate to end of day if it's the same day
      endDate.setHours(23, 59, 59, 999);
    } else if (timeframe === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeframe === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    }
    
    let dateFilter: any = timeframe === 'lifetime' ? {} : { createdAt: { $gte: startDate } };
    if (timeframe === 'custom' && customStart && customEnd) {
      dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    }
    
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.find({ totalQuantity: { $lt: 5 } });
    
    // Fetch all orders in timeframe
    const ordersInTimeframe = await Order.find(dateFilter);
    const totalOrders = ordersInTimeframe.length;
    
    // Revenue metrics calculation
    let totalSales = 0; let totalSalesCount = 0;
    let canceledSales = 0; let canceledSalesCount = 0;
    let returnedSales = 0; let returnedSalesCount = 0;
    
    const ordersByStatusMap: Record<string, number> = {};
    
    ordersInTimeframe.forEach(order => {
      ordersByStatusMap[order.orderStatus] = (ordersByStatusMap[order.orderStatus] || 0) + 1;
      
      if (order.orderStatus === 'delivered') {
        totalSales += order.totalAmount;
        totalSalesCount++;
      }
      else if (order.orderStatus === 'cancelled') {
        canceledSales += order.totalAmount;
        canceledSalesCount++;
      }
      else if (order.orderStatus === 'returned') {
        returnedSales += order.totalAmount;
        returnedSalesCount++;
      }
    });

    // Fetch LIVE pipeline metrics (ignoring dateFilter)
    const livePipelineOrders = await Order.find({
      orderStatus: { $in: ['pending', 'in_review', 'confirmed', 'processing', 'shipped', 'out_for_delivery'] }
    });

    let pendingSales = 0; let pendingSalesCount = 0;
    let confirmedSales = 0; let confirmedSalesCount = 0;
    let processingSales = 0; let processingSalesCount = 0;
    let shippedSales = 0; let shippedSalesCount = 0;
    let outForDeliverySales = 0; let outForDeliverySalesCount = 0;

    livePipelineOrders.forEach(order => {
      if (order.orderStatus === 'pending' || order.orderStatus === 'in_review') {
        pendingSales += order.totalAmount;
        pendingSalesCount++;
      }
      else if (order.orderStatus === 'confirmed') {
        confirmedSales += order.totalAmount;
        confirmedSalesCount++;
      }
      else if (order.orderStatus === 'processing') {
        processingSales += order.totalAmount;
        processingSalesCount++;
      }
      else if (order.orderStatus === 'shipped') {
        shippedSales += order.totalAmount;
        shippedSalesCount++;
      }
      else if (order.orderStatus === 'out_for_delivery') {
        outForDeliverySales += order.totalAmount;
        outForDeliverySalesCount++;
      }
    });
    
    const ordersByStatus = Object.keys(ordersByStatusMap).map(key => ({
      _id: key,
      count: ordersByStatusMap[key]
    }));
    
    // Product Analytics Aggregation
    const topProducts = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      { 
        $group: { 
          _id: { productId: '$items.product', name: '$items.productName', image: '$items.productImage' },
          deliveredCount: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, '$items.quantity', 0] } },
          canceledCount: { $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, '$items.quantity', 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, { $multiply: ['$items.price', '$items.quantity'] }, 0] } }
        } 
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $sort: { deliveredCount: -1 } },
      { $limit: 15 },
      { 
        $project: { 
          _id: 0, 
          id: '$_id.productId',
          name: '$_id.name', 
          image: '$_id.image',
          slug: { $arrayElemAt: ['$productDetails.slug', 0] },
          deliveredCount: 1,
          canceledCount: 1,
          totalRevenue: 1
        } 
      }
    ]);
    
    // Graph Data
    const graphData = [];
    if (timeframe === 'today') {
      const hourlyMap = new Array(24).fill(0);
      const hourlyOrders = new Array(24).fill(0);
      ordersInTimeframe.forEach(o => {
        if(o.orderStatus === 'delivered') {
          const hr = new Date(o.createdAt).getHours();
          hourlyMap[hr] += o.totalAmount;
          hourlyOrders[hr] += 1;
        }
      });
      hourlyMap.forEach((sales, i) => graphData.push({ name: `${i.toString().padStart(2, '0')}:00`, sales, orders: hourlyOrders[i] }));
    } else if (timeframe === 'week') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
        const dailyDelivered = ordersInTimeframe.filter(o => o.orderStatus === 'delivered' && new Date(o.createdAt) >= start && new Date(o.createdAt) < end);
        const sales = dailyDelivered.reduce((sum, o) => sum + o.totalAmount, 0);
        graphData.push({ name: dayNames[start.getDay()], sales, orders: dailyDelivered.length });
      }
    } else if (timeframe === 'month') {
      for (let i = 29; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
        const dailyDelivered = ordersInTimeframe.filter(o => o.orderStatus === 'delivered' && new Date(o.createdAt) >= start && new Date(o.createdAt) < end);
        const sales = dailyDelivered.reduce((sum, o) => sum + o.totalAmount, 0);
        graphData.push({ name: `${start.getDate()}/${start.getMonth()+1}`, sales, orders: dailyDelivered.length });
      }
    } else if (timeframe === 'lifetime' || timeframe === 'custom') {
      // Group by month for lifetime, or by day/month for custom depending on length. Let's just group by month for lifetime.
      // If custom, group by day.
      if (timeframe === 'custom') {
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 31) {
          for (let i = 0; i < diffDays; i++) {
            const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
            const end = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i + 1);
            const dailyDelivered = ordersInTimeframe.filter(o => o.orderStatus === 'delivered' && new Date(o.createdAt) >= start && new Date(o.createdAt) < end);
            const sales = dailyDelivered.reduce((sum, o) => sum + o.totalAmount, 0);
            graphData.push({ name: `${start.getDate()}/${start.getMonth()+1}`, sales, orders: dailyDelivered.length });
          }
        } else {
          // just group by month if it's very large
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthlyMap = new Array(12).fill(0);
          const monthlyOrders = new Array(12).fill(0);
          ordersInTimeframe.forEach(o => {
            if(o.orderStatus === 'delivered') {
              const m = new Date(o.createdAt).getMonth();
              monthlyMap[m] += o.totalAmount;
              monthlyOrders[m] += 1;
            }
          });
          monthlyMap.forEach((sales, i) => graphData.push({ name: monthNames[i], sales, orders: monthlyOrders[i] }));
        }
      } else {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyMap = new Array(12).fill(0);
        const monthlyOrders = new Array(12).fill(0);
        ordersInTimeframe.forEach(o => {
          if(o.orderStatus === 'delivered') {
            const m = new Date(o.createdAt).getMonth();
            monthlyMap[m] += o.totalAmount;
            monthlyOrders[m] += 1;
          }
        });
        monthlyMap.forEach((sales, i) => graphData.push({ name: monthNames[i], sales, orders: monthlyOrders[i] }));
      }
    }

    // Fetch Steadfast Courier Balance
    let steadfastBalance = { current_balance: 0, pending_balance: 0 };
    try {
      const { getSteadfastBalance } = await import('@/lib/steadfast');
      steadfastBalance = await getSteadfastBalance();
    } catch (e) {
      console.warn("Could not fetch Steadfast balance:", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers, 
        totalProducts, 
        totalOrders, 
        lowStockProducts,
        ordersByStatus,
        salesMetrics: {
          totalSales, totalSalesCount,
          canceledSales, canceledSalesCount,
          returnedSales, returnedSalesCount,
          pendingSales, pendingSalesCount,
          confirmedSales, confirmedSalesCount,
          processingSales, processingSalesCount,
          shippedSales, shippedSalesCount,
          outForDeliverySales, outForDeliverySalesCount
        },
        graphData, 
        topProducts, 
        steadfastBalance
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}