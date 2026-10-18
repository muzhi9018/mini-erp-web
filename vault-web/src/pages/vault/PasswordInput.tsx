import { Input } from 'antd';
import { type ComponentProps, useEffect, useState } from 'react';

export default function PasswordInput(
  props: ComponentProps<typeof Input.Password>,
) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) setVisible(false);
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  return (
    <Input.Password
      {...props}
      visibilityToggle={{ visible, onVisibleChange: setVisible }}
    />
  );
}
