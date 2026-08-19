import { Link } from '@umijs/max';
import React from 'react';
import type { Product } from '../data';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => (
  <Link className="product-card" to={`/products/${product.slug}`}>
    <div className="product-card__image-wrap">
      <img alt={product.name} loading="lazy" src={product.image} />
    </div>
    <div className="product-card__content">
      <span>{product.englishName}</span>
      <h3>{product.name}</h3>
      <p>{product.summary}</p>
      <b>
        查看详情 <i aria-hidden="true">→</i>
      </b>
    </div>
  </Link>
);

export default ProductCard;
