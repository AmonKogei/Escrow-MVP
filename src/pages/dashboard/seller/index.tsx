import { GetServerSideProps } from 'next';
import { requireSession } from '../../../../src/lib/ssr';
import DashboardLayout from '../../../components/DashboardLayout';

export default function SellerIndex() {
  const user = { email: 'seller@trade.co.ke', role: 'SELLER' };
  return (
    <DashboardLayout user={user} active="">
      <h2 className="text-xl font-semibold mb-4">Seller Home</h2>
      <div className="card bg-white p-4">Select a section from the sidebar.</div>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requireSession(ctx, 'SELLER');
};
