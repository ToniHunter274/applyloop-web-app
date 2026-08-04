// Next.js API route for customers 
// GET: Returns all customers or filtered based on query parameters
// POST: Creates a new customer

import { MOCK_CUSTOMERS, CUSTOMER_STATUSES, CUSTOMER_TAGS } from '../../../data/customers';

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
        return getCustomers(req, res);
      case 'POST':
        return createCustomer(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

function getCustomers(req, res) {
  const { 
    query, 
    status,
    tags,
    minOrderCount,
    minSpent,
    location,
    sortBy,
    sortOrder,
    limit,
    page
  } = req.query;

  // Start with all customers 
  let filteredCustomers = [...MOCK_CUSTOMERS];

  // Apply filters
  if (status) {
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.status.toLowerCase() === status.toLowerCase()
    );
  }

  if (tags) {
    const tagList = tags.split(',');
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.tags.some(tag => tagList.includes(tag))
    );
  }

  if (minOrderCount) {
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.orderCount >= parseInt(minOrderCount)
    );
  }

  if (minSpent) {
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.totalSpentValue >= parseFloat(minSpent) * 100
    );
  }

  if (location) {
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.city.toLowerCase().includes(location.toLowerCase()) ||
      customer.state.toLowerCase().includes(location.toLowerCase()) ||
      customer.country.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (query) {
    const searchRegex = new RegExp(query, 'i');
    filteredCustomers = filteredCustomers.filter(customer => 
      searchRegex.test(customer.name) || 
      searchRegex.test(customer.email) || 
      searchRegex.test(customer.phone) ||
      searchRegex.test(customer.customerNumber)
    );
  }

  // Apply sorting
  if (sortBy) {
    const order = sortOrder === 'desc' ? -1 : 1;
    
    filteredCustomers.sort((a, b) => {
      // Special handling for some fields
      if (sortBy === 'totalSpent') {
        return order * (a.totalSpentValue - b.totalSpentValue);
      }
      
      if (sortBy === 'lastOrderDate') {
        return order * (new Date(a.lastOrderDate) - new Date(b.lastOrderDate));
      }
      
      if (sortBy === 'registrationDate') {
        return order * (new Date(a.registrationDate) - new Date(b.registrationDate));
      }
      
      // Default sorting for other fields
      if (a[sortBy] < b[sortBy]) return -1 * order;
      if (a[sortBy] > b[sortBy]) return 1 * order;
      return 0;
    });
  } else {
    // Default sorting by most recent registration
    filteredCustomers.sort((a, b) => 
      new Date(b.registrationDate) - new Date(a.registrationDate)
    );
  }

  // Apply pagination
  const pageNum = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || filteredCustomers.length;
  const startIndex = (pageNum - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
  
  // Calculate statistics for response
  const stats = {
    total: filteredCustomers.length,
    active: filteredCustomers.filter(c => c.status.toLowerCase() === 'active').length,
    inactive: filteredCustomers.filter(c => c.status.toLowerCase() === 'inactive').length,
    new: filteredCustomers.filter(c => c.status.toLowerCase() === 'new').length,
    totalSpent: filteredCustomers.reduce((sum, c) => sum + c.totalSpentValue, 0) / 100,
    averageOrderValue: filteredCustomers.reduce((sum, c) => sum + c.averageOrderValue, 0) / filteredCustomers.length
  };

  // Return response with pagination metadata
  res.status(200).json({
    status: 'success',
    stats,
    total: filteredCustomers.length,
    page: pageNum,
    limit: itemsPerPage,
    totalPages: Math.ceil(filteredCustomers.length / itemsPerPage),
    data: paginatedCustomers,
    statuses: CUSTOMER_STATUSES,
    tags: CUSTOMER_TAGS
  });
}

function createCustomer(req, res) {
  try {
    const customer = req.body;
    
    // Validate required fields
    if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Required fields missing. First name, last name, email and phone are required.' 
      });
    }

    // Check for duplicate email
    const existingCustomer = MOCK_CUSTOMERS.find(c => c.email === customer.email);
    if (existingCustomer) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'A customer with this email already exists.' 
      });
    }

    // Generate a new ID
    const lastId = MOCK_CUSTOMERS.length > 0 
      ? parseInt(MOCK_CUSTOMERS[MOCK_CUSTOMERS.length - 1].id.split('-')[1]) 
      : 0;
    const newId = `cust-${String(lastId + 1).padStart(3, '0')}`;
    
    // Generate customer number
    const customerNumber = `#${Math.floor(555000 + Math.random() * 1000)}`;
    
    // Create new customer with default values for optional fields
    const newCustomer = {
      id: newId,
      customerNumber,
      registrationDate: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      name: `${customer.firstName} ${customer.lastName}`,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || '',
      location: customer.address || '',
      city: customer.city || 'Lagos',
      state: customer.state || 'Lagos State',
      country: customer.country || 'Nigeria',
      totalSpent: '₦0.00',
      totalSpentValue: 0,
      lastOrder: '₦0.00',
      lastOrderId: null,
      lastOrderDate: null,
      status: 'New',
      orderCount: 0,
      averageOrderValue: 0,
      loyaltyPoints: 0,
      preferredPaymentMethod: customer.preferredPaymentMethod || null,
      preferredDeliveryTime: customer.preferredDeliveryTime || null,
      tags: customer.tags || ['new-user'],
      notes: customer.notes || '',
      favoriteItems: [],
      deviceType: customer.deviceType || null,
      appVersion: customer.appVersion || null,
      birthDate: customer.birthDate || null,
      profileImage: customer.profileImage || '/images/customer-placeholder.jpg'
    };

    // In a real app, you would add to database
    // For mock, just return success with the new customer
    res.status(201).json({
      status: 'success',
      data: newCustomer
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
} 