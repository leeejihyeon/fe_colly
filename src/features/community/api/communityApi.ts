import { httpGet } from '../../../shared/lib/http/httpClient';
import { CommunityPost, CommunityPostFilterType } from '../types/community';

/**
 * 커뮤니티 게시글 목록을 조회한다.
 */
export async function listCommunityPosts(
  countryCode: string,
  cityCode: string,
  type: CommunityPostFilterType = 'ALL',
): Promise<CommunityPost[]> {
  const search = new URLSearchParams({ countryCode, cityCode, type }).toString();
  return httpGet<CommunityPost[]>(`/api/community/posts?${search}`);
}
