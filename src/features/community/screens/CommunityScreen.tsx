import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ArrowRight from 'lucide-react-native/dist/cjs/icons/arrow-right';
import Bell from 'lucide-react-native/dist/cjs/icons/bell';
import ChevronDown from 'lucide-react-native/dist/cjs/icons/chevron-down';
import Ellipsis from 'lucide-react-native/dist/cjs/icons/ellipsis';
import Heart from 'lucide-react-native/dist/cjs/icons/heart';
import House from 'lucide-react-native/dist/cjs/icons/house';
import MapPin from 'lucide-react-native/dist/cjs/icons/map-pin';
import MessageCircle from 'lucide-react-native/dist/cjs/icons/message-circle';
import Plus from 'lucide-react-native/dist/cjs/icons/plus';
import Users from 'lucide-react-native/dist/cjs/icons/users';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerTapHaptic } from '../../../shared/lib/haptics/hapticFeedback';
import { useAuthGate } from '../../../shared/lib/auth/authGate';
import { colors } from '../../../shared/theme/colors';
import { iconSizes } from '../../../shared/theme/iconSizes';
import { radius } from '../../../shared/theme/radius';
import { shadows } from '../../../shared/theme/shadows';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { AppButton } from '../../../shared/ui/primitives/AppButton';
import { AppCard } from '../../../shared/ui/primitives/AppCard';
import { BadgeChip } from '../../../shared/ui/primitives/BadgeChip';
import { FilterChip } from '../../../shared/ui/primitives/FilterChip';
import { FloatingActionButton } from '../../../shared/ui/primitives/FloatingActionButton';
import { useToast } from '../../../shared/ui/toast/ToastProvider';
import { createCommunityPost, listCommunityPosts } from '../api/communityApi';
import {
  CommunityPost,
  CommunityPostFilterType,
  CreateCommunityPostRequest,
  GatheringAudienceScope,
  JoinPolicy,
  PostType,
} from '../types/community';

type CountryOption = {
  code: string;
  name: string;
  cities: Array<{ code: string; name: string }>;
};

type StayInfo = {
  accommodationId: number;
  accommodationName: string;
  addressLine: string;
  cityLabel: string;
  checkIn: string;
  checkOut: string;
  imageUrl: string;
};

type StayCompanion = {
  id: number;
  name: string;
  profileImageUrl: string;
  accommodationId: number;
  checkIn: string;
  checkOut: string;
};

type ComposerDraft = {
  type: PostType;
  content: string;
  locationName: string;
  destination: string;
  meetingPlace: string;
  meetingAt: string;
  maxParticipants: string;
  joinPolicy: JoinPolicy;
  audienceScope: GatheringAudienceScope;
  accommodationId: string;
  audienceStayStartDate: string;
  audienceStayEndDate: string;
};

const FILTERS: Array<{ key: CommunityPostFilterType; label: string }> = [
  { key: 'ALL', label: 'All Posts' },
  { key: 'FREE_FEED', label: 'Free Feed' },
  { key: 'GATHERING', label: 'Gatherings' },
];

const COUNTRY_OPTIONS: CountryOption[] = [
  {
    code: 'PT',
    name: 'Portugal',
    cities: [
      { code: 'LIS', name: 'Lisbon' },
      { code: 'POR', name: 'Porto' },
      { code: 'FAR', name: 'Faro' },
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    cities: [
      { code: 'BCN', name: 'Barcelona' },
      { code: 'MAD', name: 'Madrid' },
      { code: 'VLC', name: 'Valencia' },
    ],
  },
  {
    code: 'KR',
    name: 'Korea',
    cities: [
      { code: 'SEL', name: 'Seoul' },
      { code: 'BSN', name: 'Busan' },
      { code: 'CJU', name: 'Jeju' },
    ],
  },
];

const MY_STAY: StayInfo = {
  accommodationId: 2001,
  accommodationName: 'Casa Alameda',
  addressLine: 'Alameda Dom Afonso Henriques 16',
  cityLabel: 'Lisbon',
  checkIn: '2025-05-20',
  checkOut: '2025-06-18',
  imageUrl:
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=320&q=80',
};

const MOCK_COMPANIONS: StayCompanion[] = [
  {
    id: 1,
    name: 'Mia',
    profileImageUrl: 'https://i.pravatar.cc/120?img=32',
    accommodationId: 2001,
    checkIn: '2025-05-21',
    checkOut: '2025-05-31',
  },
  {
    id: 2,
    name: 'Leo',
    profileImageUrl: 'https://i.pravatar.cc/120?img=12',
    accommodationId: 2001,
    checkIn: '2025-05-24',
    checkOut: '2025-06-06',
  },
  {
    id: 3,
    name: 'Anna',
    profileImageUrl: 'https://i.pravatar.cc/120?img=5',
    accommodationId: 2001,
    checkIn: '2025-06-01',
    checkOut: '2025-06-12',
  },
  {
    id: 4,
    name: 'Ken',
    profileImageUrl: 'https://i.pravatar.cc/120?img=20',
    accommodationId: 2001,
    checkIn: '2025-05-20',
    checkOut: '2025-06-18',
  },
  {
    id: 5,
    name: 'Sara',
    profileImageUrl: 'https://i.pravatar.cc/120?img=40',
    accommodationId: 2002,
    checkIn: '2025-05-22',
    checkOut: '2025-05-26',
  },
];

const INITIAL_COMPOSER: ComposerDraft = {
  type: 'FREE_FEED',
  content: '',
  locationName: '',
  destination: '',
  meetingPlace: '',
  meetingAt: '',
  maxParticipants: '',
  joinPolicy: 'APPROVAL',
  audienceScope: 'CITY_WIDE',
  accommodationId: '',
  audienceStayStartDate: '',
  audienceStayEndDate: '',
};

function formatShortDate(value: string): { primary: string; secondary: string } {
  const date = new Date(value);
  return {
    primary: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date),
    secondary: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
  };
}

