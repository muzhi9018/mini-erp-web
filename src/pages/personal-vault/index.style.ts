import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token }) => ({
  page: css`
    max-width: 1180px;
    padding: 12px 0 24px;
  `,
  panel: css`
    overflow: hidden;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 20px;
    background: ${token.colorBgContainer};
    box-shadow: 0 8px 40px ${token.colorFillQuaternary};
  `,
  hero: css`
    min-height: 430px;
    padding: 48px 56px;
    @media (max-width: 1023px) {
      padding: 36px;
    }
    @media (max-width: 575px) {
      gap: 0;
      padding: 30px 24px 12px;
    }
  `,
  copy: css`
    position: relative;
    z-index: 1;
  `,
  eyebrow: css`
    margin-bottom: 24px;
    color: color-mix(in srgb, ${token.colorPrimaryText} 70%, ${token.colorTextHeading});
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.1em;
  `,
  heading: css`
    margin: 0 0 22px;
    color: ${token.colorTextHeading};
    font-size: clamp(30px, 3.1vw, 44px);
    font-weight: 650;
    letter-spacing: -0.04em;
    line-height: 1.4;
    span {
      display: block;
      color: color-mix(in srgb, ${token.colorPrimaryText} 70%, ${token.colorTextHeading});
    }
  `,
  description: css`
    max-width: 410px;
    margin: 0 0 30px;
    color: ${token.colorTextSecondary};
    font-size: 14px;
    line-height: 1.9;
    text-wrap: pretty;
  `,
  openButton: css`
    height: auto;
    min-height: 48px;
    max-width: 100%;
    padding: 12px 22px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    white-space: normal;
    box-shadow: 0 5px 14px ${token.colorPrimaryBgHover};
  `,
  linkHint: css`
    margin: 12px 0 0;
    color: ${token.colorTextTertiary};
    font-size: 12px;
    line-height: 1.7;
  `,
  artwork: css`
    position: relative;
    display: grid;
    place-items: center;
    height: 330px;
    border-radius: 50%;
    background: radial-gradient(ellipse, ${token.colorPrimaryBg} 0%, transparent 69%);
    @media (max-width: 1023px) and (min-width: 576px) {
      display: none;
    }
    @media (max-width: 575px) {
      height: 290px;
      margin: 0 -12px;
      transform: scale(0.85);
    }
  `,
  orbit: css`
    position: absolute;
    width: 330px;
    height: 330px;
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: 50%;
    opacity: 0.55;
  `,
  orbitInner: css`
    position: absolute;
    width: 268px;
    height: 268px;
    border: 1px dashed ${token.colorPrimaryBorder};
    border-radius: 50%;
    opacity: 0.6;
  `,
  vault: css`
    position: relative;
    width: 204px;
    height: 224px;
    padding: 14px;
    border: 1px solid #b7d2fa;
    border-radius: 30px;
    background: linear-gradient(135deg, #edf5ff, #c9deff 60%, #acc8f2);
    box-shadow: 10px 13px 0 #9ebce8, 19px 29px 35px #1c4f9b24,
      inset 2px 2px 2px #ffffff;
    transform: rotate(-9deg);
  `,
  vaultDoor: css`
    display: flex;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 24px 12px 22px;
    border: 1px solid #b6cdef;
    border-radius: 20px;
    background: linear-gradient(145deg, #fbfdff, #e1edff);
    box-shadow: inset 2px 2px 5px #b7cdec70, 1px 1px 0 #fff;
  `,
  vaultLabel: css`
    color: #6a86b0;
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.18em;
  `,
  lock: css`
    display: grid;
    width: 90px;
    height: 90px;
    place-items: center;
    border: 5px solid #e6f0ff;
    border-radius: 50%;
    background: linear-gradient(145deg, #4d92f7, #1d5fc9);
    color: #fff;
    box-shadow: 0 3px 10px #2f64b330, inset 0 1px 1px #b2d2ff;
  `,
  vaultDots: css`
    display: flex;
    gap: 6px;
    i {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #99b5dd;
    }
  `,
  hingeTop: css`
    position: absolute;
    top: 46px;
    right: 4px;
    width: 9px;
    height: 30px;
    border: 1px solid #98b9e8;
    border-radius: 4px;
    background: linear-gradient(90deg, #c0d6f5, #f3f8ff);
  `,
  hingeBottom: css`
    position: absolute;
    right: 4px;
    bottom: 46px;
    width: 9px;
    height: 30px;
    border: 1px solid #98b9e8;
    border-radius: 4px;
    background: linear-gradient(90deg, #c0d6f5, #f3f8ff);
  `,
  keyCard: css`
    position: absolute;
    bottom: 23px;
    left: calc(50% - 174px);
    width: 204px;
    padding: 16px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 14px;
    background: ${token.colorBgElevated};
    box-shadow: 0 12px 30px #1a42741a;
    transform: rotate(-5deg);
  `,
  keyIcon: css`
    display: grid;
    width: 36px;
    height: 36px;
    flex: none;
    place-items: center;
    border-radius: 10px;
    background: ${token.colorPrimaryBg};
    color: ${token.colorPrimaryText};
  `,
  cardLine: css`
    width: 43px;
    height: 4px;
    border-radius: 2px;
    background: ${token.colorFillSecondary};
  `,
  passwordDots: css`
    display: flex;
    gap: 5px;
    i {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: ${token.colorTextSecondary};
    }
  `,
  cardLock: css`
    margin-left: auto;
    color: ${token.colorTextTertiary};
  `,
  shieldBadge: css`
    position: absolute;
    top: 34px;
    left: calc(50% + 80px);
    display: grid;
    width: 58px;
    height: 64px;
    place-items: center;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 16px;
    background: ${token.colorBgElevated};
    color: ${token.colorPrimaryText};
    box-shadow: 0 8px 24px #1a427414;
    transform: rotate(10deg);
  `,
  sparkOne: css`
    position: absolute;
    top: 38px;
    left: calc(50% - 115px);
    width: 7px;
    height: 7px;
    border-radius: 2px;
    background: ${token.colorPrimaryBorder};
    transform: rotate(45deg);
  `,
  sparkTwo: css`
    position: absolute;
    right: calc(50% - 159px);
    bottom: 53px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${token.colorPrimaryBorder};
  `,
  steps: css`
    margin: 0;
    padding: 30px 40px;
    border-top: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorFillAlter};
    list-style: none;
    @media (max-width: 575px) {
      padding: 26px 24px;
    }
  `,
  stepIcon: css`
    display: grid;
    width: 42px;
    height: 42px;
    flex: none;
    place-items: center;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    background: ${token.colorBgContainer};
    color: ${token.colorTextSecondary};
  `,
  stepTitle: css`
    margin: 0 0 7px;
    color: ${token.colorText};
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
  `,
  stepNumber: css`
    margin-right: 9px;
    color: ${token.colorTextTertiary};
    font-family: ${token.fontFamilyCode};
    font-size: 11px;
    font-weight: 400;
  `,
  stepDescription: css`
    margin: 0;
    color: ${token.colorTextSecondary};
    font-size: 12px;
    line-height: 1.8;
  `,
  notice: css`
    margin: 22px 0;
    padding: 0 8px;
    color: ${token.colorTextTertiary};
  `,
  noticeTitle: css`
    margin: 0 0 4px;
    color: ${token.colorTextSecondary};
    font-size: 12px;
    font-weight: 500;
  `,
  noticeDescription: css`
    margin: 0;
    font-size: 12px;
    line-height: 1.8;
  `,
}));
