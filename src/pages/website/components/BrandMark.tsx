import { Link } from '@umijs/max';
import React from 'react';

interface BrandMarkProps {
  compact?: boolean;
}

const BrandMark: React.FC<BrandMarkProps> = ({ compact = false }) => (
  <Link className="zhulv-brand" to="/" aria-label="筑绿装饰新材首页">
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