function getNightCount(checkIn: string, checkOut: string): number {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function hasDateOverlap(startA: string, endA: string, startB: string, endB: string) {
  return new Date(startA).getTime() <= new Date(endB).getTime() && new Date(startB).getTime() <= new Date(endA).getTime();
}

function getOverlappingCompanions(stay: StayInfo, companions: StayCompanion[]) {
  return companions.filter(companion => {
    if (companion.accommodationId !== stay.accommodationId) {
      return false;
    }
    return hasDateOverlap(stay.checkIn, stay.checkOut, companion.checkIn, companion.checkOut);
  });
}

function getCityLabel(countryCode: string, cityCode: string) {
  const country = COUNTRY_OPTIONS.find(item => item.code === countryCode);
  const city = country?.cities.find(item => item.code === cityCode);
  return city && country ? `${city.name}, ${country.name}` : `${cityCode}, ${countryCode}`;
}

function getAuthorName(post: CommunityPost) {
  const names = ['Alex Chen', 'Sofia Martin', 'Emma Walker', 'Noah Kim', 'Luca Rossi', 'Chloe Park'];
  return names[post.id % names.length];
}

function getAuthorAvatar(post: CommunityPost) {
  return `https://i.pravatar.cc/120?img=${(post.id % 40) + 1}`;
}

function getRelativeTime(postId: number) {
  const options = ['2h ago', '4h ago', '6h ago', '1d ago'];
  return options[postId % options.length];
}

function getScopeLabel(post: CommunityPost) {
  return post.audienceScope === 'ACCOMMODATION_ONLY' ? 'Same Accommodation' : 'City Wide';
}

function getScopeTone(post: CommunityPost) {
  return post.audienceScope === 'ACCOMMODATION_ONLY' ? 'softBlue' : 'softGray';
}

function getPostTitle(post: CommunityPost) {
  if (post.type === 'GATHERING' && post.destination) {
    return post.destination;
  }

  const lines = post.content.split('\n').map(line => line.trim()).filter(Boolean);
  const firstLine = lines[0] ?? 'Community Post';
  return firstLine.length > 52 ? `${firstLine.slice(0, 49)}...` : firstLine;
}

function buildCreatePayload(countryCode: string, cityCode: string, draft: ComposerDraft): CreateCommunityPostRequest {
  const content = draft.content.trim();

  if (draft.type === 'FREE_FEED') {
    return {
      countryCode,
      cityCode,
      type: 'FREE_FEED',
      content,
      locationName: draft.locationName.trim() || null,
      imageUrl: null,
    };
  }

  if (draft.audienceScope === 'ACCOMMODATION_ONLY') {
    return {
      countryCode,
      cityCode,
      type: 'GATHERING',
      audienceScope: 'ACCOMMODATION_ONLY',
      accommodationId: Number(draft.accommodationId),
      audienceStayStartDate: draft.audienceStayStartDate.trim(),
      audienceStayEndDate: draft.audienceStayEndDate.trim(),
      content,
      imageUrl: null,
      locationName: draft.locationName.trim() || null,
      destination: draft.destination.trim() || null,
      meetingPlace: draft.meetingPlace.trim() || null,
      meetingAt: draft.meetingAt.trim() || null,
      maxParticipants: Number(draft.maxParticipants),
      joinPolicy: draft.joinPolicy,
    };
  }

  return {
    countryCode,
    cityCode,
    type: 'GATHERING',
    audienceScope: 'CITY_WIDE',
    accommodationId: null,
    audienceStayStartDate: null,
    audienceStayEndDate: null,
    content,
    imageUrl: null,
    locationName: draft.locationName.trim() || null,
    destination: draft.destination.trim() || null,
    meetingPlace: draft.meetingPlace.trim() || null,
    meetingAt: draft.meetingAt.trim() || null,
    maxParticipants: Number(draft.maxParticipants),
    joinPolicy: draft.joinPolicy,
  };
}

export function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { session, openLogin } = useAuthGate();
  const { showToast } = useToast();

  const [selectedCountryCode, setSelectedCountryCode] = useState('PT');
  const [selectedCityCode, setSelectedCityCode] = useState('LIS');
  const [activeFilter, setActiveFilter] = useState<CommunityPostFilterType>('ALL');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composer, setComposer] = useState<ComposerDraft>(INITIAL_COMPOSER);
  const [submitting, setSubmitting] = useState(false);

  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find(item => item.code === selectedCountryCode) ?? COUNTRY_OPTIONS[0],
    [selectedCountryCode],
  );

  const cityLabel = useMemo(() => getCityLabel(selectedCountryCode, selectedCityCode), [selectedCountryCode, selectedCityCode]);
  const overlappingCompanions = useMemo(() => getOverlappingCompanions(MY_STAY, MOCK_COMPANIONS), []);

  const fetchPosts = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const nextPosts = await listCommunityPosts(selectedCountryCode, selectedCityCode, activeFilter);
        setPosts(nextPosts);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load the community feed.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter, selectedCountryCode, selectedCityCode],
  );

  useEffect(() => {
    fetchPosts(false);
  }, [fetchPosts]);

  const handleCreatePress = () => {
    triggerTapHaptic();
    if (!session) {
      openLogin();
      return;
    }

    setComposer(INITIAL_COMPOSER);
    setTypeModalOpen(true);
  };

  const handleSelectType = (type: PostType) => {
    triggerTapHaptic();
    setComposer({ ...INITIAL_COMPOSER, type });
    setTypeModalOpen(false);
    setComposerOpen(true);
  };

  const handleSubmit = async () => {
    if (!session) {
      setComposerOpen(false);
      openLogin();
      return;
    }

    if (!composer.content.trim()) {
      showToast({ message: 'Please enter post content.', tone: 'error' });
      return;
    }

    if (composer.type === 'GATHERING') {
      if (!composer.destination.trim() || !composer.meetingPlace.trim() || !composer.meetingAt.trim() || !composer.maxParticipants.trim()) {
        showToast({ message: 'Please complete the gathering details.', tone: 'error' });
        return;
      }

      if (composer.audienceScope === 'ACCOMMODATION_ONLY') {
        if (!composer.accommodationId.trim() || !composer.audienceStayStartDate.trim() || !composer.audienceStayEndDate.trim()) {
          showToast({ message: 'Accommodation-only gatherings need stay details.', tone: 'error' });
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      await createCommunityPost(buildCreatePayload(selectedCountryCode, selectedCityCode, composer));
      setComposerOpen(false);
      setComposer(INITIAL_COMPOSER);
      showToast({ message: 'Post created successfully.', tone: 'success' });
      await fetchPosts(false);
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : 'Failed to create post.', tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <FlatList
          data={posts}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <PostCard post={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPosts(true)} tintColor={colors.primary} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: 132 + insets.bottom }]}
          ListHeaderComponent={
            <View>
              <View style={styles.headerRow}>
                <View style={styles.headerCopy}>
                  <Text style={styles.heroTitle}>Community</Text>
                  <Pressable style={styles.cityRow} onPress={() => setLocationModalOpen(true)}>
                    <MapPin size={18} color={colors.primary} />
                    <Text style={styles.cityText}>{cityLabel}</Text>
                    <ChevronDown size={18} color={colors.primary} />
                  </Pressable>
                </View>

                <View style={styles.headerActions}>
                  <Pressable
                    style={styles.iconButton}
                    onPress={() => showToast({ message: 'Notifications will be connected next.', tone: 'info' })}
                  >
                    <Bell size={22} color={colors.textPrimary} />
                    <View style={styles.notificationDot} />
                  </Pressable>

                  <Image source={{ uri: 'https://i.pravatar.cc/120?img=47' }} style={styles.profileAvatar} />
                </View>
              </View>

              <MyStayCard
                stay={MY_STAY}
                companions={overlappingCompanions}
                onManage={() => showToast({ message: 'Stay management will be connected next.', tone: 'info' })}
                onViewMembers={() => showToast({ message: 'Matched member list will be connected next.', tone: 'info' })}
              />

              <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                  {FILTERS.map(filter => {
                    const active = activeFilter === filter.key;
                    return (
                      <FilterChip key={filter.key} label={filter.label} active={active} onPress={() => setActiveFilter(filter.key)} />
                    );
                  })}
                </ScrollView>
              </View>

              {loading ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingStateText}>Loading community feed...</Text>
                </View>
              ) : null}

              {!loading && errorMessage ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>Unable to load feed</Text>
                  <Text style={styles.errorBody}>{errorMessage}</Text>
                  <AppButton label="Retry" size="small" variant="primary" onPress={() => fetchPosts(false)} />
                </View>
              ) : null}

              {!loading && !errorMessage && posts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No posts yet</Text>
                  <Text style={styles.emptyBody}>Be the first to share an update with people staying in this city.</Text>
                </View>
              ) : null}
            </View>
          }
          ListFooterComponent={<View style={{ height: spacing[12] }} />}
        />

        <FloatingActionButton style={[styles.fab, { bottom: insets.bottom + 22 }]} onPress={handleCreatePress}>
          <Plus size={iconSizes.lg} color={colors.semantic.white} />
        </FloatingActionButton>
      </View>

      <LocationModal
        visible={locationModalOpen}
        selectedCountryCode={selectedCountryCode}
        selectedCityCode={selectedCityCode}
        onClose={() => setLocationModalOpen(false)}
        onApply={(countryCode, cityCode) => {
          setSelectedCountryCode(countryCode);
          setSelectedCityCode(cityCode);
          setLocationModalOpen(false);
        }}
      />

      <TypePickerModal visible={typeModalOpen} onClose={() => setTypeModalOpen(false)} onSelectType={handleSelectType} />

      <ComposerModal
        visible={composerOpen}
        value={composer}
        submitting={submitting}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleSubmit}
        onChange={setComposer}
      />
    </SafeAreaView>
  );
}

