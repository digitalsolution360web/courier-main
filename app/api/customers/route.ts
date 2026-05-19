import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM customers';
    let countQuery = 'SELECT COUNT(*) as total FROM customers';
    const params: any[] = [];
    
    if (search) {
      query += ' WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ?';
      countQuery += ' WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    
    const [rows] = await pool.query(query, [...params, limit, offset]);
    const [countResult] = await pool.query(countQuery, params);
    
    return NextResponse.json({
      data: rows,
      total: (countResult as any[])[0].total,
      page,
      limit
    });
  } catch (error: any) {
    console.error('API Error:', error.message || error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, phone, email, address } = body;
    
    const [result] = await pool.query(
      'INSERT INTO customers (full_name, phone, email, address) VALUES (?, ?, ?, ?)',
      [full_name, phone, email, address]
    );
    
    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_id, full_name, phone, email, address } = body;
    
    await pool.query(
      'UPDATE customers SET full_name = ?, phone = ?, email = ?, address = ? WHERE customer_id = ?',
      [full_name, phone, email, address, customer_id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Get all courier IDs
    const [rows]: any = await pool.query(
      'SELECT courier_id FROM couriers WHERE sender_id = ?',
      [id]
    );

    // Delete all history first
    for (const courier of rows) {
      await pool.query(
        'DELETE FROM courier_status_history WHERE courier_id = ?',
        [courier.courier_id]
      );
    }

    // Then delete couriers
    await pool.query(
      'DELETE FROM couriers WHERE sender_id = ?',
      [id]
    );

    // Then delete customer
    await pool.query(
      'DELETE FROM customers WHERE customer_id = ?',
      [id]
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}