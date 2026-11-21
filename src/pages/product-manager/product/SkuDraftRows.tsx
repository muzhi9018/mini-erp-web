import { Checkbox } from 'antd';
import type { Key } from 'react';
import { useStyles } from '../index.style';
import { SkuFields, useProductText } from '../shared';
import SkuImagesField from './SkuImagesField';

export default function SkuDraftRows({
  rows,
  selected,
  units,
  selectable,
  disabled,
  onSelect,
  onUploadingChange,
}: {
  rows: { key: string; label: string }[];
  selected: Key[];
  units: Product.Unit[];
  selectable: boolean;
  disabled: boolean;
  onSelect: (selected: Key[]) => void;
  onUploadingChange: (key: string, uploading: boolean) => void;
}) {
  const t = useProductText();
  const { styles } = useStyles();
  const selectedKeys = new Set(selected);
  return rows.map((row, index) => {
    const checked = selectedKeys.has(row.key);
    const label = row.label || t('defaultSpec');
    return (
      <section
        key={row.key}
        className={`border-b py-3 last:border-b-0 ${styles.divider}`}
      >
        <h3 className="m-0 text-[15px] font-semibold">
          {selectable ? (
            <Checkbox
              checked={checked}
              disabled={disabled}
              onChange={(event) =>
                onSelect(
                  event.target.checked
                    ? [...selected, row.key]
                    : selected.filter((key) => key !== row.key),
                )
              }
            >
              {label}
            </Checkbox>
          ) : (
            label
          )}
        </h3>
        {checked && (
          <div className="mt-3">
            <SkuFields prefix={['skus', index]} units={units} />
            <SkuImagesField
              prefix={['skus', index]}
              onUploadingChange={(busy) => onUploadingChange(row.key, busy)}
            />
          </div>
        )}
      </section>
    );
  });
}
