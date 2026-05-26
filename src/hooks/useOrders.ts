import { useFirebaseSync } from './useFirebaseSync';
import { Order, OrderStatus } from '../types';

export function useOrders() {
  const [orders, setOrders] = useFirebaseSync<Order>('orders');

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const updateOrderField = <K extends keyof Order>(orderId: string, field: K, value: Order[K]) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, [field]: value } : o));
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // Provide raw setter for slow migration
  return {
    orders,
    setOrders,
    addOrder,
    updateOrder,
    updateOrderField,
    deleteOrder,
    updateOrderStatus
  };
}
