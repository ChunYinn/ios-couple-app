import Ionicons from "@expo/vector-icons/Ionicons";
import {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Switch, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

import { CuteCard } from "../../components/CuteCard";
import { CuteText } from "../../components/CuteText";
import { Screen } from "../../components/Screen";
import { usePalette } from "../../hooks/usePalette";
import { CuteTextInput } from "../../components/CuteTextInput";
import { CuteButton } from "../../components/CuteButton";
import { CuteModal } from "../../components/CuteModal";
import { DatePickerSheet } from "../../components/DatePickerSheet";
import { useAppData } from "../../context/AppDataContext";
import { calendarService } from "../../firebase/services";
import { timestampToDate } from "../../firebase/types";

type ViewMode = "year" | "month" | "day";
type CoupleCalendar = "together" | "hers" | "his";

type SharedEvent = {
  id: string;
  title: string;
  calendar: CoupleCalendar;
  start: Date;
  end: Date;
  location?: string;
  allDay?: boolean;
  notes?: string;
  createdBy?: string;
};

type MarkedDates = Record<
  string,
  {
    dots?: { key: string; color: string }[];
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
  }
>;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
  { id: "day", label: "Day" },
];

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const HOUR_HEIGHT = 48;
const MIN_EVENT_HEIGHT = 40;
const STRIP_LENGTH = 21;
const STRIP_HALF = Math.floor(STRIP_LENGTH / 2);

const pad = (value: number) => value.toString().padStart(2, "0");
const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const applyAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const chunk =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const bigint = parseInt(chunk, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatLongDate = (date: Date) => {
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const month = MONTH_NAMES[date.getMonth()];
  return `${weekday}, ${month} ${date.getDate()}`;
};

const formatHour = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const withMinutes = minutes === 0 ? "" : `:${pad(minutes)}`;
  return `${displayHour}${withMinutes} ${suffix}`;
};

const formatHourLabel = (hour: number) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
};

const formatTimeRange = (start: Date, end: Date) =>
  `${formatHour(start)} – ${formatHour(end)}`;

const formatDateTimeLabel = (date: Date, includeTime = true) => {
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (!includeTime) {
    return dateLabel;
  }
  return `${dateLabel} · ${formatHour(date)}`;
};

const buildMockEvents = (anchorYear: number): SharedEvent[] => [
  {
    id: "coffee-date",
    title: "Sunrise coffee ritual",
    calendar: "together",
    start: new Date(anchorYear, 9, 26, 7, 30),
    end: new Date(anchorYear, 9, 26, 8, 30),
    location: "Little Finch Cafe",
  },
  {
    id: "painting",
    title: "She · Studio painting night",
    calendar: "hers",
    start: new Date(anchorYear, 9, 26, 19, 0),
    end: new Date(anchorYear, 9, 26, 21, 0),
    location: "Art District Loft",
  },
  {
    id: "gaming",
    title: "He · Game session",
    calendar: "his",
    start: new Date(anchorYear, 9, 26, 12, 0),
    end: new Date(anchorYear, 9, 26, 13, 0),
    location: "Home",
  },
  {
    id: "dinner",
    title: "Together · Italian date night",
    calendar: "together",
    start: new Date(anchorYear, 9, 26, 19, 0),
    end: new Date(anchorYear, 9, 26, 20, 30),
    location: "Monarch & Vine",
  },
  {
    id: "boxing",
    title: "He · Boxing class",
    calendar: "his",
    start: new Date(anchorYear, 9, 27, 6, 30),
    end: new Date(anchorYear, 9, 27, 7, 45),
    location: "Dogpatch Gym",
  },
  {
    id: "therapy",
    title: "She · Therapy",
    calendar: "hers",
    start: new Date(anchorYear, 9, 27, 17, 0),
    end: new Date(anchorYear, 9, 27, 18, 0),
  },
  {
    id: "future-planning",
    title: "Anniversary scouting trip",
    calendar: "together",
    start: new Date(anchorYear, 10, 24, 10, 0),
    end: new Date(anchorYear, 10, 24, 14, 0),
    location: "Lake Como (virtual)",
  },
];

const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;

type EventDraft = {
  title: string;
  calendar: CoupleCalendar;
  start: Date;
  end: Date;
  notes: string;
  allDay: boolean;
};

const createDraftFromDate = (baseDate: Date): EventDraft => {
  const start = new Date(baseDate);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS);
  return {
    title: "",
    calendar: "together" as CoupleCalendar,
    start,
    end,
    notes: "",
    allDay: false,
  };
};

