import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT c.*, 
             s.full_name as sender_name
      FROM couriers c
      LEFT JOIN customers s ON c.sender_id = s.customer_id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM couriers';
    const params: any[] = [];
    
    if (search) {
      query += ' WHERE c.tracking_number LIKE ? OR s.full_name LIKE ? OR r.full_name LIKE ?';
      countQuery += ' WHERE tracking_number LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY c.shipment_date DESC LIMIT ? OFFSET ?';
    
    const [rows] = await pool.query(query, [...params, limit, offset]);
    const [countResult] = await pool.query(countQuery, params.slice(0, 1));
    
    return NextResponse.json({
      data: rows,
      total: (countResult as any[])[0].total,
      page,
      limit
    });
  } catch (error: any) {
    console.error('API Error (Couriers):', error.message || error);
    return NextResponse.json({ error: 'Failed to fetch couriers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tracking_number, sender_id, receiver, origin, destination, package_weight, expected_delivery } = body;
    
    const [result] = await pool.query(
      `INSERT INTO couriers 
       (tracking_number, sender_id, receiver, origin, destination, package_weight, expected_delivery) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tracking_number, sender_id, receiver, origin, destination, package_weight, expected_delivery]
    );
    
    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create courier' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { courier_id, current_status, ...updates } = body;
    
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    
    values.push(courier_id);
    await pool.query(`UPDATE couriers SET ${fields.join(', ')} WHERE courier_id = ?`, values);
    
    // Add status history
    if (current_status) {
      await pool.query(
        'INSERT INTO courier_status_history (courier_id, status, updated_at) VALUES (?, ?, NOW())',
        [courier_id, current_status]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update courier' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    await pool.query('DELETE FROM courier_status_history WHERE courier_id = ?', [id]);
    await pool.query('DELETE FROM couriers WHERE courier_id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete courier' }, { status: 500 });
  }
}