type MyStayCardProps = {
  stay: StayInfo;
  companions: StayCompanion[];
  onManage: () => void;
  onViewMembers: () => void;
};

function MyStayCard({ stay, companions, onManage, onViewMembers }: MyStayCardProps) {
  const checkIn = formatShortDate(stay.checkIn);
  const checkOut = formatShortDate(stay.checkOut);
  const nights = getNightCount(stay.checkIn, stay.checkOut);
  const visibleCompanions = companions.slice(0, 4);
  const extraCount = Math.max(0, companions.length - visibleCompanions.length);

  return (
    <AppCard style={styles.stayCard} padding="none">
      <View style={styles.stayHeaderRow}>
        <View style={styles.stayLabelRow}>
          <View style={styles.stayIconCircle}>
            <House size={18} color={colors.semantic.white} />
          </View>
          <Text style={styles.stayLabel}>My Stay</Text>
        </View>

        <AppButton label="Manage Stay" size="small" variant="secondary" onPress={onManage} />
      </View>

      <View style={styles.stayBodyRow}>
        <Image source={{ uri: stay.imageUrl }} style={styles.stayImage} />

        <View style={styles.stayBodyCopy}>
          <Text style={styles.stayAccommodationName}>{stay.accommodationName}</Text>
          <Text style={styles.stayAddressLine}>{stay.addressLine}</Text>
          <Text style={styles.stayAddressLine}>{stay.cityLabel}</Text>
        </View>
      </View>

      <View style={styles.stayDivider} />

      <View style={styles.dateGrid}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Check-In</Text>
          <Text style={styles.datePrimary}>{checkIn.primary}</Text>
          <Text style={styles.dateSecondary}>{checkIn.secondary}</Text>
        </View>

        <View style={styles.dateArrowWrap}>
          <ArrowRight size={30} color={colors.textDisabled} />
        </View>

        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>Check-Out</Text>
          <Text style={styles.datePrimary}>{checkOut.primary}</Text>
          <Text style={styles.dateSecondary}>{`${checkOut.secondary} (${nights} nights)`}</Text>
        </View>
      </View>

      <View style={styles.companionSection}>
        <Text style={styles.companionTitle}>{companions.length} members staying at the same time</Text>

        <View style={styles.companionRow}>
          <View style={styles.companionAvatarStack}>
            {visibleCompanions.map((companion, index) => (
              <Image
                key={companion.id}
                source={{ uri: companion.profileImageUrl }}
                style={[styles.companionAvatar, { marginLeft: index === 0 ? 0 : -12, zIndex: 10 - index }]}
              />
            ))}
            {extraCount > 0 ? (
              <View style={[styles.companionExtraBubble, { marginLeft: visibleCompanions.length === 0 ? 0 : -12 }]}>
                <Text style={styles.companionExtraText}>{`+${extraCount}`}</Text>
              </View>
            ) : null}
          </View>

          <AppButton
            label="View Members"
            size="small"
            variant="secondary"
            onPress={onViewMembers}
            icon={<Users size={iconSizes.sm} color={colors.primary} />}
          />
        </View>
      </View>
    </AppCard>
  );
}

