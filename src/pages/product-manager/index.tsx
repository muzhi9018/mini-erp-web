import { Navigate, useAccess } from '@umijs/max';

export default function ProductManager() {
  const { hasPermission } = useAccess();
  if (hasPermission('product-manager:product:query')) {
    return <Navigate replace to="/product-manager/product" />;
  }
  if (hasPermission('product-manager:product-category:query')) {
    return <Navigate replace to="/product-manager/product-category" />;
  }
  if (hasPermission('product-manager:product-unit:query')) {
    return <Navigate replace to="/product-manager/product-unit" />;
  }
  return null;
}
