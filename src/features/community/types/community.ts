export type PostType = 'GATHERING' | 'FREE_FEED';
export type JoinPolicy = 'APPROVAL' | 'FREE';
export type GatheringAudienceScope = 'ACCOMMODATION_ONLY' | 'CITY_WIDE';

/**
 * 커뮤니티 게시글 타입.
 */
export type CommunityPost = {
  id: number;
  authorUserId: number;
  countryCode: string;
  cityCode: string;
  type: PostType;
  audienceScope: GatheringAudienceScope | null;
  accommodationId: number | null;
  accommodationName: string | null;
  audienceStayStartDate: string | null;
  audienceStayEndDate: string | null;
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

export type CreateFreeFeedPostRequest = {
  countryCode: string;
  cityCode: string;
  type: 'FREE_FEED';
  content: string;
  imageUrl?: string | null;
  locationName?: string | null;
};

export type CreateGatheringPostRequest = {
  countryCode: string;
  cityCode: string;
  type: 'GATHERING';
  content: string;
  joinPolicy: JoinPolicy;
  maxParticipants?: number | null;
  destination?: string | null;
  meetingPlace?: string | null;
  meetingAt?: string | null;
  imageUrl?: string | null;
  locationName?: string | null;
};

export type CreateAccommodationGatheringPostRequest = CreateGatheringPostRequest & {
  audienceScope: 'ACCOMMODATION_ONLY';
  accommodationId: number;
  audienceStayStartDate: string;
  audienceStayEndDate: string;
};

export type CreateCityWideGatheringPostRequest = CreateGatheringPostRequest & {
  audienceScope: 'CITY_WIDE';
  accommodationId?: null;
  audienceStayStartDate?: null;
  audienceStayEndDate?: null;
};

export type CreateCommunityPostRequest =
  | CreateFreeFeedPostRequest
  | CreateAccommodationGatheringPostRequest
  | CreateCityWideGatheringPostRequest;
