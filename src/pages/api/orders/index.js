// Next.js API route for orders 
// GET: Returns all orders or filtered based on query parameters
// POST: Creates a new order

import { MOCK_ORDERS, ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS, RIDERS } from '../../../data/orders';

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        return getOrders(req, res);
      case 'POST':
        return createOrder(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

function getOrders(req, res) {
  const { 
    query, 
    status,
    paymentStatus,
    customerId,
    restaurantId,
    riderId,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    tags,
    sortBy,
    sortOrder,
    limit,
    page
  } = req.query;

  // Start with all orders 
  let filteredOrders = [...MOCK_ORDERS];

  // Apply filters
  if (status) {
    filteredOrders = filteredOrders.filter(order => 
      order.status.toLowerCase() === status.toLowerCase()
    );
  }

  if (paymentStatus) {
    filteredOrders = filteredOrders.filter(order => 
      order.paymentStatus.toLowerCase() === paymentStatus.toLowerCase()
    );
  }

  if (customerId) {
    filteredOrders = filteredOrders.filter(order => order.customerId === customerId);
  }

  if (restaurantId) {
    filteredOrders = filteredOrders.filter(order => order.restaurantId === restaurantId);
  }

  if (riderId) {
    filteredOrders = filteredOrders.filter(order => order.riderId === riderId);
  }

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    filteredOrders = filteredOrders.filter(order => 
      new Date(order.createdAt) >= fromDate
    );
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999); // End of the day
    filteredOrders = filteredOrders.filter(order => 
      new Date(order.createdAt) <= toDate
    );
  }

  if (minAmount) {
    filteredOrders = filteredOrders.filter(order => 
      order.totalAmount >= parseFloat(minAmount)
    );
  }

  if (maxAmount) {
    filteredOrders = filteredOrders.filter(order => 
      order.totalAmount <= parseFloat(maxAmount)
    );
  }

  if (tags) {
    const tagList = tags.split(',');
    filteredOrders = filteredOrders.filter(order => 
      order.tags.some(tag => tagList.includes(tag))
    );
  }

  if (query) {
    const searchRegex = new RegExp(query, 'i');
    filteredOrders = filteredOrders.filter(order => 
      searchRegex.test(order.orderNumber) || 
      searchRegex.test(order.customerName) || 
      searchRegex.test(order.title) ||
      searchRegex.test(order.location)
    );
  }

  // Apply sorting
  if (sortBy) {
    const order = sortOrder === 'desc' ? -1 : 1;
    
    filteredOrders.sort((a, b) => {
      // Special handling for dates
      if (sortBy === 'date' || sortBy === 'createdAt' || sortBy === 'deliveredAt') {
        return order * (new Date(a[sortBy] || 0) - new Date(b[sortBy] || 0));
      }
      
      // Numeric fields
      if (sortBy === 'totalAmount' || sortBy === 'subtotal') {
        return order * (a[sortBy] - b[sortBy]);
      }
      
      // Default sorting for other fields
      if (a[sortBy] < b[sortBy]) return -1 * order;
      if (a[sortBy] > b[sortBy]) return 1 * order;
      return 0;
    });
  } else {
    // Default sorting by most recent date
    filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Apply pagination
  const pageNum = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || filteredOrders.length;
  const startIndex = (pageNum - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
  
  // Calculate statistics for response
  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status.toLowerCase() === 'pending').length,
    delivered: filteredOrders.filter(o => o.status.toLowerCase() === 'delivered').length,
    canceled: filteredOrders.filter(o => o.status.toLowerCase() === 'canceled').length,
    processing: filteredOrders.filter(o => o.status.toLowerCase() === 'processing').length,
    totalAmount: filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    avgOrderValue: filteredOrders.length > 0 ? 
      filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0) / filteredOrders.length : 0
  };

  // Return response with pagination metadata
  res.status(200).json({
    status: 'success',
    stats,
    total: filteredOrders.length,
    page: pageNum,
    limit: itemsPerPage,
    totalPages: Math.ceil(filteredOrders.length / itemsPerPage),
    data: paginatedOrders,
    orderStatuses: ORDER_STATUSES,
    paymentStatuses: PAYMENT_STATUSES,
    paymentMethods: PAYMENT_METHODS,
    riders: RIDERS
  });
}

function createOrder(req, res) {
  try {
    const order = req.body;
    
    // Validate required fields
    if (!order.items || !order.items.length || !order.customerId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Required fields missing. Order items and customer ID are required.' 
      });
    }

    // Calculate subtotal
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Generate a new ID
    const lastId = MOCK_ORDERS.length > 0 
      ? parseInt(MOCK_ORDERS[MOCK_ORDERS.length - 1].id.split('-')[1]) 
      : 0;
    const newId = `ord-${String(lastId + 1).padStart(3, '0')}`;
    
    // Generate order number
    const now = new Date();
    const orderNumber = `ORD-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    
    // Set default values for optional fields
    const deliveryFee = order.deliveryFee || 500;
    const serviceCharge = order.serviceCharge || Math.round(subtotal * 0.05); // 5% default
    const discount = order.discount || 0;
    const totalAmount = subtotal + deliveryFee + serviceCharge - discount;
    
    // Default estimated delivery time (30 minutes from now)
    const estimatedDeliveryTime = new Date(now.getTime() + 30 * 60000).toISOString();
    
    // Create new order
    const newOrder = {
      id: newId,
      orderNumber,
      items: order.items.map((item, index) => ({
        id: `item-${String(index + 1).padStart(3, '0')}`,
        foodId: item.foodId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes || '',
        modifiers: item.modifiers || [],
        subtotal: item.price * item.quantity
      })),
      image: order.items[0].imageUrl || '/images/food-placeholder.jpg',
      title: order.items[0].name,
      price: order.items[0].price,
      quantity: order.items[0].quantity,
      status: 'Pending',
      paymentStatus: order.paymentStatus || 'Pending',
      paymentMethod: order.paymentMethod || 'Card',
      customerId: order.customerId,
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      customerEmail: order.customerEmail || '',
      restaurantId: order.restaurantId || '',
      restaurantName: order.restaurantName || '',
      deliveryAddressId: order.deliveryAddressId || '',
      location: order.location || '',
      fullAddress: order.fullAddress || '',
      date: now.toISOString(),
      createdAt: now.toISOString(),
      estimatedDeliveryTime,
      deliveredAt: null,
      riderId: order.riderId || null,
      riderName: order.riderName || null,
      subtotal,
      deliveryFee,
      serviceCharge,
      discount,
      totalAmount,
      rating: null,
      feedback: null,
      tags: order.tags || []
    };

    // In a real app, you would add to database
    // For mock, just return success with the new order
    res.status(201).json({
      status: 'success',
      data: newOrder
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
} 