declare module 'lucide-react-native/dist/cjs/icons/*' {
  import type { ComponentType } from 'react';

  type IconProps = {
    color?: string;
    size?: number;
    strokeWidth?: number;
  };

  const Icon: ComponentType<IconProps>;
  export default Icon;
}
