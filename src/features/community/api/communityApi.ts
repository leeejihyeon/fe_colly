import { httpGet, httpPost } from '../../../shared/lib/http/httpClient';
import { CommunityPost, CommunityPostFilterType, CreateCommunityPostRequest } from '../types/community';

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

/**
 * 커뮤니티 게시글을 작성한다.
 * - 참여형(GATHERING)은 audienceScope(숙소/도시 대상) 입력이 필수다.
 */
export async function createCommunityPost(payload: CreateCommunityPostRequest): Promise<CommunityPost> {
  return httpPost<CommunityPost, CreateCommunityPostRequest>('/api/community/posts', payload);
}
