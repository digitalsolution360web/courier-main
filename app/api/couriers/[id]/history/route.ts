import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [rows] = await pool.query(
      `SELECT * FROM courier_status_history 
       WHERE courier_id = ? 
       ORDER BY updated_at DESC`,
      [id]
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' }, 
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, location, remarks } = body;
    let updated_at = body.updated_at;

    // Current time
    const now = new Date();

    // Extract current HH:mm:ss
    const timePart = now.toTimeString().split(' ')[0];

    // Combine form date + current time
    updated_at = `${updated_at} ${timePart}`;
    
    console.log('Adding status for courier ID:', id);
    console.log('Status data:', { status, location, updated_at, remarks });
    
    // Validate courier_id
    if (!id) {
      return NextResponse.json({ error: 'Courier ID is required' }, { status: 400 });
    }
    
    // First, verify that the courier exists
    const [courierCheck] = await pool.query(
      'SELECT courier_id FROM couriers WHERE courier_id = ?',
      [id]
    );
    
    const couriers = courierCheck as any[];
    if (couriers.length === 0) {
      return NextResponse.json({ error: 'Courier not found' }, { status: 404 });
    }
    
    // Insert status history
    const [result] = await pool.query(
      `INSERT INTO courier_status_history (courier_id, status, location, remarks, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, status, location || null, remarks || null, updated_at]
    );
    
    // Update courier's current status
    await pool.query(
      `UPDATE couriers SET current_status = ? WHERE courier_id = ?`,
      [status, id]
    );
    
    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Failed to add status:', error);
    return NextResponse.json(
      { error: 'Failed to add status update: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
