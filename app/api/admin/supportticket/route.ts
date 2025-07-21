// File: app/api/admin/supportticket/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/lib/mongodb';
import SupportTicket from '@/database/models/SupportTicket';

// Add this for debugging
console.log('API Route loaded successfully');

export async function GET(request: NextRequest) {
  console.log('GET request received at /api/admin/supportticket');
  
  try {
    console.log('Attempting to connect to database...');
    // Connect to database
    await connectToDatabase();
    console.log('Database connected successfully');

    // Get query parameters for pagination (optional)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Fetch all support tickets with pagination
    console.log('Fetching support tickets...');
    const tickets = await SupportTicket.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    console.log(`Found ${tickets.length} tickets`);

    // Get total count for pagination
    const total = await SupportTicket.countDocuments({});

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: page,
          totalPages,
          totalTickets: total,
          hasNextPage,
          hasPrevPage,
          limit
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch support tickets',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optional: Add POST method for creating new tickets if needed
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const newTicket = new SupportTicket(body);
    const savedTicket = await newTicket.save();

    return NextResponse.json({
      success: true,
      data: savedTicket
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create support ticket',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}