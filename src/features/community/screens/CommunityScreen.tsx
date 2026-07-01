import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Plus from 'lucide-react-native/dist/cjs/icons/plus';
import {
  ActivityIndicator,
  FlatList,
  Image,
  LayoutAnimation,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../../shared/ui/layout/ScreenContainer';
import { layoutTokens } from '../../../shared/ui/layout/layoutTokens';
import { triggerTapHaptic } from '../../../shared/lib/haptics/hapticFeedback';
import { breakpoints } from '../../../shared/theme/breakpoints';
import { colors } from '../../../shared/theme/colors';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { createCommunityPost, listCommunityPosts } from '../api/communityApi';
import { CommunityPost, CommunityPostFilterType, GatheringAudienceScope, JoinPolicy, PostType } from '../types/community';
import { useAuthGate } from '../../../shared/lib/auth/authGate';
import { useToast } from '../../../shared/ui/toast/ToastProvider';

const FILTERS: Array<{ key: CommunityPostFilterType; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'GATHERING', label: 'Gatherings' },
  { key: 'FREE_FEED', label: 'Free Feed' },
];

type CountryOption = {
  code: string;
  flag: string;
  name: string;
  cities: Array<{ code: string; name: string }>;
};

const COUNTRY_OPTIONS: CountryOption[] = [
  {
    code: 'AU',
    flag: '🇦🇺',
    name: 'Australia',
    cities: [
      { code: 'SYD', name: 'Sydney' },
      { code: 'MEL', name: 'Melbourne' },
      { code: 'BNE', name: 'Brisbane' },
    ],
  },
  {
    code: 'NZ',
    flag: '🇳🇿',
    name: 'New Zealand',
    cities: [
      { code: 'AKL', name: 'Auckland' },
      { code: 'WLG', name: 'Wellington' },
      { code: 'CHC', name: 'Christchurch' },
    ],
  },
  {
    code: 'JP',
    flag: '🇯🇵',
    name: 'Japan',
    cities: [
      { code: 'TYO', name: 'Tokyo' },
      { code: 'OSA', name: 'Osaka' },
      { code: 'FUK', name: 'Fukuoka' },
    ],
  },
  {
    code: 'KR',
    flag: '🇰🇷',
    name: 'Korea',
    cities: [
      { code: 'SEL', name: 'Seoul' },
      { code: 'BSN', name: 'Busan' },
      { code: 'CJU', name: 'Jeju' },
    ],
  },
  {
    code: 'US',
    flag: '🇺🇸',
    name: 'United States',
    cities: [
      { code: 'LAX', name: 'Los Angeles' },
      { code: 'NYC', name: 'New York' },
      { code: 'SFO', name: 'San Francisco' },
    ],
  },
  {
    code: 'GB',
    flag: '🇬🇧',
    name: 'United Kingdom',
    cities: [
      { code: 'LON', name: 'London' },
      { code: 'MAN', name: 'Manchester' },
      { code: 'EDI', name: 'Edinburgh' },
    ],
  },
];

type StayInfo = {
  accommodationId: number;
  accommodationName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
};

const MOCK_STAY_INFO: StayInfo | null = {
  accommodationId: 1001,
  accommodationName: 'Sydney Central Backpackers',
  roomType: 'Shared Dorm • 6 Beds',
  checkIn: '2026-03-25',
  checkOut: '2026-04-05',
};

type StayCompanion = {
  id: number;
  name: string;
  accommodationId: number;
  accommodationName: string;
  checkIn: string;
  checkOut: string;
  profileImageUrl?: string;
};

const MOCK_STAY_COMPANIONS: StayCompanion[] = [
  {
    id: 101,
    name: 'Emma',
    accommodationId: 1001,
    accommodationName: 'Sydney Central Backpackers',
    checkIn: '2026-03-27',
    checkOut: '2026-04-03',
  },
  {
    id: 102,
    name: 'Lucas',
    accommodationId: 1001,
    accommodationName: 'Sydney Central Backpackers',
    checkIn: '2026-03-29',
    checkOut: '2026-04-08',
    profileImageUrl: 'https://i.pravatar.cc/120?img=14',
  },
  {
    id: 103,
    name: 'Olivia',
    accommodationId: 1001,
    accommodationName: 'Sydney Central Backpackers',
    checkIn: '2026-04-02',
    checkOut: '2026-04-06',
    profileImageUrl: 'https://i.pravatar.cc/120?img=30',
  },
  {
    id: 104,
    name: 'Noah',
    accommodationId: 1002,
    accommodationName: 'Sydney Harbour Hostel',
    checkIn: '2026-03-27',
    checkOut: '2026-03-30',
  },
  {
    id: 105,
    name: 'Mia',
    accommodationId: 1001,
    accommodationName: 'Sydney Central Backpackers',
    checkIn: '2026-04-10',
    checkOut: '2026-04-12',
  },
];

function hasDateOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const startTimeA = new Date(startA).getTime();
  const endTimeA = new Date(endA).getTime();
  const startTimeB = new Date(startB).getTime();
  const endTimeB = new Date(endB).getTime();
  return startTimeA <= endTimeB && startTimeB <= endTimeA;
}

