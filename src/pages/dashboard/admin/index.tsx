import { GetServerSideProps } from 'next';
import { requireSession } from '../../../../src/lib/ssr';
import DashboardLayout from '../../../components/DashboardLayout';

export default function AdminIndex() {
  const user = { email: 'admin@escrow.co.ke', role: 'ADMIN' };
    return (
      <DashboardLayout user={user} active="admin">
      <h2 className="text-xl font-semibold mb-4">Admin Home</h2>
      <div className="card bg-white p-4">Select a section from the sidebar.</div>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requireSession(ctx, 'ADMIN');
};
