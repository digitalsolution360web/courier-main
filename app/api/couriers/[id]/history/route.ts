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
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get status record details first
    const [statusRows] = await pool.query(
      `SELECT courier_id 
       FROM courier_status_history 
       WHERE status_id = ?`,
      [id]
    );

    const statuses = statusRows as any[];

    if (statuses.length === 0) {
      return NextResponse.json(
        { error: 'Status record not found' },
        { status: 404 }
      );
    }

    const courierId = statuses[0].courier_id;

    // Delete the status
    await pool.query(
      `DELETE FROM courier_status_history
       WHERE status_id = ?`,
      [id]
    );

    // Get latest remaining status
    const [latestRows] = await pool.query(
      `SELECT status
       FROM courier_status_history
       WHERE courier_id = ?
       ORDER BY updated_at DESC, status_id DESC
       LIMIT 1`,
      [courierId]
    );

    const latestStatus = (latestRows as any[])[0];

    // Update courier current status
    if (latestStatus) {
      await pool.query(
        `UPDATE couriers
         SET current_status = ?
         WHERE courier_id = ?`,
        [latestStatus.status, courierId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Status deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete shipment status:', error);

    return NextResponse.json(
      {
        error:
          'Failed to delete shipment status: ' +
          (error as Error).message,
      },
      { status: 500 }
    );
  }
}
