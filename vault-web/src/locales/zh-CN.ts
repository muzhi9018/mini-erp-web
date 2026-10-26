import actions from './zh-CN/actions';
import deleted from './zh-CN/deleted';
import entries from './zh-CN/entries';
import groups from './zh-CN/groups';
import management from './zh-CN/management';
import vault from './zh-CN/vault';

export default {
  ...actions,
  ...deleted,
  ...vault,
  ...entries,
  ...management,
  ...groups,
};
