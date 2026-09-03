import { Link, useIntl } from '@umijs/max';
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
}) => {
  const intl = useIntl();

  return (
    <Link
      aria-label={intl.formatMessage({ id: 'website.brand.homeAriaLabel' })}
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
          <strong>{intl.formatMessage({ id: 'website.brand.name' })}</strong>
          <small>ZhuLv Decoration Materials</small>
        </span>
      )}
    </Link>
  );
};

export default BrandMark;