export default function CalendarScreen() {
  const {
    state: {
      auth: { user },
      pairing,
    },
  } = useAppData();
  const palette = usePalette();
  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [yearViewYear, setYearViewYear] = useState(today.getFullYear());
  const [stripStartDate, setStripStartDate] = useState(
    () => addDays(today, -STRIP_HALF)
  );
  const dayStripRef = useRef<ScrollView | null>(null);
  const coupleId = pairing.coupleId ?? user.coupleId ?? null;
  const myUid = user.uid;
  const [cloudEvents, setCloudEvents] = useState<SharedEvent[]>([]);
  const [isSyncingEvents, setIsSyncingEvents] = useState(false);
  const [composerVisible, setComposerVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<null | "start" | "end">(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [eventDraft, setEventDraft] = useState(() => createDraftFromDate(today));

  const mockEvents = useMemo(
    () => buildMockEvents(today.getFullYear()),
    [today]
  );

  const coupleCalendars = useMemo(
    () => [
      { id: "together" as CoupleCalendar, label: "Shared", color: "#e6e6fa" },
      { id: "his" as CoupleCalendar, label: "Me", color: "#ffb3a7" },
      { id: "hers" as CoupleCalendar, label: "Partner", color: "#a7c7e7" },
    ],
    []
  );

  const calendarColorMap = useMemo(() => {
    return coupleCalendars.reduce(
      (acc, calendar) => {
        acc[calendar.id] = calendar;
        return acc;
      },
      {} as Record<CoupleCalendar, { label: string; color: string }>
    );
  }, [coupleCalendars]);

  const effectiveEvents = coupleId ? cloudEvents : mockEvents;

  const eventsByDate = useMemo(() => {
    const map: Record<string, SharedEvent[]> = {};
    effectiveEvents.forEach((event) => {
      let cursor = startOfDay(event.start);
      const lastDay = startOfDay(event.end);
      while (cursor <= lastDay) {
        const key = formatDateKey(cursor);
        map[key] = map[key] ? [...map[key], event] : [event];
        cursor = addDays(cursor, 1);
      }
    });
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.start.getTime() - b.start.getTime());
    });
    return map;
  }, [effectiveEvents]);

  const eventsByMonth = useMemo(() => {
    const summary: Record<string, number> = {};
    Object.entries(eventsByDate).forEach(([key, events]) => {
      const monthKey = key.slice(0, 7);
      summary[monthKey] = (summary[monthKey] ?? 0) + events.length;
    });
    return summary;
  }, [eventsByDate]);

  const selectedDateKey = formatDateKey(selectedDate);
  const dayEvents = eventsByDate[selectedDateKey] ?? [];
  const allDayEvents = dayEvents.filter((event) => event.allDay);
  const timedEvents = dayEvents.filter((event) => !event.allDay);
  const isOnToday = selectedDateKey === todayKey;

  useEffect(() => {
    const startTime = stripStartDate.getTime();
    const endTime = addDays(stripStartDate, STRIP_LENGTH - 1).getTime();
    const selectedTime = selectedDate.getTime();
    if (selectedTime < startTime || selectedTime > endTime) {
      setStripStartDate(addDays(selectedDate, -STRIP_HALF));
    }
  }, [selectedDate, stripStartDate]);

  useEffect(() => {
    if (viewMode === "day") {
      dayStripRef.current?.scrollTo({
        x: (STRIP_HALF - 2) * 72,
        animated: true,
      });
    }
  }, [stripStartDate, viewMode]);

  useEffect(() => {
    if (!coupleId) {
      setCloudEvents([]);
      return;
    }
    setIsSyncingEvents(true);
    const unsubscribe = calendarService.subscribeToEvents(
      coupleId,
      (items) => {
        const mapped: SharedEvent[] = items.map((event) => ({
          id: event.id ?? "",
          title: event.title,
          calendar: (event.owner ?? "together") as CoupleCalendar,
          start: timestampToDate(event.startAt),
          end: timestampToDate(event.endAt),
          location: event.location ?? undefined,
          allDay: Boolean(event.allDay),
          notes: event.notes ?? undefined,
          createdBy: event.createdBy,
        }));
        setCloudEvents(mapped);
        setIsSyncingEvents(false);
      },
      (error) => {
        console.error("Calendar subscription failed", error);
        setIsSyncingEvents(false);
      }
    );
    return unsubscribe;
  }, [coupleId]);

  const stripDays = useMemo(() => {
    return Array.from({ length: STRIP_LENGTH }, (_, index) => {
      const date = addDays(stripStartDate, index);
      return {
        key: formatDateKey(date),
        date,
        dayLabel: date.toLocaleDateString(undefined, { weekday: "short" }),
        dayNumber: date.getDate(),
        isToday: formatDateKey(date) === todayKey,
        isSelected: formatDateKey(date) === selectedDateKey,
      };
    });
  }, [stripStartDate, todayKey, selectedDateKey]);

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};
    Object.entries(eventsByDate).forEach(([dateKey, events]) => {
      const dots = Array.from(new Set(events.map((event) => event.calendar))).map(
        (calendarId) => ({
          key: calendarId,
          color: calendarColorMap[calendarId].color,
        })
      );
      marks[dateKey] = {
        dots: dots.slice(0, 3),
      };
    });
    const currentSelection = marks[selectedDateKey] ?? {};
    marks[selectedDateKey] = {
      ...currentSelection,
      selected: true,
      selectedColor: "#e94971",
      selectedTextColor: "#fff",
    };
    return marks;
  }, [eventsByDate, calendarColorMap, selectedDateKey]);

  const monthLabel =
    viewMode === "month"
      ? `${MONTH_NAMES[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`
      : `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: palette.card,
      calendarBackground: palette.card,
      textSectionTitleColor: palette.textSecondary,
      monthTextColor: palette.text,
      textDayFontWeight: "600",
      textMonthFontWeight: "800",
      textDayHeaderFontWeight: "700",
      todayTextColor: "#e94971",
      dayTextColor: palette.text,
      textDisabledColor: `${palette.textSecondary}66`,
      selectedDayBackgroundColor: "#e94971",
      selectedDayTextColor: "#fff",
      dotColor: "#e94971",
      selectedDotColor: "#fff",
      arrowColor: palette.text,
    }),
    [palette]
  );

  const plansLabel = dayEvents.length
    ? `${dayEvents.length} plan${dayEvents.length > 1 ? "s" : ""}`
    : "No plans yet";

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === "year") {
      setYearViewYear(selectedDate.getFullYear());
    }
  };

  const handleGoToday = () => {
    setSelectedDate(today);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setYearViewYear(today.getFullYear());
    setViewMode("day");
  };

  const handleCalendarDayPress = (day: DateData) => {
    const next = new Date(day.year, day.month - 1, day.day);
    setSelectedDate(next);
    setVisibleMonth(new Date(day.year, day.month - 1, 1));
    setViewMode("day");
  };

  const openComposer = () => {
    if (!coupleId || !myUid) {
      Alert.alert(
        "Pair required",
        "Pair with your partner to start adding shared schedules."
      );
      return;
    }
    setEventDraft(createDraftFromDate(selectedDate));
    setComposerError(null);
    setComposerVisible(true);
  };

  const closeComposer = () => {
    setComposerVisible(false);
    setActivePicker(null);
  };

  const handlePickerChange =
    (type: "start" | "end") => (_event: unknown, date?: Date) => {
      if (!date) return;
      setEventDraft((prev) => {
        if (type === "start") {
          const adjustedEnd =
            date >= prev.end
              ? new Date(date.getTime() + DEFAULT_EVENT_DURATION_MS)
              : prev.end;
          return {
            ...prev,
            start: date,
            end: adjustedEnd,
          };
        }
        if (date <= prev.start) {
          return {
            ...prev,
            end: new Date(prev.start.getTime() + DEFAULT_EVENT_DURATION_MS),
          };
        }
        return { ...prev, end: date };
      });
    };

  const handleToggleAllDay = (value: boolean) => {
    setEventDraft((prev) => {
      if (value) {
        const dayStart = startOfDay(prev.start);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 0, 0);
        return { ...prev, allDay: true, start: dayStart, end: dayEnd };
      }
      return { ...prev, allDay: false };
    });
  };

  const openPicker = (type: "start" | "end") => {
    if (Platform.OS === "android") {
      const currentValue = type === "start" ? eventDraft.start : eventDraft.end;
      DateTimePickerAndroid.open({
        mode: "date",
        value: currentValue,
        onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
          if (event.type !== "set" || !selectedDate) {
            return;
          }
          const nextDate = new Date(selectedDate);
          if (eventDraft.allDay) {
            handlePickerChange(type)(null, nextDate);
            return;
          }
          DateTimePickerAndroid.open({
            mode: "time",
            value: currentValue,
            onChange: (timeEvent, timeDate) => {
              if (timeEvent.type !== "set" || !timeDate) {
                return;
              }
              nextDate.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
              handlePickerChange(type)(null, nextDate);
            },
            is24Hour: false,
          });
        },
      });
      return;
    }
    setActivePicker(type);
  };

  const handleSaveEvent = async () => {
    if (!coupleId || !myUid) {
      Alert.alert(
        "Pair required",
        "Pair with your partner to save shared schedules."
      );
      return;
    }
    if (!eventDraft.title.trim()) {
      setComposerError("Give this plan a name so both of you recognize it.");
      return;
    }
    if (eventDraft.end <= eventDraft.start) {
      setComposerError("End time must be after the start time.");
      return;
    }
    setIsSavingEvent(true);
    try {
      await calendarService.addEvent(coupleId, {
        title: eventDraft.title.trim(),
        owner: eventDraft.calendar,
        startAt: eventDraft.start,
        endAt: eventDraft.end,
        notes: eventDraft.notes?.trim() || undefined,
        allDay: eventDraft.allDay,
        createdBy: myUid,
      });
      closeComposer();
      setEventDraft(createDraftFromDate(selectedDate));
    } catch (error) {
      console.error("Unable to save calendar event", error);
      setComposerError("We couldn't save that schedule. Please try again.");
    } finally {
      setIsSavingEvent(false);
    }
  };


  const renderDayStrip = () => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20 }}>
      <Pressable
        onPress={() =>
          setStripStartDate((start) => {
            const next = addDays(start, -7);
            setSelectedDate(next);
            return next;
          })
        }
        style={{
          width: 34,
          height: 60,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: applyAlpha(palette.textSecondary, 0.12),
        }}
      >
        <Ionicons name="chevron-back" size={18} color={palette.text} />
      </Pressable>
      <ScrollView
        ref={dayStripRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {stripDays.map((day) => (
          <Pressable
            key={day.key}
            onPress={() => setSelectedDate(day.date)}
            style={{
              width: 60,
              paddingVertical: 12,
              borderRadius: 16,
              alignItems: "center",
              backgroundColor: day.isSelected
                ? "#ff6b6b"
                : applyAlpha(palette.textSecondary, 0.12),
              shadowColor: day.isSelected ? "#ff6b6b" : "transparent",
              shadowOpacity: day.isSelected ? 0.35 : 0,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
          >
            <CuteText
              tone="muted"
              style={{
                color: day.isSelected ? "#fff" : undefined,
                fontSize: 12,
              }}
            >
              {day.dayLabel}
            </CuteText>
            <CuteText
              weight="bold"
              style={{ fontSize: 18, color: day.isSelected ? "#fff" : palette.text }}
            >
              {day.dayNumber}
            </CuteText>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        onPress={() =>
          setStripStartDate((start) => {
            const next = addDays(start, 7);
            setSelectedDate(next);
            return next;
          })
        }
        style={{
          width: 34,
          height: 60,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: applyAlpha(palette.textSecondary, 0.12),
        }}
      >
        <Ionicons name="chevron-forward" size={18} color={palette.text} />
      </Pressable>
    </View>
  );

  const renderMonthCalendar = () => (
    <CuteCard padding={0} style={{ borderRadius: 28, overflow: "hidden", marginHorizontal: 20 }}>
      <Calendar
        current={formatDateKey(visibleMonth)}
        hideExtraDays
        enableSwipeMonths
        onDayPress={handleCalendarDayPress}
        onMonthChange={(month) =>
          setVisibleMonth(new Date(month.year, month.month - 1, 1))
        }
        markedDates={markedDates}
        markingType="multi-dot"
        theme={calendarTheme}
      />
    </CuteCard>
  );

  const renderDaySummary = () => (
    <View style={{ gap: 8, paddingHorizontal: 20 }}>
      <CuteText weight="bold" style={{ fontSize: 28 }}>
        {formatLongDate(selectedDate)}
      </CuteText>
      <CuteText tone="muted">{plansLabel}</CuteText>
    </View>
  );

  const renderAllDayCard = () => {
    if (!allDayEvents.length) return null;
    return (
      <CuteCard padding={18} style={{ gap: 12, marginHorizontal: 20 }}>
        <CuteText weight="bold">All-day plans</CuteText>
        {allDayEvents.map((event) => {
          const calendar = calendarColorMap[event.calendar];
          return (
            <View
              key={event.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderRadius: 16,
                backgroundColor: applyAlpha(calendar.color, 0.25),
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fff",
                }}
              >
                <Ionicons
                  name="infinite-outline"
                  size={20}
                  color={calendar.color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <CuteText weight="bold">{event.title}</CuteText>
                {event.location && (
                  <CuteText tone="muted" style={{ fontSize: 13 }}>
                    {event.location}
                  </CuteText>
                )}
              </View>
            </View>
          );
        })}
      </CuteCard>
    );
  };

  const renderTimelineCard = () => {
    if (!timedEvents.length) {
      return (
        <CuteCard padding={24} style={{ marginHorizontal: 20, alignItems: "center", gap: 8 }}>
          <Ionicons
            name="sparkles-outline"
            size={40}
            color={applyAlpha(palette.textSecondary, 0.6)}
          />
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            No timed plans on this day
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            Add a shared moment to fill this timeline with memories.
          </CuteText>
        </CuteCard>
      );
    }

    return (
      <CuteCard padding={0} style={{ marginHorizontal: 20, overflow: "hidden" }}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: 72, backgroundColor: palette.card }}>
            {HOURS.map((hour) => (
              <View
                key={hour}
                style={{
                  height: HOUR_HEIGHT,
                  justifyContent: "flex-start",
                  paddingTop: 6,
                  paddingHorizontal: 12,
                  borderBottomWidth: hour === 23 ? 0 : 1,
                  borderBottomColor: palette.border,
                }}
              >
                <CuteText tone="muted" style={{ fontSize: 12 }}>
                  {formatHourLabel(hour)}
                </CuteText>
              </View>
            ))}
          </View>
          <View style={{ flex: 1, position: "relative" }}>
            {HOURS.map((hour) => (
              <View
                key={`row-${hour}`}
                style={{
                  height: HOUR_HEIGHT,
                  borderBottomWidth: hour === 23 ? 0 : 1,
                  borderBottomColor: applyAlpha(palette.border, 0.9),
                }}
              />
            ))}
            {timedEvents.map((event) => {
              const calendar = calendarColorMap[event.calendar];
              const dayStart = startOfDay(selectedDate);
              const dayEnd = addDays(dayStart, 1);
              const clampedStart =
                event.start < dayStart ? dayStart : event.start;
              const clampedEnd = event.end > dayEnd ? dayEnd : event.end;
              const durationMinutes =
                (clampedEnd.getTime() - clampedStart.getTime()) / 60000;
              if (durationMinutes <= 0) return null;
              const offsetMinutes =
                (clampedStart.getTime() - dayStart.getTime()) / 60000;
              const top = (offsetMinutes / 60) * HOUR_HEIGHT;
              const height = Math.max(
                MIN_EVENT_HEIGHT,
                (durationMinutes / 60) * HOUR_HEIGHT
              );

              return (
                <View
                  key={event.id}
                  style={{
                    position: "absolute",
                    left: 12,
                    right: 12,
                    top,
                    height,
                    borderRadius: 18,
                    padding: 12,
                    backgroundColor: applyAlpha(calendar.color, 0.3),
                    borderWidth: 1,
                    borderColor: calendar.color,
                    gap: 4,
                  }}
                >
                  <CuteText weight="bold">{event.title}</CuteText>
                  <CuteText tone="muted" style={{ fontSize: 12 }}>
                    {formatTimeRange(clampedStart, clampedEnd)}
                  </CuteText>
                  {event.location && (
                    <CuteText tone="muted" style={{ fontSize: 12 }}>
                      {event.location}
                    </CuteText>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </CuteCard>
    );
  };

  const renderLegend = () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginHorizontal: 20 }}>
      {coupleCalendars.map((calendar) => (
        <View
          key={calendar.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: applyAlpha(calendar.color, 0.25),
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: calendar.color,
            }}
          />
          <CuteText weight="medium" style={{ fontSize: 13 }}>
            {calendar.label}
          </CuteText>
        </View>
      ))}
    </View>
  );

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, index) => {
      const key = `${yearViewYear}-${pad(index + 1)}`;
      return {
        index,
        label: MONTH_NAMES[index].slice(0, 3),
        eventCount: eventsByMonth[key] ?? 0,
        isSelectedMonth:
          yearViewYear === selectedDate.getFullYear() &&
          index === selectedDate.getMonth(),
      };
    });

    return (
      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            {yearViewYear}
          </CuteText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setYearViewYear((year) => year - 1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: applyAlpha(palette.textSecondary, 0.1),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chevron-up" size={18} color={palette.text} />
            </Pressable>
            <Pressable
              onPress={() => setYearViewYear((year) => year + 1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: applyAlpha(palette.textSecondary, 0.1),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chevron-down" size={18} color={palette.text} />
            </Pressable>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {months.map((month) => (
            <Pressable
              key={`${yearViewYear}-${month.index}`}
              onPress={() => {
                const next = new Date(yearViewYear, month.index, 1);
                setSelectedDate(next);
                setVisibleMonth(new Date(yearViewYear, month.index, 1));
                setViewMode("month");
              }}
              style={{
                width: "30%",
                paddingVertical: 16,
                borderRadius: 18,
                alignItems: "center",
                backgroundColor: month.isSelectedMonth
                  ? "#ff6b6b"
                  : applyAlpha(palette.textSecondary, 0.12),
                shadowColor: month.isSelectedMonth ? "#ff6b6b" : "transparent",
                shadowOpacity: month.isSelectedMonth ? 0.35 : 0,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 5 },
              }}
            >
              <CuteText
                weight="bold"
                style={{
                  fontSize: 16,
                  color: month.isSelectedMonth ? "#fff" : palette.text,
                }}
              >
                {month.label}
              </CuteText>
              <CuteText
                tone="muted"
                style={{
                  fontSize: 12,
                  color: month.isSelectedMonth ? "#fff" : palette.textSecondary,
                }}
              >
                {month.eventCount ? `${month.eventCount} plan${
                  month.eventCount > 1 ? "s" : ""
                }` : "No plans"}
              </CuteText>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Screen scrollable={false}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160, paddingTop: 24, gap: 20 }}
        >
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <View>
            <CuteText weight="bold" style={{ fontSize: 28 }}>
              Calendar
            </CuteText>
            <CuteText tone="muted">
              Plan days that feel good for both of you.
            </CuteText>
          </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  backgroundColor: applyAlpha(palette.textSecondary, 0.08),
                  borderRadius: 16,
                  padding: 4,
                }}
              >
                {VIEW_MODES.map((mode) => {
                  const isActive = viewMode === mode.id;
                  return (
                    <Pressable
                      key={mode.id}
                      onPress={() => handleViewModeChange(mode.id)}
                      style={{
                        flex: 1,
                        borderRadius: 12,
                        paddingVertical: 8,
                        alignItems: "center",
                        backgroundColor: isActive ? palette.card : "transparent",
                        shadowColor: isActive ? "#00000022" : "transparent",
                        shadowOpacity: isActive ? 0.15 : 0,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: isActive ? 3 : 0,
                      }}
                    >
                      <CuteText
                        weight={isActive ? "bold" : "medium"}
                        style={{ fontSize: 13 }}
                      >
                        {mode.label}
                      </CuteText>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={handleGoToday}
                disabled={isOnToday}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: applyAlpha("#e94971", 0.15),
                  opacity: isOnToday ? 0.5 : 1,
                }}
              >
                <Ionicons name="sparkles-outline" size={16} color="#e94971" />
                <CuteText weight="medium" style={{ color: "#e94971", fontSize: 13 }}>
                  Today
                </CuteText>
              </Pressable>
            </View>

            <CuteText weight="bold" style={{ fontSize: 18 }}>
              {monthLabel}
            </CuteText>
            {coupleId && isSyncingEvents ? (
              <CuteText tone="muted" style={{ fontSize: 12 }}>
                Syncing latest schedules...
              </CuteText>
            ) : null}
          </View>

          {viewMode === "year" && renderYearView()}

          {viewMode === "month" && (
            <>
              {renderMonthCalendar()}
              {renderLegend()}
            </>
          )}

          {viewMode === "day" && (
            <>
              {renderDayStrip()}
              {renderDaySummary()}
              {renderAllDayCard()}
              {renderTimelineCard()}
              {renderLegend()}
            </>
          )}
        </ScrollView>

        <Pressable
          onPress={openComposer}
          style={{
            position: "absolute",
            right: 24,
            bottom: 24,
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "#ff6b6b",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#ff6b6b",
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            opacity: coupleId ? 1 : 0.4,
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>

      <CuteModal
        visible={composerVisible}
        onRequestClose={closeComposer}
        fullScreen
        respectTopInset
        contentStyle={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 20, paddingBottom: 40 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Pressable
              onPress={closeComposer}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chevron-back" size={20} color={palette.text} />
            </Pressable>
            <CuteText weight="bold" style={{ fontSize: 22 }}>
              Add schedule
            </CuteText>
          </View>
          <CuteTextInput
            label="Title"
            placeholder="What are you planning?"
            value={eventDraft.title}
            onChangeText={(text) =>
              setEventDraft((prev) => ({ ...prev, title: text }))
            }
          />

          <View style={{ gap: 8 }}>
            <CuteText weight="bold">Whose schedule?</CuteText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {coupleCalendars.map((calendar) => {
                const isSelected = eventDraft.calendar === calendar.id;
                return (
                  <Pressable
                    key={calendar.id}
                    onPress={() =>
                      setEventDraft((prev) => ({ ...prev, calendar: calendar.id }))
                    }
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 18,
                      backgroundColor: isSelected
                        ? calendar.color
                        : applyAlpha(calendar.color, 0.18),
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: applyAlpha(calendar.color, 0.6),
                    }}
                  >
                    <CuteText
                      weight="bold"
                      style={{ color: isSelected ? "#2b1b21" : palette.text }}
                    >
                      {calendar.label}
                    </CuteText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <Pressable
              onPress={() => openPicker("start")}
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: palette.border,
                padding: 16,
                gap: 4,
              }}
            >
              <CuteText tone="muted" style={{ fontSize: 12 }}>
                Starts
              </CuteText>
              <CuteText weight="bold">
                {formatDateTimeLabel(eventDraft.start, !eventDraft.allDay)}
              </CuteText>
            </Pressable>
            <Pressable
              onPress={() => openPicker("end")}
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: palette.border,
                padding: 16,
                gap: 4,
              }}
            >
              <CuteText tone="muted" style={{ fontSize: 12 }}>
                Ends
              </CuteText>
              <CuteText weight="bold">
                {formatDateTimeLabel(eventDraft.end, !eventDraft.allDay)}
              </CuteText>
            </Pressable>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 4,
              }}
            >
              <CuteText weight="bold">All-day</CuteText>
              <Switch
                value={eventDraft.allDay}
                onValueChange={handleToggleAllDay}
                thumbColor={eventDraft.allDay ? palette.primary : "#ffffff"}
                trackColor={{
                  false: applyAlpha(palette.textSecondary, 0.3),
                  true: palette.primarySoft,
                }}
              />
            </View>
          </View>

          <CuteTextInput
            label="Notes"
            placeholder="Add details, reminders, or a sweet note"
            value={eventDraft.notes}
            onChangeText={(text) =>
              setEventDraft((prev) => ({ ...prev, notes: text }))
            }
            multiline
            style={{ height: 100, textAlignVertical: "top" }}
          />
          {composerError ? (
            <CuteText tone="muted" style={{ color: "#d7263d" }}>
              {composerError}
            </CuteText>
          ) : null}
          <CuteButton
            label={isSavingEvent ? "Saving..." : "Add to calendar"}
            onPress={handleSaveEvent}
            disabled={isSavingEvent}
            style={{ alignSelf: "stretch" }}
          />
        </ScrollView>
      </CuteModal>

      {Platform.OS !== "android" && (
        <>
          <DatePickerSheet
            visible={composerVisible && activePicker === "start"}
            onRequestClose={() => setActivePicker(null)}
            title={eventDraft.allDay ? "Choose a start day" : "Choose a start time"}
            value={eventDraft.start}
            onChange={handlePickerChange("start")}
            onConfirm={() => setActivePicker(null)}
            mode={eventDraft.allDay ? "date" : "datetime"}
          />

          <DatePickerSheet
            visible={composerVisible && activePicker === "end"}
            onRequestClose={() => setActivePicker(null)}
            title={eventDraft.allDay ? "Choose an end day" : "Choose an end time"}
            value={eventDraft.end}
            onChange={handlePickerChange("end")}
            onConfirm={() => setActivePicker(null)}
            mode={eventDraft.allDay ? "date" : "datetime"}
            minimumDate={eventDraft.start}
          />
        </>
      )}
    </Screen>
  );
}