function getOverlappingCompanions(stay: StayInfo | null, companions: StayCompanion[]): StayCompanion[] {
  if (!stay) {
    return [];
  }

  return companions.filter(companion => {
    const sameAccommodation = companion.accommodationId === stay.accommodationId;
    if (!sameAccommodation) {
      return false;
    }
    return hasDateOverlap(stay.checkIn, stay.checkOut, companion.checkIn, companion.checkOut);
  });
}

/**
 * Community tab main screen.
 */
export function CommunityScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= breakpoints.tablet;
  const numColumns = isTablet ? 2 : 1;

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<CommunityPostFilterType>('ALL');

  const [selectedCountryCode, setSelectedCountryCode] = useState('AU');
  const [selectedCityCode, setSelectedCityCode] = useState('SYD');
  const [selectorOpen, setSelectorOpen] = useState(false);

  const [myStay, setMyStay] = useState<StayInfo | null>(MOCK_STAY_INFO);
  const [stayExpanded, setStayExpanded] = useState(true);
  const { session, openLogin } = useAuthGate();
  const { showToast } = useToast();
  const [composerTypePickerOpen, setComposerTypePickerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<PostType>('FREE_FEED');
  const [composerJoinPolicy, setComposerJoinPolicy] = useState<JoinPolicy>('APPROVAL');
  const [composerAudienceScope, setComposerAudienceScope] = useState<GatheringAudienceScope>('CITY_WIDE');
  const [composerContent, setComposerContent] = useState('');
  const [composerLocation, setComposerLocation] = useState('');
  const [composerDestination, setComposerDestination] = useState('');
  const [composerMeetingPlace, setComposerMeetingPlace] = useState('');
  const [composerMeetingAt, setComposerMeetingAt] = useState('');
  const [composerMaxParticipants, setComposerMaxParticipants] = useState('');
  const [composerAccommodationId, setComposerAccommodationId] = useState('');
  const [composerAudienceStartDate, setComposerAudienceStartDate] = useState('');
  const [composerAudienceEndDate, setComposerAudienceEndDate] = useState('');
  const [composerSubmitting, setComposerSubmitting] = useState(false);

  const overlappingCompanions = useMemo(
    () => getOverlappingCompanions(myStay, MOCK_STAY_COMPANIONS),
    [myStay],
  );

  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find(country => country.code === selectedCountryCode) ?? COUNTRY_OPTIONS[0],
    [selectedCountryCode],
  );

  const selectedCityName = useMemo(
    () => selectedCountry.cities.find(city => city.code === selectedCityCode)?.name ?? selectedCityCode,
    [selectedCountry, selectedCityCode],
  );

  const fetchPosts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await listCommunityPosts(selectedCountryCode, selectedCityCode, activeFilter);
        setPosts(result);
        setErrorMessage(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load feed.';
        setErrorMessage(message);
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

  const handlePressCreatePost = () => {
    triggerTapHaptic();

    if (!session) {
      openLogin();
      return;
    }

    setComposerType('FREE_FEED');
    setComposerJoinPolicy('APPROVAL');
    setComposerAudienceScope('CITY_WIDE');
    setComposerContent('');
    setComposerLocation('');
    setComposerDestination('');
    setComposerMeetingPlace('');
    setComposerMeetingAt('');
    setComposerMaxParticipants('');
    setComposerAccommodationId('');
    setComposerAudienceStartDate('');
    setComposerAudienceEndDate('');
    setComposerTypePickerOpen(true);
  };

  const handleSelectComposerType = (type: PostType) => {
    triggerTapHaptic();
    setComposerType(type);
    setComposerTypePickerOpen(false);
    setComposerOpen(true);
  };

  const handlePressJoin = () => {
    triggerTapHaptic();

    if (!session) {
      openLogin();
      return;
    }

    showToast({ message: 'Join flow will be connected next.', tone: 'info' });
  };

  const handleSubmitPost = async () => {
    const content = composerContent.trim();
    const location = composerLocation.trim();
    const destination = composerDestination.trim();
    const meetingPlace = composerMeetingPlace.trim();
    const meetingAt = composerMeetingAt.trim();
    const maxParticipants = Number(composerMaxParticipants);
    const accommodationId = Number(composerAccommodationId);
    const audienceStartDate = composerAudienceStartDate.trim();
    const audienceEndDate = composerAudienceEndDate.trim();

    if (!session) {
      setComposerOpen(false);
      openLogin();
      return;
    }

    if (!content) {
      showToast({ message: 'Please enter post content.', tone: 'error' });
      return;
    }

    if (composerType === 'GATHERING') {
      if (!destination || !meetingPlace || !meetingAt || !composerMaxParticipants.trim()) {
        showToast({ message: 'Please fill all required gathering fields.', tone: 'error' });
        return;
      }

      if (!Number.isFinite(maxParticipants) || maxParticipants <= 0) {
        showToast({ message: 'Max participants must be a positive number.', tone: 'error' });
        return;
      }

      if (composerAudienceScope === 'ACCOMMODATION_ONLY') {
        if (!composerAccommodationId.trim() || !audienceStartDate || !audienceEndDate) {
          showToast({ message: 'Accommodation-only gathering requires stay fields.', tone: 'error' });
          return;
        }

        if (!Number.isFinite(accommodationId) || accommodationId <= 0) {
          showToast({ message: 'Accommodation ID must be a positive number.', tone: 'error' });
          return;
        }
      }
    }

    try {
      setComposerSubmitting(true);
      if (composerType === 'FREE_FEED') {
        await createCommunityPost({
          countryCode: selectedCountryCode,
          cityCode: selectedCityCode,
          type: 'FREE_FEED',
          content,
          locationName: location || null,
          imageUrl: null,
        });
      } else {
        if (composerAudienceScope === 'ACCOMMODATION_ONLY') {
          await createCommunityPost({
            countryCode: selectedCountryCode,
            cityCode: selectedCityCode,
            type: 'GATHERING',
            audienceScope: 'ACCOMMODATION_ONLY',
            accommodationId,
            audienceStayStartDate: audienceStartDate,
            audienceStayEndDate: audienceEndDate,
            content,
            imageUrl: null,
            locationName: location || null,
            destination,
            meetingPlace,
            meetingAt,
            maxParticipants,
            joinPolicy: composerJoinPolicy,
          });
        } else {
          await createCommunityPost({
            countryCode: selectedCountryCode,
            cityCode: selectedCityCode,
            type: 'GATHERING',
            audienceScope: 'CITY_WIDE',
            accommodationId: null,
            audienceStayStartDate: null,
            audienceStayEndDate: null,
            content,
            imageUrl: null,
            locationName: location || null,
            destination,
            meetingPlace,
            meetingAt,
            maxParticipants,
            joinPolicy: composerJoinPolicy,
          });
        }
      }

      setComposerOpen(false);
      setComposerContent('');
      setComposerLocation('');
      showToast({ message: 'Post created successfully.', tone: 'success' });
      await fetchPosts(false);
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'Failed to create post.',
        tone: 'error',
      });
    } finally {
      setComposerSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <LocationPill
        flag={selectedCountry.flag}
        countryName={selectedCountry.name}
        cityName={selectedCityName}
        onPress={() => setSelectorOpen(true)}
      />

      <MyStayCard
        stay={myStay}
        companions={overlappingCompanions}
        expanded={stayExpanded}
        onToggle={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setStayExpanded(prev => !prev);
        }}
        onRegisterPress={() => {
          setMyStay(MOCK_STAY_INFO);
          setStayExpanded(true);
        }}
      />

      <View style={styles.filterRow}>
        {FILTERS.map(filter => (
          <Pressable
            key={filter.key}
            onPressIn={triggerTapHaptic}
            onPress={() => setActiveFilter(filter.key)}
            style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading feed...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorTitle}>Unable to load feed</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <Pressable onPressIn={triggerTapHaptic} onPress={() => fetchPosts(false)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={posts.length === 0 ? styles.centerBox : styles.listContent}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPosts(true)} />}
          ListEmptyComponent={<Text style={styles.stateText}>No posts yet in this city.</Text>}
          renderItem={({ item }) => (
            <PostCard post={item} isTablet={isTablet} myStay={myStay} onPressJoin={handlePressJoin} />
          )}
        />
      )}

      <Pressable onPress={handlePressCreatePost} style={styles.writeFab}>
        <Plus size={16} color={colors.semantic.white} />
        <Text style={styles.writeFabText}>Create Post</Text>
      </Pressable>

      <LocationPickerModal
        visible={selectorOpen}
        countries={COUNTRY_OPTIONS}
        selectedCountryCode={selectedCountryCode}
        selectedCityCode={selectedCityCode}
        onClose={() => setSelectorOpen(false)}
        onApply={(countryCode, cityCode) => {
          setSelectedCountryCode(countryCode);
          setSelectedCityCode(cityCode);
          setSelectorOpen(false);
        }}
      />

      <CreatePostTypeModal
        visible={composerTypePickerOpen}
        onClose={() => setComposerTypePickerOpen(false)}
        onSelectType={handleSelectComposerType}
      />

      <CreatePostModal
        visible={composerOpen}
        type={composerType}
        joinPolicy={composerJoinPolicy}
        audienceScope={composerAudienceScope}
        content={composerContent}
        locationName={composerLocation}
        destination={composerDestination}
        meetingPlace={composerMeetingPlace}
        meetingAt={composerMeetingAt}
        maxParticipants={composerMaxParticipants}
        accommodationId={composerAccommodationId}
        audienceStartDate={composerAudienceStartDate}
        audienceEndDate={composerAudienceEndDate}
        submitting={composerSubmitting}
        onChangeJoinPolicy={setComposerJoinPolicy}
        onChangeAudienceScope={setComposerAudienceScope}
        onChangeContent={setComposerContent}
        onChangeLocationName={setComposerLocation}
        onChangeDestination={setComposerDestination}
        onChangeMeetingPlace={setComposerMeetingPlace}
        onChangeMeetingAt={setComposerMeetingAt}
        onChangeMaxParticipants={setComposerMaxParticipants}
        onChangeAccommodationId={setComposerAccommodationId}
        onChangeAudienceStartDate={setComposerAudienceStartDate}
        onChangeAudienceEndDate={setComposerAudienceEndDate}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleSubmitPost}
      />
    </ScreenContainer>
  );
}

