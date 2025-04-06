declare module "google-search-results-nodejs" {
  interface SearchParams {
    q: string;
    engine: string;
    num?: number;
    hl?: string;
    gl?: string;
    [key: string]: any;
  }

  interface OrganicResult {
    title: string;
    link: string;
    snippet: string;
    displayed_link?: string;
  }

  type Callback = (data: any) => void;

  export class GoogleSearch {
    constructor(apiKey: string);
    json(params: SearchParams, callback: Callback): void;
  }
}
