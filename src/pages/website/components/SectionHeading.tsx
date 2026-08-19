import React from 'react';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  centered = true,
}) => (
  <div
    className={`section-heading ${centered ? 'section-heading--centered' : ''}`}
  >
    <span>{eyebrow}</span>
    <h2>{title}</h2>
    {description && <p>{description}</p>}
  </div>
);

export default SectionHeading;
