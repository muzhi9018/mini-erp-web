import actions from './en-US/actions';
import deleted from './en-US/deleted';
import entries from './en-US/entries';
import groups from './en-US/groups';
import management from './en-US/management';
import vault from './en-US/vault';

export default {
  ...actions,
  ...deleted,
  ...vault,
  ...entries,
  ...management,
  ...groups,
};
