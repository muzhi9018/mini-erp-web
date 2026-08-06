declare namespace Auth {
  type LoginParam = {
    username?: string;
    password?: string;
  };

  type ClientToken = {
    accessToken?: string;
  };

  type AuthorizeParam = {
    response_type?: string;
    client_id?: string;
    scope?: string | string[];
    state?: string;
    redirect_uri?: string;
    content_type?: string;
  };

  type AuthorizeCode = {
    redirectUri?: string;
    code?: string;
    state?: string;
  };

  type AuthorizeTokenParam = {
    grant_type?: string;
    code?: string;
    redirect_uri?: string;
    scope?: string;
  };

  type AuthorizeToken = {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    id_token?: string;
    token_type?: string;
    expires_in?: number;
    status?: string;
    type?: string;
  };

  type CurrentUser = {
    id?: string;
    userNo?: string;
    realName?:string;
    username?: string;
    mobile?: string;
    currentRoleCode?: string;
    remark?: string;
    permissionCodes?: string[];
    roleCodes?: string[];
    accessToken?: string;
    enabled?: boolean;
    tokenType?: string;
  };

  type Consent = {
    clientId?: string;
    state?: string;
    principalName?: string;
    userCode?: string;
    requestURI?: string;
    scopes?: Scope[];
    previouslyApprovedScopes?: Scope[];
  };

  type Scope = {
    scope?: string;
    description?: string;
  };

  type OidcLogout = {
    id_token_hint?: string;
    client_id?: string;
    post_logout_redirect_uri: ?string;
    state: ?string;
  };

  type AccessModel = {
    [key: string]: boolean | ((permissionCode: string) => boolean);
    hasPermission: (permissionCode: string) => boolean;
  };
}

declare namespace Role {

  type Role = {
    id?: string;
    gmtCreate?: number;
    gmtModified?: number;
    status?: number;
    sort?: number;
    roleName?: string;
    roleCode?: string;
    remark?: string;
    sysDefRole?: boolean;
    menuIds?: string[]
  };

  type RoleQuery = Common.Page & Role;

  type RolePage = Common.BasePage & {
    records: Role[]
  }

}

