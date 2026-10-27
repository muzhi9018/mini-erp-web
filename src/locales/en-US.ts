import component from './en-US/component';
import globalHeader from './en-US/globalHeader';
import login from './en-US/login';
import menu from './en-US/menu';
import network from './en-US/network';
import pages from './en-US/pages';
import passwordVault from './en-US/passwordVault';
import settingDrawer from './en-US/settingDrawer';
import settings from './en-US/settings';
import systemUserManager from './en-US/systemUserManager';
import website from './en-US/website';
import websiteCategoryManager from './en-US/websiteCategoryManager';
import websiteProductManager from './en-US/websiteProductManager';

export default {
  ...passwordVault,
  'navBar.lang': 'Languages',
  'layout.user.link.help': 'Help',
  'layout.user.link.privacy': 'Privacy',
  'layout.user.link.terms': 'Terms',
  'app.preview.down.block': 'Download this page to your local project',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...systemUserManager,
  ...network,
  ...component,
  ...pages,
  ...login,
  ...website,
  ...websiteCategoryManager,
  ...websiteProductManager,
};
