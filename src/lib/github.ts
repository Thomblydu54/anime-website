export interface GithubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  assets: {
    browser_download_url: string;
    download_count: number;
  }[];
}

export interface GithubRepository {
  stargazers_count: number;
  forks_count: number;
}

const OWNER = "Thomblydu54";
const REPO = "Anime";

export async function getLatestRelease(): Promise<GithubRelease> {
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`
  );

  return await response.json();
}

export async function getRepository(): Promise<GithubRepository> {
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}`
  );

  return await response.json();
}