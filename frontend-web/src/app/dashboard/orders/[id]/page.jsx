import { OrderDetailView } from 'src/sections/orders/view';

// ----------------------------------------------------------------------

export default function OrderDetailPage({ params }) {
  const { id } = params;

  return <OrderDetailView orderId={id} />;
}