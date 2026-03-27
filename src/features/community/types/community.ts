export type PostType = 'GATHERING' | 'FREE_FEED';
export type JoinPolicy = 'APPROVAL' | 'FREE';

/**
 * 커뮤니티 게시글 타입.
 */
export type CommunityPost = {
  id: number;
  authorUserId: number;
  countryCode: string;
  cityCode: string;
  type: PostType;
  content: string;
  imageUrl: string | null;
  locationName: string | null;
  destination: string | null;
  meetingPlace: string | null;
  meetingAt: string | null;
  maxParticipants: number | null;
  joinPolicy: JoinPolicy | null;
};

export type CommunityPostFilterType = 'ALL' | PostType;
