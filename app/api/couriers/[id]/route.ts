import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [rows] = await pool.query(
      `SELECT c.*, 
              s.full_name as sender_name
       FROM couriers c
       LEFT JOIN customers s ON c.sender_id = s.customer_id
       WHERE c.courier_id = ?`,
      [id]
    );
    
    const couriers = rows as any[];
    if (couriers.length === 0) {
      return NextResponse.json({ error: 'Courier not found' }, { status: 404 });
    }
    
    return NextResponse.json(couriers[0]);
  } catch (error) {
    console.error('Error fetching courier:', error);
    return NextResponse.json({ error: 'Failed to fetch courier' }, { status: 500 });
  }
}