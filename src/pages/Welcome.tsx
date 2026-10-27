import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Card } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import Hyperspeed, {
  type HyperspeedProps,
} from '@/components/ReactBits/Hyperspeed';
import layoutStyles from './Welcome.module.css';

const hyperspeedOptions = {
  tailColors: [
    '#ff2d95',
    '#ff5c35',
    '#ffb800',
    '#ff4de3',
    '#a855f7',
    '#7c3aed',
  ],
  headColors: [
    '#00e5ff',
    '#00b7ff',
    '#2979ff',
    '#00f5d4',
    '#2dff8a',
    '#a3ff12',
  ],
  poleColors: ['#00e5ff', '#ff2d95', '#a855f7', '#2dff8a'],
  glow: 1.8,
  lightSize: 1.35,
  density: 60,
} satisfies Partial<HyperspeedProps>;

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    border-color: ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG * 2}px;
    background: ${token.colorBgContainer};
    box-shadow: ${token.boxShadowTertiary};
  `,
}));

const Welcome: React.FC = () => {
  const { styles } = useStyles();
  const { initialState } = useModel('@@initialState');
  const theme =
    initialState?.settings?.navTheme === 'realDark' ? 'dark' : 'light';

  return (
    <PageContainer
      pageHeaderRender={false}
      className={`${layoutStyles.background} flex-1 overflow-hidden`}
      childrenContentStyle={{ padding: 0 }}
    >
      <div className="absolute inset-0 p-3 md:p-5">
        <Card
          className={`${styles.card} h-full w-full overflow-hidden`}
          classNames={{ body: 'relative h-full' }}
          styles={{ body: { padding: 0 } }}
        >
          <Hyperspeed {...hyperspeedOptions} theme={theme} roadOpacity={0} />
        </Card>
      </div>
    </PageContainer>
  );
};

export default Welcome;
