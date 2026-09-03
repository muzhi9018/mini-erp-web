import { Link, useIntl } from '@umijs/max';
import React from 'react';
import type { Product } from '../data';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const intl = useIntl();

  return (
    <Link className="product-card" to={`/products/${product.slug}`}>
      <div className="product-card__image-wrap">
        <img alt={product.name} loading="lazy" src={product.image} />
      </div>
      <div className="product-card__content">
        <span>{product.englishName}</span>
        <h3>{product.name}</h3>
        <p>{product.summary}</p>
        <b>
          {intl.formatMessage({ id: 'website.productCard.viewDetails' })}{' '}
          <i aria-hidden="true">→</i>
        </b>
      </div>
    </Link>
  );
};

export default ProductCard;