type CreatePostModalProps = {
  visible: boolean;
  type: PostType;
  joinPolicy: JoinPolicy;
  audienceScope: GatheringAudienceScope;
  content: string;
  locationName: string;
  destination: string;
  meetingPlace: string;
  meetingAt: string;
  maxParticipants: string;
  accommodationId: string;
  audienceStartDate: string;
  audienceEndDate: string;
  submitting: boolean;
  onChangeJoinPolicy: (value: JoinPolicy) => void;
  onChangeAudienceScope: (value: GatheringAudienceScope) => void;
  onChangeContent: (value: string) => void;
  onChangeLocationName: (value: string) => void;
  onChangeDestination: (value: string) => void;
  onChangeMeetingPlace: (value: string) => void;
  onChangeMeetingAt: (value: string) => void;
  onChangeMaxParticipants: (value: string) => void;
  onChangeAccommodationId: (value: string) => void;
  onChangeAudienceStartDate: (value: string) => void;
  onChangeAudienceEndDate: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function CreatePostModal({
  visible,
  type,
  joinPolicy,
  audienceScope,
  content,
  locationName,
  destination,
  meetingPlace,
  meetingAt,
  maxParticipants,
  accommodationId,
  audienceStartDate,
  audienceEndDate,
  submitting,
  onChangeJoinPolicy,
  onChangeAudienceScope,
  onChangeContent,
  onChangeLocationName,
  onChangeDestination,
  onChangeMeetingPlace,
  onChangeMeetingAt,
  onChangeMaxParticipants,
  onChangeAccommodationId,
  onChangeAudienceStartDate,
  onChangeAudienceEndDate,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const isGathering = type === 'GATHERING';
  const isAccommodationOnly = audienceScope === 'ACCOMMODATION_ONLY';
  const headerTitle = isGathering ? 'Gathering Post' : 'Free Feed Post';
  const headerDescription = isGathering
    ? 'Plan a meetup by filling destination, time, and join rules.'
    : 'Share your daily moments in this city right now.';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.fullModalRoot}>
          <View style={styles.fullModalFrame}>
            <View style={styles.fullModalHeader}>
              <Text style={styles.fullModalTitle}>{headerTitle}</Text>
            </View>
            <Text style={styles.composerDescription}>{headerDescription}</Text>

            <ScrollView
              style={styles.composerScroll}
              contentContainerStyle={styles.composerScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.composerFieldWrap}>
              <Text style={styles.composerLabel}>Content</Text>
              <TextInput
                style={[styles.composerInput, styles.composerContentInput]}
                placeholder="Share what is happening in your city"
                placeholderTextColor={colors.textTertiary}
                multiline
                value={content}
                onChangeText={onChangeContent}
                textAlignVertical="top"
              />

              <Text style={styles.composerLabel}>Location (optional)</Text>
              <TextInput
                style={styles.composerInput}
                placeholder="e.g. Sydney Opera House"
                placeholderTextColor={colors.textTertiary}
                value={locationName}
                onChangeText={onChangeLocationName}
              />

              {isGathering ? (
                <>
                  <Text style={styles.composerLabel}>Destination *</Text>
                  <TextInput
                    style={styles.composerInput}
                    placeholder="e.g. Blue Mountain"
                    placeholderTextColor={colors.textTertiary}
                    value={destination}
                    onChangeText={onChangeDestination}
                  />

                  <Text style={styles.composerLabel}>Meeting Place *</Text>
                  <TextInput
                    style={styles.composerInput}
                    placeholder="e.g. Town Hall"
                    placeholderTextColor={colors.textTertiary}
                    value={meetingPlace}
                    onChangeText={onChangeMeetingPlace}
                  />

                  <Text style={styles.composerLabel}>Meeting At (ISO) *</Text>
                  <TextInput
                    style={styles.composerInput}
                    placeholder="2026-05-04T19:00:00"
                    placeholderTextColor={colors.textTertiary}
                    value={meetingAt}
                    onChangeText={onChangeMeetingAt}
                  />

                  <Text style={styles.composerLabel}>Max Participants *</Text>
                  <TextInput
                    style={styles.composerInput}
                    keyboardType="number-pad"
                    placeholder="6"
                    placeholderTextColor={colors.textTertiary}
                    value={maxParticipants}
                    onChangeText={onChangeMaxParticipants}
                  />

                  <Text style={styles.composerLabel}>Join Policy *</Text>
                  <View style={styles.composerChipRow}>
                    <Pressable
                      style={[styles.composerChip, joinPolicy === 'APPROVAL' && styles.composerChipSelected]}
                      onPress={() => onChangeJoinPolicy('APPROVAL')}
                    >
                      <Text
                        style={[
                          styles.composerChipText,
                          joinPolicy === 'APPROVAL' && styles.composerChipTextSelected,
                        ]}
                      >
                        Approval
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.composerChip, joinPolicy === 'FREE' && styles.composerChipSelected]}
                      onPress={() => onChangeJoinPolicy('FREE')}
                    >
                      <Text style={[styles.composerChipText, joinPolicy === 'FREE' && styles.composerChipTextSelected]}>
                        Free
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.composerLabel}>Audience Scope *</Text>
                  <View style={styles.composerChipRow}>
                    <Pressable
                      style={[styles.composerChip, audienceScope === 'CITY_WIDE' && styles.composerChipSelected]}
                      onPress={() => onChangeAudienceScope('CITY_WIDE')}
                    >
                      <Text
                        style={[
                          styles.composerChipText,
                          audienceScope === 'CITY_WIDE' && styles.composerChipTextSelected,
                        ]}
                      >
                        City-wide
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.composerChip,
                        audienceScope === 'ACCOMMODATION_ONLY' && styles.composerChipSelected,
                      ]}
                      onPress={() => onChangeAudienceScope('ACCOMMODATION_ONLY')}
                    >
                      <Text
                        style={[
                          styles.composerChipText,
                          audienceScope === 'ACCOMMODATION_ONLY' && styles.composerChipTextSelected,
                        ]}
                      >
                        Accommodation only
                      </Text>
                    </Pressable>
                  </View>

                  {isAccommodationOnly ? (
                    <>
                      <Text style={styles.composerLabel}>Accommodation ID *</Text>
                      <TextInput
                        style={styles.composerInput}
                        keyboardType="number-pad"
                        placeholder="1001"
                        placeholderTextColor={colors.textTertiary}
                        value={accommodationId}
                        onChangeText={onChangeAccommodationId}
                      />

                      <Text style={styles.composerLabel}>Audience Start Date *</Text>
                      <TextInput
                        style={styles.composerInput}
                        placeholder="2026-05-01"
                        placeholderTextColor={colors.textTertiary}
                        value={audienceStartDate}
                        onChangeText={onChangeAudienceStartDate}
                      />

                      <Text style={styles.composerLabel}>Audience End Date *</Text>
                      <TextInput
                        style={styles.composerInput}
                        placeholder="2026-05-10"
                        placeholderTextColor={colors.textTertiary}
                        value={audienceEndDate}
                        onChangeText={onChangeAudienceEndDate}
                      />
                    </>
                  ) : null}
                </>
              ) : null}
              </View>
            </ScrollView>

            <View style={styles.fullModalFooter}>
              <Pressable onPress={onClose} style={styles.footerCloseButton}>
                <Text style={styles.footerCloseButtonText}>Close</Text>
              </Pressable>
              <Pressable onPress={onSubmit} disabled={submitting} style={styles.footerPrimaryButton}>
                {submitting ? (
                  <ActivityIndicator color={colors.semantic.white} />
                ) : (
                  <Text style={styles.footerPrimaryButtonText}>Publish</Text>
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

type CreatePostTypeModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: PostType) => void;
};

