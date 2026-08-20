import { Link } from '@umijs/max';
import React from 'react';

interface BrandMarkProps {
  compact?: boolean;
  imageSrc?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const BrandMark: React.FC<BrandMarkProps> = ({
  compact = false,
  imageSrc,
  onClick,
}) => (
  <Link
    aria-label="筑绿装饰新材首页"
    className="zhulv-brand"
    onClick={onClick}
    to="/"
  >
    {imageSrc ? (
      <img alt="" className="zhulv-brand__image" src={imageSrc} />
    ) : (
      <span className="zhulv-brand__emblem" aria-hidden="true">
        <span />
      </span>
    )}
    {!compact && (
      <span className="zhulv-brand__words">
        <strong>筑绿装饰新材</strong>
        <small>ZhuLv Decoration Materials</small>
      </span>
    )}
  </Link>
);

export default BrandMark;
