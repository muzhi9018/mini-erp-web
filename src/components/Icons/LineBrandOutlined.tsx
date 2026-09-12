import Icon from '@ant-design/icons';
import { type ComponentProps, forwardRef } from 'react';
import { ReactComponent as LineSvg } from './svgs/line.svg';

export type LineBrandOutlinedProps = Omit<
  ComponentProps<typeof Icon>,
  'component' | 'children' | 'viewBox'
>;

/** LINE 单色图标，与 antd 图标一样继承 color 和 fontSize。 */
const LineBrandOutlined = forwardRef<HTMLSpanElement, LineBrandOutlinedProps>(
  (props, ref) => (
    <Icon aria-label="LINE" {...props} ref={ref} component={LineSvg} />
  ),
);

LineBrandOutlined.displayName = 'LineBrandOutlined';

export default LineBrandOutlined;
