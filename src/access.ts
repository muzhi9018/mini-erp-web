/**
 * @see https://umijs.org/docs/max/access#access
 * */
// export default function access(
//   initialState: { currentUser?: API.CurrentUser } | undefined,
// ) {
//   const { currentUser } = initialState ?? {};
//   return {
//     canAdmin: currentUser && currentUser.access === 'admin',
//   };
// }
export default function access(
  initialState: { currentUser?: Auth.CurrentUser } | undefined,
) {
  // 获取到当前登录用户
  const { currentUser } = initialState ?? {};
  // 获取到当前用户的所有权限码
  const permissionCodes = currentUser?.permissionCodes ?? [];
  // 定义变量存放权限码
  const permissionCodeMode: { [kye: string]: boolean } = {};
  // 遍历当前用户的权限码 并且添加到 permissionCodeMode
  permissionCodes.forEach((permissionCode) => {
    permissionCodeMode[permissionCode] = true;
  });
  // 解构所有权限码，并且重写 hasPermission 函数
  const accessModel: Auth.AccessModel = {
    ...permissionCodeMode,
    hasPermission: (permissionCode) => {
      const permission = accessModel[permissionCode] ?? false;
      if (typeof permission === 'boolean') {
        return permission;
      }
      return false;
    },
  };
  return accessModel;
}
