import { Link, useIntl } from '@umijs/max';
import React from 'react';

interface ProductCardProps {
  product: Website.PublicProduct;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const intl = useIntl();

  return (
    <Link className="product-card" to={`/products/${product.slug}`}>
      <div className="product-card__image-wrap">
        {product.coverImageUrl && (
          <img alt={product.name} loading="lazy" src={product.coverImageUrl} />
        )}
      </div>
      <div className="product-card__content">
        {product.subtitle && <span>{product.subtitle}</span>}
        <h3>{product.name}</h3>
        {product.summary && <p>{product.summary}</p>}
        <b>
          {intl.formatMessage({ id: 'website.productCard.viewDetails' })}{' '}
          <i aria-hidden="true">→</i>
        </b>
      </div>
    </Link>
  );
};

export default ProductCard;
