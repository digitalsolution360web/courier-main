import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [courierRows]: any = await pool.query(
      `SELECT courier_id FROM couriers 
       WHERE tracking_number = ? 
       Limit 1`,
      [id]
    );
    
    const courier_id = courierRows[0]?.courier_id;

    const [rows]: any = await pool.query(
      `SELECT * FROM courier_status_history 
       WHERE courier_id = ? 
       ORDER BY updated_at DESC`,
      [courier_id]
    );
    
    return NextResponse.json(rows, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' }, 
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

