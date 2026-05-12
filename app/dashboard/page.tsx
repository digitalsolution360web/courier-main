import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboardClient';

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const token = cookieStore.get("token");

  if (!token) {
    redirect("/");
  }

  return <DashboardClient />;
}