type PostCardProps = {
  post: CommunityPost;
};

function PostCard({ post }: PostCardProps) {
  const authorName = getAuthorName(post);
  const title = getPostTitle(post);
  const isGathering = post.type === 'GATHERING';
  const locationLabel = post.accommodationName || post.locationName || getCityLabel(post.countryCode, post.cityCode);
  const metaCount = isGathering ? `${post.maxParticipants ?? 5} going` : null;

  return (
    <AppCard style={styles.postCard} padding="sm">
      <View style={styles.postHeaderRow}>
        <Image source={{ uri: getAuthorAvatar(post) }} style={styles.postAvatar} />

        <View style={styles.postHeaderCopy}>
          <Text style={styles.postAuthorName}>{authorName}</Text>
          <Text style={styles.postMetaText}>{`${getRelativeTime(post.id)}  •  ${locationLabel}`}</Text>
        </View>

        <Pressable style={styles.moreButton}>
          <Ellipsis size={20} color={colors.textTertiary} />
        </Pressable>
      </View>

      <View style={styles.badgeRow}>
        <BadgeChip label={isGathering ? 'Gathering' : 'Free Feed'} tone={isGathering ? 'green' : 'blue'} />
        <BadgeChip label={getScopeLabel(post)} tone={getScopeTone(post)} />
      </View>

      <Text style={styles.postTitle}>{title}</Text>
      <Text style={styles.postBody}>{post.content}</Text>

      <View style={styles.postFooterRow}>
        <View style={styles.postFooterMeta}>
          <View style={styles.iconTextRow}>
            <Heart size={18} color={colors.textTertiary} />
            <Text style={styles.footerMetaText}>{String((post.id % 12) + 8)}</Text>
          </View>

          <View style={styles.iconTextRow}>
            <MessageCircle size={18} color={colors.textTertiary} />
            <Text style={styles.footerMetaText}>{String((post.id % 7) + 4)}</Text>
          </View>

          {metaCount ? (
            <View style={styles.iconTextRow}>
              <Users size={18} color={colors.primary} />
              <Text style={styles.footerMetaAccent}>{metaCount}</Text>
            </View>
          ) : null}
        </View>

        <Pressable style={styles.viewLink}>
          <Text style={styles.viewLinkText}>View</Text>
          <ArrowRight size={16} color={colors.primary} />
        </Pressable>
      </View>
    </AppCard>
  );
}

