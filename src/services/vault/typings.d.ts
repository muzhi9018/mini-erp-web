declare namespace Vault {
  type SiteStatus = 0 | 1;

  type SiteValues = {
    siteName: string;
    siteDomain: string;
    status?: SiteStatus;
    sort?: number;
  };

  type Site = SiteValues & {
    id: number | string;
    status: SiteStatus;
    sort: number;
    gmtCreate?: string;
    gmtModified?: string;
  };

  type SiteListParams = {
    pageNum: number;
    pageSize: number;
    siteName?: string;
    siteDomain?: string;
    status?: SiteStatus;
  };

  type SitePage = Common.BasePage & {
    records: Site[];
  };
}
