import { Link } from '@umijs/max';
import React from 'react';

interface BrandMarkProps {
  compact?: boolean;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const BrandMark: React.FC<BrandMarkProps> = ({ compact = false, onClick }) => (
  <Link
    aria-label="筑绿装饰新材首页"
    className="zhulv-brand"
    onClick={onClick}
    to="/"
  >
    <span className="zhulv-brand__emblem" aria-hidden="true">
      <span />
    </span>
    {!compact && (
      <span className="zhulv-brand__words">
        <strong>筑绿装饰</strong>
        <small>ZHU LV DECOR</small>
      </span>
    )}
  </Link>
);

export default BrandMark;