type BadgeProps = {
  label: string;
  tone: 'blue' | 'green' | 'softBlue' | 'softGray';
};

function Badge({ label, tone }: BadgeProps) {
  const toneStyle =
    tone === 'green'
      ? styles.badgeGreen
      : tone === 'softBlue'
        ? styles.badgeSoftBlue
        : tone === 'softGray'
          ? styles.badgeSoftGray
          : styles.badgeBlue;

  const textStyle =
    tone === 'green'
      ? styles.badgeGreenText
      : tone === 'softBlue'
        ? styles.badgeSoftBlueText
        : tone === 'softGray'
          ? styles.badgeSoftGrayText
          : styles.badgeBlueText;

  return (
    <View style={[styles.badgeBase, toneStyle]}>
      <Text style={[styles.badgeTextBase, textStyle]}>{label}</Text>
    </View>
  );
}

type LocationModalProps = {
  visible: boolean;
  selectedCountryCode: string;
  selectedCityCode: string;
  onClose: () => void;
  onApply: (countryCode: string, cityCode: string) => void;
};

function LocationModal({ visible, selectedCountryCode, selectedCityCode, onClose, onApply }: LocationModalProps) {
  const [countryCode, setCountryCode] = useState(selectedCountryCode);
  const [cityCode, setCityCode] = useState(selectedCityCode);

  useEffect(() => {
    if (visible) {
      setCountryCode(selectedCountryCode);
      setCityCode(selectedCityCode);
    }
  }, [selectedCountryCode, selectedCityCode, visible]);

  const cities = COUNTRY_OPTIONS.find(item => item.code === countryCode)?.cities ?? [];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalScrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select City</Text>
          <Text style={styles.modalBody}>Choose which city community feed you want to browse.</Text>

          <Text style={styles.modalSectionLabel}>Country</Text>
          <View style={styles.selectionGrid}>
            {COUNTRY_OPTIONS.map(country => (
              <Pressable
                key={country.code}
                style={[styles.selectChip, countryCode === country.code && styles.selectChipActive]}
                onPress={() => {
                  setCountryCode(country.code);
                  setCityCode(country.cities[0]?.code ?? '');
                }}
              >
                <Text style={[styles.selectChipText, countryCode === country.code && styles.selectChipTextActive]}>
                  {country.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.modalSectionLabel}>City</Text>
          <View style={styles.selectionGrid}>
            {cities.map(city => (
              <Pressable
                key={city.code}
                style={[styles.selectChip, cityCode === city.code && styles.selectChipActive]}
                onPress={() => setCityCode(city.code)}
              >
                <Text style={[styles.selectChipText, cityCode === city.code && styles.selectChipTextActive]}>{city.name}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.modalFooterRow}>
            <Pressable style={styles.secondaryModalButton} onPress={onClose}>
              <Text style={styles.secondaryModalButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryModalButton} onPress={() => onApply(countryCode, cityCode)}>
              <Text style={styles.primaryModalButtonText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type TypePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: PostType) => void;
};

function TypePickerModal({ visible, onClose, onSelectType }: TypePickerModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalScrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Create Post</Text>
          <Text style={styles.modalBody}>Choose the kind of post you want to share with the community.</Text>

          <Pressable style={styles.typeCard} onPress={() => onSelectType('FREE_FEED')}>
            <Text style={styles.typeCardTitle}>Free Feed</Text>
            <Text style={styles.typeCardBody}>Share an update, a local tip, a question, or a moment from your stay.</Text>
          </Pressable>

          <Pressable style={styles.typeCard} onPress={() => onSelectType('GATHERING')}>
            <Text style={styles.typeCardTitle}>Gathering</Text>
            <Text style={styles.typeCardBody}>Invite people for coffee, coworking, dinner, sightseeing, or an activity.</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type ComposerModalProps = {
  visible: boolean;
  value: ComposerDraft;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: React.Dispatch<React.SetStateAction<ComposerDraft>>;
};

function ComposerModal({ visible, value, submitting, onClose, onSubmit, onChange }: ComposerModalProps) {
  const isGathering = value.type === 'GATHERING';
  const isAccommodationOnly = value.audienceScope === 'ACCOMMODATION_ONLY';

  const setField = <K extends keyof ComposerDraft>(key: K, nextValue: ComposerDraft[K]) => {
    onChange(prev => ({ ...prev, [key]: nextValue }));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.composerSafeArea} edges={['top']}>
        <View style={styles.composerHeader}>
          <Pressable onPress={onClose}>
            <Text style={styles.composerHeaderAction}>Close</Text>
          </Pressable>
          <Text style={styles.composerHeaderTitle}>{isGathering ? 'Gathering Post' : 'Free Feed'}</Text>
          <Pressable onPress={onSubmit} disabled={submitting}>
            <Text style={[styles.composerHeaderAction, submitting && styles.disabledText]}>{submitting ? 'Posting...' : 'Post'}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.composerContent}>
          <Text style={styles.composerDescription}>
            {isGathering
              ? 'Create a meetup for people in your city or at the same accommodation.'
              : 'Share a quick update, question, or recommendation with the community.'}
          </Text>

          <Field label="Content" required>
            <TextInput
              value={value.content}
              onChangeText={text => setField('content', text)}
              placeholder={isGathering ? 'What are you planning?' : 'What do you want to share?'}
              placeholderTextColor="#9AA7BE"
              multiline
              style={[styles.input, styles.textArea]}
            />
          </Field>

          <Field label="Location Name">
            <TextInput
              value={value.locationName}
              onChangeText={text => setField('locationName', text)}
              placeholder="Optional"
              placeholderTextColor="#9AA7BE"
              style={styles.input}
            />
          </Field>

          {isGathering ? (
            <>
              <Field label="Destination" required>
                <TextInput
                  value={value.destination}
                  onChangeText={text => setField('destination', text)}
                  placeholder="Coffee & Chat this Saturday"
                  placeholderTextColor="#9AA7BE"
                  style={styles.input}
                />
              </Field>

              <Field label="Meeting Place" required>
                <TextInput
                  value={value.meetingPlace}
                  onChangeText={text => setField('meetingPlace', text)}
                  placeholder="Cafe name or meeting point"
                  placeholderTextColor="#9AA7BE"
                  style={styles.input}
                />
              </Field>

              <Field label="Meeting Time" required>
                <TextInput
                  value={value.meetingAt}
                  onChangeText={text => setField('meetingAt', text)}
                  placeholder="2026-07-01 10:00"
                  placeholderTextColor="#9AA7BE"
                  style={styles.input}
                />
              </Field>

              <Field label="Max Participants" required>
                <TextInput
                  value={value.maxParticipants}
                  onChangeText={text => setField('maxParticipants', text)}
                  placeholder="6"
                  placeholderTextColor="#9AA7BE"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </Field>

              <Field label="Audience Scope" required>
                <View style={styles.inlineChoiceRow}>
                  <Pressable
                    style={[styles.inlineChoice, value.audienceScope === 'CITY_WIDE' && styles.inlineChoiceActive]}
                    onPress={() => setField('audienceScope', 'CITY_WIDE')}
                  >
                    <Text style={[styles.inlineChoiceText, value.audienceScope === 'CITY_WIDE' && styles.inlineChoiceTextActive]}>
                      City Wide
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.inlineChoice, value.audienceScope === 'ACCOMMODATION_ONLY' && styles.inlineChoiceActive]}
                    onPress={() => setField('audienceScope', 'ACCOMMODATION_ONLY')}
                  >
                    <Text
                      style={[
                        styles.inlineChoiceText,
                        value.audienceScope === 'ACCOMMODATION_ONLY' && styles.inlineChoiceTextActive,
                      ]}
                    >
                      Same Accommodation
                    </Text>
                  </Pressable>
                </View>
              </Field>

              <Field label="Join Policy" required>
                <View style={styles.inlineChoiceRow}>
                  <Pressable
                    style={[styles.inlineChoice, value.joinPolicy === 'APPROVAL' && styles.inlineChoiceActive]}
                    onPress={() => setField('joinPolicy', 'APPROVAL')}
                  >
                    <Text style={[styles.inlineChoiceText, value.joinPolicy === 'APPROVAL' && styles.inlineChoiceTextActive]}>
                      Approval
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.inlineChoice, value.joinPolicy === 'FREE' && styles.inlineChoiceActive]}
                    onPress={() => setField('joinPolicy', 'FREE')}
                  >
                    <Text style={[styles.inlineChoiceText, value.joinPolicy === 'FREE' && styles.inlineChoiceTextActive]}>
                      Free Join
                    </Text>
                  </Pressable>
                </View>
              </Field>

              {isAccommodationOnly ? (
                <>
                  <Field label="Accommodation ID" required>
                    <TextInput
                      value={value.accommodationId}
                      onChangeText={text => setField('accommodationId', text)}
                      placeholder="2001"
                      placeholderTextColor="#9AA7BE"
                      keyboardType="number-pad"
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Stay Start Date" required>
                    <TextInput
                      value={value.audienceStayStartDate}
                      onChangeText={text => setField('audienceStayStartDate', text)}
                      placeholder="2026-07-01"
                      placeholderTextColor="#9AA7BE"
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Stay End Date" required>
                    <TextInput
                      value={value.audienceStayEndDate}
                      onChangeText={text => setField('audienceStayEndDate', text)}
                      placeholder="2026-07-03"
                      placeholderTextColor="#9AA7BE"
                      style={styles.input}
                    />
                  </Field>
                </>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({ label, required = false, children }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[8],
    gap: spacing[16],
  },
  headerRow: {
    flexDirection: 'row',    alignItems: 'flex-start',
    marginBottom: spacing[16],
  },
  headerCopy: {
    flex: 1,
    gap: spacing[12],
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.8,
    fontFamily: Platform.select({ ios: 'Georgia', default: undefined }),
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    alignSelf: 'flex-start',
  },
  cityText: {
    color: colors.primary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    paddingTop: spacing[8],
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  stayCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing[12],
    overflow: 'hidden',
    ...shadows.medium,
    marginBottom: spacing[16],
  },
  stayHeaderRow: {
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[16],
  },
  stayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
  },
  stayIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayLabel: {
    color: colors.primary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  ghostButton: {
    borderWidth: 1.5,
    borderColor: colors.primarySecondary,
    borderRadius: 999,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  ghostButtonText: {
    color: colors.primary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
    fontWeight: typography.weight.medium,
  },
  stayBodyRow: {
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    gap: spacing[16],
    marginBottom: spacing[16],
  },
  stayImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
  },
  stayBodyCopy: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing[6],
  },
  stayAccommodationName: {
    color: colors.textPrimary,
    fontSize: typography.size.bodyS,
    lineHeight: typography.lineHeight.bodyS,
    fontWeight: typography.weight.bold,
  },
  stayAddressLine: {
    color: colors.textTertiary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
  },
  stayDivider: {
    height: 1,
    backgroundColor: colors.primarySoftest,
    marginHorizontal: spacing[16],
  },
  dateGrid: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlock: {
    flex: 1,
    gap: spacing[6],
  },
  dateArrowWrap: {
    paddingHorizontal: spacing[8],
  },
  dateLabel: {
    color: colors.primary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
  },
  datePrimary: {
    color: colors.textPrimary,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.weight.bold,
  },
  dateSecondary: {
    color: colors.textTertiary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
  },
  companionSection: {
    backgroundColor: colors.grayScale[100],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    gap: spacing[14],
  },
  companionTitle: {
    color: colors.primary,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.weight.semibold,
  },
  companionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  companionAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.grayScale[100],
  },
  companionExtraBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoftest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.grayScale[100],
  },
  companionExtraText: {
    color: colors.primary,
    fontSize: typography.size.bodyS,
    lineHeight: typography.lineHeight.bodyS,
    fontWeight: typography.weight.bold,
  },
  membersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    borderWidth: 1.5,
    borderColor: colors.primarySecondary,
    borderRadius: 999,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    backgroundColor: colors.primarySoftest,
  },
  membersButtonText: {
    color: colors.primary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    marginBottom: spacing[12],
  },
  filterScrollContent: {
    gap: spacing[10],
    paddingRight: spacing[8],
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[10],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#9CB6EB',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: '#475773',
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  filterChipTextActive: {
    color: colors.semantic.white,
  },
  filterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  filterActionText: {
    color: colors.primary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
  loadingState: {
    paddingVertical: spacing[32],
    alignItems: 'center',
    gap: spacing[10],
  },
  loadingStateText: {
    color: colors.textTertiary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
  },
  errorCard: {
    backgroundColor: '#FFF7F8',
    borderColor: '#F5D3D8',
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing[16],
    gap: spacing[8],
    marginBottom: spacing[10],
  },
  errorTitle: {
    color: '#8A2940',
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  errorBody: {
    color: '#A16374',
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[10],
    marginTop: spacing[4],
  },
  retryButtonText: {
    color: colors.semantic.white,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[20],
    gap: spacing[8],
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.bodyS,
    lineHeight: typography.lineHeight.bodyS,
    fontWeight: typography.weight.bold,
  },
  emptyBody: {
    color: colors.textTertiary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.caption,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[14],
    gap: spacing[12],
    ...shadows.small,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing[12],
  },
  postHeaderCopy: {
    flex: 1,
    gap: spacing[2],
  },
  postAuthorName: {
    color: colors.textPrimary,
    fontSize: typography.size.bodyS,
    lineHeight: typography.lineHeight.bodyS,
    fontWeight: typography.weight.bold,
  },
  postMetaText: {
    color: colors.textTertiary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  badgeBase: {
    borderRadius: 999,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[6],
  },
  badgeBlue: {
    backgroundColor: colors.primarySoftest,
  },
  badgeGreen: {
    backgroundColor: '#ECFBF4',
  },
  badgeSoftBlue: {
    backgroundColor: colors.primarySoft,
  },
  badgeSoftGray: {
    backgroundColor: colors.grayScale[100],
  },
  badgeTextBase: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeBlueText: {
    color: colors.primary,
  },
  badgeGreenText: {
    color: colors.success,
  },
  badgeSoftBlueText: {
    color: colors.textSecondary,
  },
  badgeSoftGrayText: {
    color: colors.textTertiary,
  },
  postTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.weight.bold,
  },
  postBody: {
    color: colors.textSecondary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.caption,
  },
  postFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    paddingTop: spacing[4],
  },
  postFooterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[20],
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  footerMetaText: {
    color: colors.textSecondary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
  },
  footerMetaAccent: {
    color: colors.primary,
    fontSize: typography.size.small,
    lineHeight: typography.lineHeight.small,
    fontWeight: typography.weight.medium,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
  },
  viewLinkText: {
    color: colors.primary,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.weight.bold,
  },
  fab: {
    position: 'absolute',
    right: spacing[16],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(25, 31, 40, 0.18)',
    paddingHorizontal: spacing[16],
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: spacing[20],
    gap: spacing[14],
    ...shadows.large,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    fontWeight: typography.weight.bold,
  },
  modalBody: {
    color: colors.textTertiary,
    fontSize: typography.size.md,
    lineHeight: 22,
  },
  modalSectionLabel: {
    color: '#3F5170',
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing[4],
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[10],
  },
  selectChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[10],
    backgroundColor: colors.primarySoftest,
  },
  selectChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectChipText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  selectChipTextActive: {
    color: colors.semantic.white,
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[10],
    marginTop: spacing[4],
  },
  secondaryModalButton: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderRadius: 999,
    backgroundColor: colors.grayScale[100],
  },
  secondaryModalButtonText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
  primaryModalButton: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[10],
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  primaryModalButtonText: {
    color: colors.semantic.white,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
  typeCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5ECF9',
    padding: spacing[16],
    gap: spacing[8],
    backgroundColor: '#FAFCFF',
  },
  typeCardTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  typeCardBody: {
    color: colors.textTertiary,
    fontSize: typography.size.md,
    lineHeight: 22,
  },
  composerSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  composerHeader: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[14],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  composerHeaderAction: {
    color: colors.primary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.semibold,
  },
  composerHeaderTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  disabledText: {
    opacity: 0.5,
  },
  composerContent: {
    padding: spacing[16],
    gap: spacing[16],
    paddingBottom: spacing[40],
  },
  composerDescription: {
    color: colors.textTertiary,
    fontSize: typography.size.md,
    lineHeight: 22,
  },
  fieldWrap: {
    gap: spacing[8],
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCE6F7',
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[12],
    color: colors.textPrimary,
    fontSize: typography.size.md,
    lineHeight: 22,
  },
  textArea: {
    minHeight: 132,
    textAlignVertical: 'top',
  },
  inlineChoiceRow: {
    flexDirection: 'row',
    gap: spacing[10],
    flexWrap: 'wrap',
  },
  inlineChoice: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DCE6F7',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[10],
  },
  inlineChoiceActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inlineChoiceText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  inlineChoiceTextActive: {
    color: colors.semantic.white,
  },
});