function CreatePostTypeModal({ visible, onClose, onSelectType }: CreatePostTypeModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.fullModalRoot}>
          <View style={styles.fullModalFrame}>
            <View style={styles.fullModalHeader}>
              <Text style={styles.fullModalTitle}>Choose Post Type</Text>
            </View>
            <Text style={styles.composerDescription}>Select the format that matches what you want to share.</Text>

            <View style={styles.typeSelectWrap}>
              <Pressable style={styles.typeSelectCard} onPress={() => onSelectType('FREE_FEED')}>
                <Text style={styles.typeSelectTitle}>Free Feed</Text>
                <Text style={styles.typeSelectDescription}>Share your daily moments, thoughts, and local tips.</Text>
              </Pressable>

              <Pressable style={styles.typeSelectCard} onPress={() => onSelectType('GATHERING')}>
                <Text style={styles.typeSelectTitle}>Gathering</Text>
                <Text style={styles.typeSelectDescription}>Create a meetup with place, time, and participant rules.</Text>
              </Pressable>
            </View>

            <View style={styles.fullModalFooter}>
              <Pressable onPress={onClose} style={styles.footerCloseButton}>
                <Text style={styles.footerCloseButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

type LocationPillProps = {
  flag: string;
  countryName: string;
  cityName: string;
  onPress: () => void;
};

function LocationPill({ flag, countryName, cityName, onPress }: LocationPillProps) {
  return (
    <View style={styles.locationPillWrap}>
      <Pressable onPressIn={triggerTapHaptic} onPress={onPress} style={styles.locationPill}>
        <Text style={styles.locationPillText}>
          {flag} {countryName} / {cityName}
        </Text>
        <View style={styles.locationEditButton}>
          <Text style={styles.locationEditButtonText}>Edit Location</Text>
        </View>
      </Pressable>
    </View>
  );
}

type MyStayCardProps = {
  stay: StayInfo | null;
  companions: StayCompanion[];
  expanded: boolean;
  onToggle: () => void;
  onRegisterPress: () => void;
};

function MyStayCard({ stay, companions, expanded, onToggle, onRegisterPress }: MyStayCardProps) {
  if (!stay) {
    return (
      <View style={styles.stayCardEmpty}>
        <Text style={styles.stayTitle}>My Stay</Text>
        <Text style={styles.stayDescription}>You have not registered an accommodation yet.</Text>
        <Pressable onPressIn={triggerTapHaptic} onPress={onRegisterPress} style={styles.primaryActionButton}>
          <Text style={styles.primaryActionButtonText}>Register accommodation</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.stayCard}>
      <Pressable onPressIn={triggerTapHaptic} onPress={onToggle} style={styles.stayHeaderRow}>
        <View>
          <Text style={styles.stayTitle}>My Stay</Text>
          <Text style={styles.stayAccommodationName}>{stay.accommodationName}</Text>
        </View>
        <Text style={[styles.stayChevron, !expanded && styles.stayChevronCollapsed]}>⌃</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.stayDetailBox}>
          <StayInfoRow label="Room" value={stay.roomType} />
          <StayInfoRow label="Check-in" value={stay.checkIn} />
          <StayInfoRow label="Check-out" value={stay.checkOut} />

          <View style={styles.stayCompanionSection}>
            <Text style={styles.stayCompanionTitle}>Staying on the same dates</Text>
            {companions.length > 0 ? (
              <AvatarStack companions={companions} />
            ) : (
              <Text style={styles.stayCompanionEmpty}>No overlapping stays yet.</Text>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

type LocationPickerModalProps = {
  visible: boolean;
  countries: CountryOption[];
  selectedCountryCode: string;
  selectedCityCode: string;
  onClose: () => void;
  onApply: (countryCode: string, cityCode: string) => void;
};

function LocationPickerModal({
  visible,
  countries,
  selectedCountryCode,
  selectedCityCode,
  onClose,
  onApply,
}: LocationPickerModalProps) {
  const [step, setStep] = useState<'COUNTRY' | 'CITY'>('COUNTRY');
  const [draftCountryCode, setDraftCountryCode] = useState(selectedCountryCode);
  const [draftCityCode, setDraftCityCode] = useState(selectedCityCode);
  const selectedCountry = countries.find(country => country.code === draftCountryCode) ?? countries[0];
  const isCountryStep = step === 'COUNTRY';

  useEffect(() => {
    if (visible) {
      setStep('COUNTRY');
      setDraftCountryCode(selectedCountryCode);
      setDraftCityCode(selectedCityCode);
    }
  }, [visible, selectedCountryCode, selectedCityCode]);

  const handlePrimaryAction = () => {
    triggerTapHaptic();
    if (isCountryStep) {
      setStep('CITY');
      return;
    }
    onApply(draftCountryCode, draftCityCode);
  };

  return (
    <Modal animationType="fade" transparent={false} visible={visible} onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.fullModalRoot}>
          <View style={styles.fullModalFrame}>
            <View style={styles.fullModalHeader}>
              <Text style={styles.fullModalTitle}>{isCountryStep ? 'Select Country' : 'Select City'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.fullModalContent} showsVerticalScrollIndicator={false}>
              {isCountryStep ? (
                <View style={styles.countryGrid}>
                  {countries.map(country => {
                    const selected = country.code === draftCountryCode;
                    return (
                      <Pressable
                        key={country.code}
                        onPressIn={triggerTapHaptic}
                        onPress={() => {
                          setDraftCountryCode(country.code);
                          const firstCityCode = country.cities[0]?.code ?? draftCityCode;
                          setDraftCityCode(firstCityCode);
                        }}
                        style={[styles.countryCard, selected && styles.countryCardSelected]}
                      >
                        <Text style={styles.countryFlag}>{country.flag}</Text>
                        <Text style={[styles.countryName, selected && styles.countryNameSelected]}>
                          {country.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <>
                  <View style={styles.cityHeaderRow}>
                    <Text style={styles.citySectionTitle}>
                      {selectedCountry.flag} {selectedCountry.name}
                    </Text>
                    <Pressable
                      onPressIn={triggerTapHaptic}
                      onPress={() => setStep('COUNTRY')}
                      style={styles.backButton}
                    >
                      <Text style={styles.backButtonText}>Change Country</Text>
                    </Pressable>
                  </View>
                  <View style={styles.cityWrap}>
                    {selectedCountry.cities.map(city => {
                      const selected = city.code === draftCityCode;
                      return (
                        <Pressable
                          key={city.code}
                          onPressIn={triggerTapHaptic}
                          onPress={() => setDraftCityCode(city.code)}
                          style={[styles.cityChip, selected && styles.cityChipSelected]}
                        >
                          <Text style={[styles.cityChipText, selected && styles.cityChipTextSelected]}>
                            {city.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.fullModalFooter}>
              <Pressable onPressIn={triggerTapHaptic} onPress={onClose} style={styles.footerCloseButton}>
                <Text style={styles.footerCloseButtonText}>Close</Text>
              </Pressable>
              <Pressable onPress={handlePrimaryAction} style={styles.footerPrimaryButton}>
                <Text style={styles.footerPrimaryButtonText}>{isCountryStep ? 'Select City' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

type PostCardProps = {
  post: CommunityPost;
  isTablet: boolean;
  myStay: StayInfo | null;
  onPressJoin: () => void;
};

function PostCard({ post, isTablet, myStay, onPressJoin }: PostCardProps) {
  const isGathering = post.type === 'GATHERING';
  const isAccommodationAudience = post.audienceScope === 'ACCOMMODATION_ONLY';
  const isSameStayGathering =
    isGathering &&
    isAccommodationAudience &&
    !!myStay &&
    !!post.accommodationId &&
    post.accommodationId === myStay.accommodationId &&
    !!post.audienceStayStartDate &&
    !!post.audienceStayEndDate &&
    hasDateOverlap(myStay.checkIn, myStay.checkOut, post.audienceStayStartDate, post.audienceStayEndDate);
  const audienceLabel = isAccommodationAudience ? 'My accommodation only' : 'City-wide';
  const accommodationLabel =
    post.accommodationName ?? (post.accommodationId ? `Accommodation #${post.accommodationId}` : null);

  return (
    <View style={[styles.card, isTablet && styles.cardTablet]}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, isGathering ? styles.typeBadgeGathering : styles.typeBadgeFreeFeed]}>
          <Text
            style={[
              styles.typeBadgeText,
              isGathering ? styles.typeBadgeTextGathering : styles.typeBadgeTextFreeFeed,
            ]}
          >
            {isGathering ? 'Gathering' : 'Free Feed'}
          </Text>
        </View>
        <View style={styles.cardHeaderMeta}>
          {isSameStayGathering ? (
            <View style={styles.sameStayBadge}>
              <Text style={styles.sameStayBadgeText}>My Stay</Text>
            </View>
          ) : null}
          <Text style={styles.cityBadge}>{post.countryCode} · {post.cityCode}</Text>
        </View>
      </View>

      <Text style={styles.cardContent}>{post.content}</Text>

      {post.locationName ? <InfoRow label="Location" value={post.locationName} /> : null}
      {post.destination ? <InfoRow label="Destination" value={post.destination} /> : null}
      {post.meetingPlace ? <InfoRow label="Meet at" value={post.meetingPlace} /> : null}
      {post.meetingAt ? <InfoRow label="Time" value={post.meetingAt} /> : null}

      {isGathering && post.joinPolicy ? (
        <View style={styles.policyBox}>
          <View style={styles.policyLeftGroup}>
            <Text style={styles.policyText}>
              Join policy: {post.joinPolicy === 'APPROVAL' ? 'Approval required' : 'Free join'}
            </Text>
            <Text style={styles.policyAudienceText}>Audience: {audienceLabel}</Text>
          </View>
          <View style={styles.policyRightGroup}>
            {accommodationLabel ? <Text style={styles.policyAccommodation}>{accommodationLabel}</Text> : null}
            {post.maxParticipants ? <Text style={styles.policyMeta}>Max {post.maxParticipants}</Text> : null}
            <Pressable onPress={onPressJoin} style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

type StayInfoRowProps = {
  label: string;
  value: string;
};

function StayInfoRow({ label, value }: StayInfoRowProps) {
  return (
    <View style={styles.stayInfoRow}>
      <Text style={styles.stayInfoLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.stayInfoValue}>
        {value}
      </Text>
    </View>
  );
}

function AvatarStack({ companions }: { companions: StayCompanion[] }) {
  const visibleCompanions = companions.slice(0, 5);
  const extraCount = Math.max(companions.length - visibleCompanions.length, 0);

  return (
    <View style={styles.avatarStackRow}>
      {visibleCompanions.map((companion, index) => (
        <View
          key={companion.id}
          style={[
            styles.avatarRing,
            index > 0 && styles.avatarOverlap,
            { zIndex: 50 - index },
          ]}
        >
          {companion.profileImageUrl ? (
            <Image source={{ uri: companion.profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{companion.name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </View>
      ))}

      {extraCount > 0 ? (
        <View style={[styles.avatarRing, styles.avatarOverlap, styles.avatarMoreBadge]}>
          <Text style={styles.avatarMoreText}>+{extraCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  locationPillWrap: {
    alignItems: 'center',
    marginTop: spacing[6],
    marginBottom: spacing[12],
  },
  locationPill: {
    minHeight: 50,
    width: '100%',
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[14],
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: spacing[8],
    shadowOffset: { width: 0, height: spacing[4] },
  },
  locationPillText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  locationEditIcon: {
    color: colors.primary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  stayChevron: {
    color: colors.semantic.white,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  stayChevronCollapsed: {
    transform: [{ rotate: '180deg' }],
  },
  locationEditButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[6],
  },
  locationEditButtonText: {
    color: colors.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  stayCard: {
    backgroundColor: colors.primary,
    borderRadius: spacing[16],
    padding: spacing[14],
    marginBottom: spacing[12],
    overflow: 'hidden',
  },
  stayCardEmpty: {
    backgroundColor: colors.surface,
    borderRadius: spacing[16],
    padding: spacing[14],
    marginBottom: spacing[12],
  },
  stayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stayTitle: {
    fontSize: typography.size.sm,
    color: '#D8DBFF',
    marginBottom: spacing[4],
  },
  stayAccommodationName: {
    fontSize: typography.size.lg,
    color: colors.semantic.white,
    fontWeight: typography.weight.bold,
  },
  stayDescription: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    marginBottom: spacing[12],
  },
  stayDetailBox: {
    marginTop: spacing[10],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.26)',
    paddingTop: spacing[10],
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing[10],
    paddingVertical: spacing[10],
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: colors.semantic.white,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing[8],
    marginBottom: spacing[14],
  },
  filterChip: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
    borderRadius: 999,
    backgroundColor: colors.semantic.alternative,
  },
  filterChipActive: {
    backgroundColor: colors.primarySoft,
  },
  filterText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primary,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[20],
  },
  stateText: {
    marginTop: spacing[10],
    color: colors.textSecondary,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    textAlign: 'center',
  },
  errorTitle: {
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
  },
  errorMessage: {
    marginTop: spacing[8],
    color: colors.danger,
    textAlign: 'center',
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  retryButton: {
    marginTop: spacing[14],
    backgroundColor: colors.textPrimary,
    borderRadius: spacing[10],
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[14],
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  listContent: {
    paddingBottom: spacing[20],
  },
  columnWrapper: {
    gap: spacing[10],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing[16],
    padding: spacing[14],
    marginBottom: spacing[10],
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: spacing[10],
    shadowOffset: { width: 0, height: spacing[4] },
  },
  cardTablet: {
    flex: 1,
    marginBottom: spacing[12],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  cardHeaderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
  },
  sameStayBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
  },
  sameStayBadgeText: {
    color: colors.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[4],
  },
  typeBadgeGathering: {
    backgroundColor: colors.primarySoft,
  },
  typeBadgeFreeFeed: {
    backgroundColor: '#F3E8FF',
  },
  typeBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.extrabold,
  },
  typeBadgeTextGathering: {
    color: colors.gathering,
  },
  typeBadgeTextFreeFeed: {
    color: colors.freeFeed,
  },
  cityBadge: {
    color: colors.textTertiary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  cardContent: {
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    marginBottom: spacing[10],
  },
  stayInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  stayInfoLabel: {
    width: 84,
    color: '#D8DBFF',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  stayInfoValue: {
    flex: 1,
    color: colors.semantic.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  stayCompanionSection: {
    marginTop: spacing[12],
  },
  stayCompanionTitle: {
    color: '#D8DBFF',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[8],
  },
  stayCompanionEmpty: {
    color: colors.semantic.white,
    fontSize: typography.size.sm,
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing[2],
  },
  avatarRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.semantic.white,
    backgroundColor: colors.semantic.white,
    overflow: 'hidden',
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: colors.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  avatarMoreBadge: {
    backgroundColor: '#D8DBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMoreText: {
    color: colors.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  infoLabel: {
    width: 84,
    color: colors.textTertiary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  infoValue: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.size.xs,
  },
  policyBox: {
    marginTop: spacing[8],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[8],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  policyLeftGroup: {
    flex: 1,
    paddingRight: spacing[10],
  },
  policyRightGroup: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  joinButton: {
    marginTop: spacing[6],
    borderRadius: spacing[8],
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[6],
  },
  joinButtonText: {
    color: colors.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  policyText: {
    color: colors.textSecondary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  policyAudienceText: {
    marginTop: spacing[2],
    color: colors.textTertiary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  policyAccommodation: {
    color: colors.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  policyMeta: {
    color: colors.success,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  fullModalRoot: {
    flex: 1,
    backgroundColor: colors.semantic.white,
    paddingTop: spacing[8],
  },
  fullModalFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: layoutTokens.horizontalGutter,
  },
  fullModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[14],
  },
  fullModalTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.extrabold,
  },
  closeButton: {
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[6],
    borderRadius: 999,
    backgroundColor: colors.semantic.alternative,
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xs,
  },
  fullModalContent: {
    paddingBottom: spacing[24],
  },
  composerFieldWrap: {
    paddingTop: spacing[8],
  },
  composerScroll: {
    flex: 1,
  },
  composerScrollContent: {
    paddingBottom: spacing[16],
  },
  composerDescription: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    marginBottom: spacing[14],
  },
  typeSelectWrap: {
    gap: spacing[10],
    marginTop: spacing[10],
    flex: 1,
  },
  typeSelectCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: spacing[14],
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[14],
  },
  typeSelectTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing[4],
  },
  typeSelectDescription: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  composerLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[6],
  },
  composerChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    marginBottom: spacing[12],
  },
  composerChip: {
    borderRadius: 999,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    backgroundColor: colors.semantic.alternative,
  },
  composerChipSelected: {
    backgroundColor: colors.primarySoft,
  },
  composerChipText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  composerChipTextSelected: {
    color: colors.primary,
  },
  composerInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: spacing[10],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[10],
    color: colors.textPrimary,
    fontSize: typography.size.md,
    marginBottom: spacing[12],
  },
  composerContentInput: {
    minHeight: 140,
  },
  fullModalFooter: {
    paddingTop: spacing[10],
    paddingBottom: spacing[16],
    gap: spacing[8],
  },
  footerCloseButton: {
    minHeight: 48,
    borderRadius: spacing[14],
    backgroundColor: colors.semantic.alternative,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCloseButtonText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  footerPrimaryButton: {
    minHeight: 52,
    borderRadius: spacing[14],
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryButtonText: {
    color: colors.semantic.white,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  cityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[10],
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing[10],
  },
  countryCard: {
    width: '31%',
    minHeight: 92,
    borderRadius: spacing[14],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    gap: spacing[4],
  },
  countryCardSelected: {
    backgroundColor: colors.primarySoft,
  },
  countryFlag: {
    fontSize: 22,
  },
  countryName: {
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
  countryNameSelected: {
    color: colors.primary,
  },
  citySectionTitle: {
    marginTop: spacing[6],
    marginBottom: spacing[4],
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  backButton: {
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[6],
    borderRadius: 999,
    backgroundColor: colors.semantic.assistive,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.xs,
  },
  cityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  cityChip: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: 999,
    backgroundColor: colors.semantic.alternative,
  },
  cityChipSelected: {
    backgroundColor: colors.primarySoft,
  },
  cityChipText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  cityChipTextSelected: {
    color: colors.primary,
  },
  writeFab: {
    position: 'absolute',
    right: spacing[16],
    bottom: spacing[20],
    minHeight: 48,
    paddingHorizontal: spacing[16],
    borderRadius: 999,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    gap: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: spacing[8],
    shadowOffset: { width: 0, height: spacing[4] },
    elevation: 5,
  },
  writeFabText: {
    color: colors.semantic.white,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
});
