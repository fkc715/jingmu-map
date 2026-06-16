import { useEffect, useRef, useState } from "react";
import { Text, View } from "@tarojs/components";
import * as echarts from "echarts";
import beijingGeoJson from "../../data/geo/beijing-datav-110000_full.web.json";
import theatreSeedJson from "../../data/theatres/beijing-theatres.wgs84.json";
import { API_BASE_URL, plannedApi } from "../../services/api-preview";
import "./index.scss";

type PageId = "home" | "map" | "records" | "calendar";

interface TheatrePoint {
  id: string;
  name: string;
  district: string;
  address: string;
  value: [number, number];
  sourceCoordinateSystem?: "WGS84" | "GCJ-02";
  size: number;
  intro: string;
  image?: string;
  source: string;
}

interface TheatreSeed {
  coordinateSystem: "WGS84";
  theatres: TheatrePoint[];
}

interface VisitUpload {
  id: string;
  visitId?: string;
  theatreId?: string;
  fileName: string;
  publicUrl: string;
}

interface VisitRecord {
  id: string;
  theatreId: string;
  theatreName: string;
  title: string;
  visitedAt: string;
  seat: string;
  // 评分先使用文字占位：好 / 一般 / 不好。后期可在这里替换为表情资源或图标组件。
  rating: "好" | "一般" | "不好";
  note: string;
  status: "complete" | "todo";
  uploads: VisitUpload[];
}

interface VisitStats {
  totalRecords: number;
  linkedTheatres: number;
  todoRecords: number;
  uploadedImages: number;
  theatreVisitCount: Record<string, number>;
}

interface CalendarDay {
  date: string;
  coverUrl: string;
  description: string;
  profileSource: "custom" | "visit" | "empty";
  visits: VisitRecord[];
}

interface CalendarMonth {
  month: string;
  days: CalendarDay[];
}

interface VisitFormState {
  theatreId: string;
  title: string;
  visitedAt: string;
  seat: string;
  rating: "好" | "一般" | "不好";
  note: string;
  status: "complete" | "todo";
}

const emptyStats: VisitStats = {
  totalRecords: 0,
  linkedTheatres: 0,
  todoRecords: 0,
  uploadedImages: 0,
  theatreVisitCount: {}
};

const calendarStartMonth = "2026-06";
const calendarEndMonth = "2027-12";

const mapName = "beijing-datav-wgs84";
// Backend handoff: replace this static JSON with plannedApi.theatres when the Go API is running.
const theatreSeed = theatreSeedJson as unknown as TheatreSeed;
const focusDistricts = ["海淀区", "朝阳区", "东城区", "西城区"];
const focusDistrictSet = new Set(focusDistricts);
const focusGeoJson = {
  ...(beijingGeoJson as Record<string, unknown>),
  features: ((beijingGeoJson as { features?: Array<{ properties?: { name?: string } }> }).features || []).filter((feature) =>
    focusDistrictSet.has(feature.properties?.name || "")
  )
};
const focusTheatres = theatreSeed.theatres.filter((theatre) => focusDistrictSet.has(theatre.district));

const pages: Array<{ id: PageId; icon: string; label: string }> = [
  { id: "home", icon: "⌂", label: "首页总览" },
  { id: "map", icon: "◎", label: "北京剧院地图" },
  { id: "records", icon: "▤", label: "观剧记录" },
  { id: "calendar", icon: "◷", label: "观剧日历" }
];

const coreDistricts = focusDistricts;

const theatreStats: Record<string, { visited: number; status: string; color: string }> = {
  "national-centre-for-performing-arts": { visited: 2, status: "收藏", color: "#9e2a2b" },
  "capital-theatre": { visited: 6, status: "收藏", color: "#c8a45d" },
  "beijing-poly-theatre": { visited: 3, status: "待去", color: "#233849" },
  "tianqiao-performing-arts-center": { visited: 4, status: "去过", color: "#b85c38" },
  "beijing-comedy-theatre": { visited: 1, status: "收藏", color: "#6f8f72" },
  "beijing-concert-hall": { visited: 2, status: "去过", color: "#9e2a2b" },
  "mei-lanfang-grand-theatre": { visited: 1, status: "待去", color: "#c8a45d" },
  "haidian-theatre": { visited: 1, status: "去过", color: "#233849" },
  "century-theatre": { visited: 2, status: "收藏", color: "#b85c38" },
  "fengtai-theatre": { visited: 0, status: "待去", color: "#6f8f72" }
};

async function requestJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: options?.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

function toPublicAssetURL(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

function formatDisplayDate(date: string) {
  return date.replace(/-/g, ".");
}

function monthLabel(month: string) {
  const [year, value] = month.split("-");
  return `${year} 年 ${Number(value)} 月`;
}

function addMonths(month: string, delta: number) {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(year, value - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function clampMonth(month: string) {
  if (month < calendarStartMonth) return calendarStartMonth;
  if (month > calendarEndMonth) return calendarEndMonth;
  return month;
}

function defaultCalendarDate() {
  const today = new Date().toISOString().slice(0, 10);
  if (today >= `${calendarStartMonth}-01` && today <= `${calendarEndMonth}-31`) return today;
  return `${calendarStartMonth}-01`;
}

function buildCalendarCells(month: string, days: CalendarDay[]) {
  const [year, value] = month.split("-").map(Number);
  const first = new Date(year, value - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const blanks = Array.from({ length: offset }, (_, index) => ({ key: `blank-${index}`, day: null as CalendarDay | null }));
  return [...blanks, ...days.map((day) => ({ key: day.date, day }))];
}

function shortDistrictName(name: string): string {
  return name.replace("区", "");
}

function getTheatreStat(theatre: TheatrePoint) {
  return theatreStats[theatre.id] || { visited: 0, status: "未记录", color: "#9e2a2b" };
}

function countTheatresByDistrict() {
  return focusTheatres.reduce<Record<string, number>>((acc, theatre) => {
    acc[theatre.district] = (acc[theatre.district] || 0) + 1;
    return acc;
  }, {});
}

// ECharts geo/map uses WGS84 coordinates. DataV GeoAtlas source:
// https://geo.datav.aliyun.com/areas_v3/bound/110000_full.json
// If coordinates copied from a picker are GCJ-02, mark sourceCoordinateSystem: "GCJ-02";
// this helper corrects them back to WGS84 before rendering. Formula reference:
// https://en.wikipedia.org/wiki/Restrictions_on_geographic_data_in_China
const chinaBounds = { minLng: 72.004, maxLng: 137.8347, minLat: 0.8293, maxLat: 55.8271 };

function isOutsideChina(lng: number, lat: number) {
  return lng < chinaBounds.minLng || lng > chinaBounds.maxLng || lat < chinaBounds.minLat || lat > chinaBounds.maxLat;
}

function transformLat(lng: number, lat: number) {
  let ret = -100 + 2 * lng + 3 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  ret += ((20 * Math.sin(6 * lng * Math.PI) + 20 * Math.sin(2 * lng * Math.PI)) * 2) / 3;
  ret += ((20 * Math.sin(lat * Math.PI) + 40 * Math.sin((lat / 3) * Math.PI)) * 2) / 3;
  ret += ((160 * Math.sin((lat / 12) * Math.PI) + 320 * Math.sin((lat * Math.PI) / 30)) * 2) / 3;
  return ret;
}

function transformLng(lng: number, lat: number) {
  let ret = 300 + lng + 2 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += ((20 * Math.sin(6 * lng * Math.PI) + 20 * Math.sin(2 * lng * Math.PI)) * 2) / 3;
  ret += ((20 * Math.sin(lng * Math.PI) + 40 * Math.sin((lng / 3) * Math.PI)) * 2) / 3;
  ret += ((150 * Math.sin((lng / 12) * Math.PI) + 300 * Math.sin((lng / 30) * Math.PI)) * 2) / 3;
  return ret;
}

function gcj02ToWgs84(lng: number, lat: number): [number, number] {
  if (isOutsideChina(lng, lat)) return [lng, lat];
  const a = 6378245;
  const ee = 0.00669342162296594323;
  let dLat = transformLat(lng - 105, lat - 35);
  let dLng = transformLng(lng - 105, lat - 35);
  const radLat = (lat / 180) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180) / (((a * (1 - ee)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180) / ((a / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return [Number((lng - dLng).toFixed(6)), Number((lat - dLat).toFixed(6))];
}

function toWgs84(theatre: TheatrePoint): [number, number] {
  if (theatre.sourceCoordinateSystem === "GCJ-02") return gcj02ToWgs84(theatre.value[0], theatre.value[1]);
  return theatre.value;
}

function formatCoord(value: number) {
  return value.toFixed(6);
}

function getDistrictCenter(district: string): [number, number] {
  const feature = focusGeoJson.features.find((item) => item.properties?.name === district);
  const center = (feature?.properties as { center?: [number, number] } | undefined)?.center;
  return center || [116.4, 39.95];
}

function getMapGeoJson(district: string) {
  if (!district) return focusGeoJson;
  return {
    ...focusGeoJson,
    features: focusGeoJson.features.filter((feature) => feature.properties?.name === district)
  };
}

function getMapName(district: string) {
  return district ? `${mapName}-${district}` : mapName;
}

const todoPlaceholders = [
  { name: "北京保利剧院", district: "东城", note: "待补票价和座位偏好" },
  { name: "梅兰芳大剧院", district: "西城", note: "想看一场戏曲专场" },
  { name: "世纪剧院", district: "朝阳", note: "适合加入周末清单" }
];

interface EchartsMapProps {
  compact?: boolean;
  selectedDistrict: string;
  viewDistrict: string;
  selectedTheatre: TheatrePoint;
  onSelectDistrict: (district: string) => void;
  onSelectTheatre: (theatre: TheatrePoint) => void;
}

function EchartsBeijingMap({ compact = false, selectedDistrict, viewDistrict, selectedTheatre, onSelectDistrict, onSelectTheatre }: EchartsMapProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return undefined;
    echarts.registerMap(mapName, focusGeoJson as never);
    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    const onResize = () => chart.resize();
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(chartRef.current);
    window.addEventListener("resize", onResize);
    requestAnimationFrame(() => chart.resize());
    chart.on("click", (params) => {
      if (params.seriesType === "effectScatter") {
        const theatre = focusTheatres.find((item) => item.name === params.name);
        if (theatre) onSelectTheatre(theatre);
        return;
      }
      if (typeof params.name === "string") onSelectDistrict(params.name);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      chart.dispose();
      chartInstance.current = null;
    };
  }, [onSelectDistrict, onSelectTheatre]);

  useEffect(() => {
    const chart = chartInstance.current;
    if (!chart) return;
    const districtCounts = countTheatresByDistrict();
    const visibleDistricts = viewDistrict ? [viewDistrict] : focusDistricts;
    const activeMapName = getMapName(viewDistrict);
    echarts.registerMap(activeMapName, getMapGeoJson(viewDistrict) as never);
    const mapData = visibleDistricts.map((name) => ({ name, value: districtCounts[name] || 0 }));
    const scatterData = focusTheatres.filter((theatre) => visibleDistricts.includes(theatre.district)).map((theatre) => {
      const [lng, lat] = toWgs84(theatre);
      return {
      name: theatre.name,
      value: [lng, lat, theatre.size],
      theatre
      };
    });

    chart.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        confine: true,
        borderColor: "rgba(158,42,43,.22)",
        backgroundColor: "rgba(255,250,241,.96)",
        textStyle: { color: "#211f1b" },
        formatter(params: { seriesType?: string; data?: { theatre?: TheatrePoint }; name?: string; value?: number }) {
          if (params.seriesType === "effectScatter" && params.data?.theatre) {
            const theatre = params.data.theatre;
            const [lng, lat] = toWgs84(theatre);
            const image = theatre.image ? `<img src="${theatre.image}" alt="${theatre.name}" style="width:180px;height:90px;object-fit:cover;border-radius:8px;margin:8px 0 6px;display:block;" />` : "";
            return `<div style="max-width:260px;">
              <strong>${theatre.name}</strong>
              ${image}
              <br/>${theatre.district} · ${theatre.address}
              <br/>WGS84：${formatCoord(lng)}, ${formatCoord(lat)}
              <br/>${theatre.intro}
            </div>`;
          }
          const value = typeof params.value === "number" ? params.value : districtCounts[params.name || ""] || 0;
          return `<strong>${params.name}</strong><br/>剧院数量：${value}`;
        }
      },
      visualMap: {
        show: !compact,
        min: 0,
        max: 4,
        left: 16,
        bottom: 14,
        calculable: false,
        text: ["剧院多", "剧院少"],
        textStyle: { color: "#746b60" },
        inRange: { color: ["#efe7d8", "#e2cfaa", "#d2ad6a"] }
      },
      geo: {
        map: activeMapName,
        roam: true,
        zoom: viewDistrict ? (compact ? 1.08 : 1.16) : (compact ? 1.52 : 1.42),
        center: viewDistrict ? getDistrictCenter(viewDistrict) : [116.4, 39.95],
        label: { show: !compact, color: "rgba(33,31,27,.62)", fontWeight: 700 },
        itemStyle: {
          areaColor: "#e9dfcf",
          borderColor: "rgba(255,248,236,.94)",
          borderWidth: 3,
          shadowColor: "rgba(35,56,73,.08)",
          shadowBlur: 10
        },
        emphasis: {
          label: { color: "#211f1b" },
          itemStyle: { areaColor: "#f0d58f", shadowColor: "rgba(158,42,43,.2)", shadowBlur: 16 }
        },
        regions: visibleDistricts.map((district) => ({
          name: district,
          itemStyle: {
            areaColor: selectedDistrict === district ? "#d2ad6a" : "#e9dfcf",
            borderColor: "#fff8ec",
            borderWidth: selectedDistrict === district ? 3.6 : 2.8
          },
          label: { show: true }
        }))
      },
      series: [
        {
          name: "剧院数量",
          type: "map",
          map: activeMapName,
          geoIndex: 0,
          data: mapData,
          selectedMode: false
        },
        {
          name: "剧院",
          type: "effectScatter",
          coordinateSystem: "geo",
          data: scatterData,
          symbolSize(value: [number, number, number]) {
            return value[2] || 10;
          },
          rippleEffect: { brushType: "stroke", scale: 4.6, period: 4 },
          label: {
            show: !compact,
            position: "right",
            formatter: "{b}",
            color: "#233849",
            fontWeight: 800,
            fontSize: 11
          },
          itemStyle: { color: "#9e2a2b", borderColor: "#fff8ec", borderWidth: 1.4, shadowBlur: 14, shadowColor: "rgba(158,42,43,.38)" },
          emphasis: { scale: 1.35, label: { show: true } },
          zlevel: 2
        }
      ]
    });
  }, [compact, selectedDistrict, selectedTheatre, viewDistrict]);

  return <View className="echarts-map" ref={chartRef as never} />;
}

export default function IndexPage() {
  const [activePage, setActivePage] = useState<PageId>("home");
  const [selectedDistrict, setSelectedDistrict] = useState("东城区");
  const [mapViewDistrict, setMapViewDistrict] = useState("");
  const [selectedTheatreId, setSelectedTheatreId] = useState("capital-theatre");
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [visitStats, setVisitStats] = useState<VisitStats>(emptyStats);
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [visitForm, setVisitForm] = useState<VisitFormState>({
    theatreId: "capital-theatre",
    title: "",
    visitedAt: defaultCalendarDate(),
    seat: "",
    rating: "一般",
    note: "",
    status: "complete"
  });
  const [calendarMonth, setCalendarMonth] = useState(calendarStartMonth);
  const [calendarData, setCalendarData] = useState<CalendarMonth>({ month: calendarStartMonth, days: [] });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(defaultCalendarDate());
  const [calendarDescription, setCalendarDescription] = useState("");
  const [calendarCoverUrl, setCalendarCoverUrl] = useState("");
  const [backendMessage, setBackendMessage] = useState("");
  const selectedTheatre = focusTheatres.find((theatre) => theatre.id === selectedTheatreId) || focusTheatres[0];
  const selectedStat = getTheatreStat(selectedTheatre);
  const selectedVisit = visitRecords.find((record) => record.id === selectedVisitId) || visitRecords[0];
  const selectedCalendarDay = calendarData.days.find((day) => day.date === selectedCalendarDate);

  const loadVisits = async () => {
    try {
      const [list, stats] = await Promise.all([
        requestJSON<{ items: VisitRecord[] }>(plannedApi.visits),
        requestJSON<VisitStats>("/api/v1/visit-stats")
      ]);
      setVisitRecords(list.items);
      setVisitStats(stats);
      if (!selectedVisitId && list.items[0]) setSelectedVisitId(list.items[0].id);
      setBackendMessage("");
    } catch {
      setBackendMessage("后端服务未连接，观剧记录暂时无法读取。");
    }
  };

  const loadCalendar = async (month = calendarMonth) => {
    try {
      const data = await requestJSON<CalendarMonth>(`/api/v1/calendar?month=${month}`);
      setCalendarData(data);
      setBackendMessage("");
    } catch {
      setBackendMessage("后端服务未连接，观剧日历暂时无法读取。");
    }
  };

  useEffect(() => {
    loadVisits();
    loadCalendar(calendarMonth);
  }, []);

  useEffect(() => {
    loadCalendar(calendarMonth);
  }, [calendarMonth]);

  useEffect(() => {
    if (selectedCalendarDay) {
      setCalendarDescription(selectedCalendarDay.description);
      setCalendarCoverUrl(selectedCalendarDay.coverUrl);
    } else {
      setCalendarDescription("");
      setCalendarCoverUrl("");
    }
  }, [selectedCalendarDate, selectedCalendarDay?.description, selectedCalendarDay?.coverUrl]);

  const resetVisitForm = () => {
    setSelectedVisitId("");
    setVisitForm({
      theatreId: selectedTheatre?.id || "capital-theatre",
      title: "",
      visitedAt: selectedCalendarDate || defaultCalendarDate(),
      seat: "",
      rating: "一般",
      note: "",
      status: "complete"
    });
  };

  const editVisit = (record: VisitRecord) => {
    setSelectedVisitId(record.id);
    setVisitForm({
      theatreId: record.theatreId,
      title: record.title,
      visitedAt: record.visitedAt,
      seat: record.seat,
      rating: record.rating,
      note: record.note,
      status: record.status
    });
  };

  const saveVisit = async () => {
    if (!visitForm.theatreId || !visitForm.title || !visitForm.visitedAt) {
      setBackendMessage("请至少填写剧目名称、关联剧院和观剧日期。");
      return;
    }
    const method = selectedVisitId ? "PATCH" : "POST";
    const path = selectedVisitId ? `/api/v1/visits/${selectedVisitId}` : plannedApi.visits;
    const saved = await requestJSON<VisitRecord>(path, { method, body: JSON.stringify(visitForm) });
    setSelectedVisitId(saved.id);
    await loadVisits();
    await loadCalendar(calendarMonth);
  };

  const deleteVisit = async () => {
    if (!selectedVisitId) return;
    await fetch(`${API_BASE_URL}/api/v1/visits/${selectedVisitId}`, { method: "DELETE" });
    setSelectedVisitId("");
    resetVisitForm();
    await loadVisits();
    await loadCalendar(calendarMonth);
  };

  const uploadTicket = async (file?: File) => {
    if (!file || !selectedVisitId) {
      setBackendMessage("请先保存观剧记录，再上传电子票根。");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("visitId", selectedVisitId);
    formData.append("theatreId", visitForm.theatreId);
    await requestJSON<VisitUpload>(plannedApi.uploads, { method: "POST", body: formData });
    await loadVisits();
    await loadCalendar(calendarMonth);
  };

  const uploadCalendarCover = async (file?: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const upload = await requestJSON<VisitUpload>(plannedApi.uploads, { method: "POST", body: formData });
    setCalendarCoverUrl(upload.publicUrl);
    await saveCalendarDay(upload.publicUrl);
  };

  const saveCalendarDay = async (coverUrl = calendarCoverUrl) => {
    await requestJSON<CalendarDay>(`/api/v1/calendar/days/${selectedCalendarDate}`, {
      method: "PATCH",
      body: JSON.stringify({ coverUrl, description: calendarDescription })
    });
    await loadCalendar(calendarMonth);
  };

  const selectDistrict = (district: string) => {
    setSelectedDistrict(district);
    setMapViewDistrict(district);
    const firstTheatre = focusTheatres.find((theatre) => theatre.district === district);
    if (firstTheatre) setSelectedTheatreId(firstTheatre.id);
  };

  const selectTheatre = (theatre: TheatrePoint) => {
    setSelectedDistrict(theatre.district);
    setSelectedTheatreId(theatre.id);
  };

  const selectAllDistricts = () => {
    setMapViewDistrict("");
    setSelectedDistrict("");
  };

  const renderMap = (compact = false) => (
    <View className={`map-card ${compact ? "map-card-home" : "map-card-work"}`}>
      <View className="map-toolbar">
        {compact ? (
          <View>
            <Text className="eyebrow">ECHARTS THEATRE MAP</Text>
            <Text className="map-title">北京剧院地图</Text>
          </View>
        ) : (
          <View className="chip-row">
            <View className={`chip ${mapViewDistrict === "" ? "active" : ""}`} onClick={selectAllDistricts}>全部区域</View>
            {coreDistricts.map((district) => (
              <View key={district} className={`chip ${mapViewDistrict === district ? "active" : ""}`} onClick={() => selectDistrict(district)}>
                {shortDistrictName(district)}
              </View>
            ))}
          </View>
        )}
        {compact ? (
          <View className="home-filter-card">
            <View className="chip-row map-status">
              {["全部", "去过", "收藏"].map((item, index) => (
                <View key={item} className={`chip ${index === 0 ? "active" : ""}`}>{item}</View>
              ))}
            </View>
            <View className="todo-place-list">
              <Text className="todo-title">待去地点</Text>
              {todoPlaceholders.map((item) => (
                <View className="todo-place" key={item.name}>
                  <View>
                    <Text className="todo-name">{item.name}</Text>
                    <Text className="todo-note">{item.note}</Text>
                  </View>
                  <Text className="todo-district">{item.district}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="chip-row map-status">
            {["剧院", "去过", "收藏"].map((item, index) => (
              <View key={item} className={`chip ${index === 0 ? "active" : ""}`}>{item}</View>
            ))}
          </View>
        )}
      </View>

      <EchartsBeijingMap
        compact={compact}
        selectedDistrict={selectedDistrict}
        viewDistrict={compact ? "" : mapViewDistrict}
        selectedTheatre={selectedTheatre}
        onSelectDistrict={selectDistrict}
        onSelectTheatre={selectTheatre}
      />

      {compact && (
        <View className="theatre-pop">
          <Text className="eyebrow">当前选中剧院</Text>
          <Text className="pop-title">{selectedTheatre.name}</Text>
          <Text className="muted">{selectedTheatre.address}。{selectedTheatre.intro}</Text>
          <View className="metrics">
            <View className="metric"><Text className="metric-value">{selectedStat.visited}</Text><Text className="metric-label">去过次数</Text></View>
            <View className="metric"><Text className="metric-value">{shortDistrictName(selectedTheatre.district)}</Text><Text className="metric-label">所属区域</Text></View>
            <View className="metric"><Text className="metric-value">{selectedStat.status}</Text><Text className="metric-label">个人状态</Text></View>
          </View>
        </View>
      )}
    </View>
  );

  const renderDetailPanel = () => (
    <View className="panel detail-panel">
      <View className="detail-hero" style={{ background: `linear-gradient(rgba(35,56,73,.12), rgba(35,56,73,.78)), linear-gradient(135deg, ${selectedStat.color}, #233849)` }}>
        <Text className="eyebrow light">THEATRE CARD</Text>
        <Text className="detail-title">{selectedTheatre.name}</Text>
      </View>
      <Text className="detail-copy">{selectedTheatre.address}。{selectedTheatre.intro}</Text>
      {selectedTheatre.image ? <img className="detail-image" src={selectedTheatre.image} alt={selectedTheatre.name} /> : <View className="detail-image placeholder">{selectedTheatre.name.slice(0, 4)}</View>}
      <View className="tag-row">
        <View className="tag active">{selectedTheatre.district}</View>
        <View className="tag">去过 {selectedStat.visited} 次</View>
        <View className="tag">{selectedStat.status}</View>
        <View className="tag">WGS84</View>
      </View>
      <View className="coord-box">
        <Text className="coord-label">渲染坐标</Text>
        <Text className="coord-value">{formatCoord(toWgs84(selectedTheatre)[0])}, {formatCoord(toWgs84(selectedTheatre)[1])}</Text>
      </View>
      <View className="primary-btn">添加一次观剧记录</View>
      <Text className="section-title">数据来源备注</Text>
      <View className="note">{selectedTheatre.source}</View>
      <Text className="section-title">同区 / 附近剧院</Text>
      <View className="nearby-list">
        {focusTheatres.filter((theatre) => theatre.district === selectedTheatre.district).map((theatre) => (
          <View key={theatre.id} className={`nearby-item ${theatre.id === selectedTheatre.id ? "active" : ""}`} onClick={() => selectTheatre(theatre)}>
            <View>
              <Text className="nearby-name">{theatre.name}</Text>
              <Text className="nearby-meta">{theatre.district} · {getTheatreStat(theatre).status}</Text>
            </View>
            <Text className="nearby-count">{getTheatreStat(theatre).visited}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View className="app-shell">
      <View className="sidebar">
        <View className="brand"><View className="brand-mark">幕</View><View><Text className="brand-title">京幕地图</Text><Text className="brand-subtitle">Jingmu Map</Text></View></View>
        <View className="nav">{pages.map((page) => <View key={page.id} className={`nav-item ${activePage === page.id ? "active" : ""}`} onClick={() => setActivePage(page.id)}><Text className="nav-icon">{page.icon}</Text><Text>{page.label}</Text></View>)}</View>
        <View className="privacy"><Text className="privacy-title">私人观剧手账</Text><Text className="muted">地图仅展示海淀、朝阳、东城、西城的 ECharts 区域图，不接入百度或高德 API。</Text></View>
      </View>

      <View className="main">
        <View className="topbar"><View className="search">⌕ 搜索剧院、区域或自己的观剧记录</View><View className="actions"><View className="secondary-btn">筛选</View><View className="primary-btn top-btn">添加记录</View></View></View>
        <View className="preview-tabs">{pages.map((page) => <View key={page.id} className={`preview-tab ${activePage === page.id ? "active" : ""}`} onClick={() => setActivePage(page.id)}>{page.label}</View>)}</View>

        {activePage === "home" && (
          <View className="page">
            <View className="page-title"><View><Text className="h1">首页总览</Text><Text className="muted">通过 ECharts 展示北京四区行政区划和核心剧院位置。</Text></View></View>
            <View className="home-grid">
              {renderMap(true)}
              <View className="side-stack">
                <View className="panel box"><Text className="box-title">我的观剧概览</Text><View className="stat-grid">{[["18", "今年已记录"], ["10", "地图剧院"], ["4", "收藏剧院"], ["3", "待补记录"]].map(([value, label]) => <View className="stat" key={label}><Text className="stat-value">{value}</Text><Text className="metric-label">{label}</Text></View>)}</View></View>
                <View className="panel box"><Text className="box-title">最近一次观剧</Text><View className="ticket"><Text className="ticket-small">2026.06.08 · 北京保利剧院</Text><Text className="ticket-title">茶馆</Text><Text className="ticket-copy">二层中区视野稳定，散场后东四十条方向更顺。</Text></View></View>
              </View>
            </View>
          </View>
        )}

        {activePage === "map" && (
          <View className="page">
            <View className="page-title"><View><Text className="h1">ECharts 地图工作台</Text><Text className="muted">支持缩放、拖拽、hover tooltip 和点击剧院切换详情，区域范围限定为四区。</Text></View></View>
            <View className="workbench">{renderMap(false)}{renderDetailPanel()}</View>
          </View>
        )}

        {activePage === "records" && (
          <View className="page">
            <View className="page-title"><View><Text className="h1">观剧记录</Text><Text className="muted">管理自己的观剧条目、票根图片、待补信息和剧院关联。</Text></View><View className="primary-btn" onClick={resetVisitForm}>新增记录</View></View>
            <View className="records-page">
              <View className="panel box">
                {backendMessage && <View className="note">{backendMessage}</View>}
                <View className="stat-grid record-stats">{[
                  [String(visitStats.totalRecords), "全部记录"],
                  [String(visitStats.linkedTheatres), "关联剧院"],
                  [String(visitStats.todoRecords), "待补记录"],
                  [String(visitStats.uploadedImages), "上传图片"]
                ].map(([value, label]) => <View className="stat" key={label}><Text className="stat-value">{value}</Text><Text className="metric-label">{label}</Text></View>)}</View>
                <View className="record-tools"><View className="tool-input">搜索、筛选稍后接入；当前展示全部本地验证记录</View><View className="tool-select">2026-2027</View><View className="tool-select">最近观看</View></View>
                <View className="record-list">
                  {visitRecords.map((record) => (
                    <View className={`record-row ${selectedVisitId === record.id ? "active" : ""}`} key={record.id} onClick={() => editVisit(record)}>
                      {record.uploads[0]?.publicUrl ? <img className="poster-thumb image" src={toPublicAssetURL(record.uploads[0].publicUrl)} alt={record.title} /> : <View className="poster-thumb">{record.title.slice(0, 1)}</View>}
                      <View><Text className="record-title">{record.title}</Text><Text className="record-copy">{record.theatreName} · {formatDisplayDate(record.visitedAt)} · {record.seat || "座位待补"}</Text><Text className="record-copy">{record.note || "暂无备注"}</Text></View>
                      <Text className="score">{record.rating}</Text>
                      <View className={`status-badge ${record.status === "todo" ? "todo" : ""}`}>{record.status === "todo" ? "待补" : "完整"}</View>
                    </View>
                  ))}
                  {visitRecords.length === 0 && <View className="empty-state">还没有观剧记录，先在右侧新增一条。</View>}
                </View>
              </View>
              <View className="panel box">
                <Text className="box-title">{selectedVisitId ? "编辑记录" : "新增记录"}</Text>
                {selectedVisit && (
                  <View className="ticket">
                    <Text className="ticket-small">{formatDisplayDate(selectedVisit.visitedAt)} · {selectedVisit.theatreName}</Text>
                    <Text className="ticket-title">{selectedVisit.title}</Text>
                    <Text className="ticket-copy">{selectedVisit.note || "暂无备注"}</Text>
                  </View>
                )}
                <View className="form real-form">
                  <label className="field-label">剧目名称<input className="field-control" value={visitForm.title} onChange={(event) => setVisitForm({ ...visitForm, title: event.currentTarget.value })} /></label>
                  <label className="field-label">关联剧院<select className="field-control" value={visitForm.theatreId} onChange={(event) => setVisitForm({ ...visitForm, theatreId: event.currentTarget.value })}>{focusTheatres.map((theatre) => <option key={theatre.id} value={theatre.id}>{theatre.name}</option>)}</select></label>
                  <label className="field-label">观剧日期<input className="field-control" type="date" min="2026-06-01" max="2027-12-31" value={visitForm.visitedAt} onChange={(event) => setVisitForm({ ...visitForm, visitedAt: event.currentTarget.value })} /></label>
                  <label className="field-label">座位信息<input className="field-control" value={visitForm.seat} onChange={(event) => setVisitForm({ ...visitForm, seat: event.currentTarget.value })} /></label>
                  <View className="field-label">评分占位
                    <View className="segmented">
                      {(["好", "一般", "不好"] as const).map((rating) => <View key={rating} className={`segment ${visitForm.rating === rating ? "active" : ""}`} onClick={() => setVisitForm({ ...visitForm, rating })}>{rating}</View>)}
                    </View>
                  </View>
                  <label className="field-label">状态<select className="field-control" value={visitForm.status} onChange={(event) => setVisitForm({ ...visitForm, status: event.currentTarget.value as VisitFormState["status"] })}><option value="complete">完整</option><option value="todo">待补</option></select></label>
                  <label className="field-label">私人备注<textarea className="field-control textarea-control" value={visitForm.note} onChange={(event) => setVisitForm({ ...visitForm, note: event.currentTarget.value })} /></label>
                  <View className="button-row"><View className="primary-btn" onClick={saveVisit}>保存记录</View>{selectedVisitId && <View className="secondary-btn" onClick={deleteVisit}>删除</View>}</View>
                  <label className={`upload-box ${!selectedVisitId ? "disabled" : ""}`}>上传电子票根<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!selectedVisitId} onChange={(event) => uploadTicket(event.currentTarget.files?.[0])} /></label>
                </View>
              </View>
            </View>
          </View>
        )}

        {activePage === "calendar" && (
          <View className="page">
            <View className="page-title"><View><Text className="h1">观剧日历</Text><Text className="muted">左侧查看月度观剧节奏，右侧维护某一天独立的封面和描述。</Text></View><View className="calendar-controls"><View className={`secondary-btn ${calendarMonth <= calendarStartMonth ? "disabled" : ""}`} onClick={() => setCalendarMonth(clampMonth(addMonths(calendarMonth, -1)))}>上一月</View><View className="secondary-btn">{monthLabel(calendarMonth)}</View><View className={`secondary-btn ${calendarMonth >= calendarEndMonth ? "disabled" : ""}`} onClick={() => setCalendarMonth(clampMonth(addMonths(calendarMonth, 1)))}>下一月</View></View></View>
            <View className="calendar-page">
              <View className="panel box calendar-panel">
                <View className="calendar-grid">{["一", "二", "三", "四", "五", "六", "日"].map((day) => <View className="weekday" key={day}>{day}</View>)}{buildCalendarCells(calendarMonth, calendarData.days).map((cell) => cell.day ? (
                  <View className={`day ${cell.day.visits.length ? "has" : ""} ${selectedCalendarDate === cell.day.date ? "selected" : ""}`} key={cell.key} onClick={() => setSelectedCalendarDate(cell.day!.date)}>
                    <Text className="day-number">{Number(cell.day.date.slice(8))}</Text>
                    {cell.day.visits.slice(0, 2).map((visit) => <Text className="pill" key={visit.id}>{visit.title}</Text>)}
                    {cell.day.visits.length > 2 && <Text className="day-more">+{cell.day.visits.length - 2}</Text>}
                  </View>
                ) : <View className="day blank" key={cell.key} />)}</View>
              </View>
              <View className="panel box calendar-side">
                <Text className="box-title">{formatDisplayDate(selectedCalendarDate)}</Text>
                {selectedCalendarDay?.coverUrl ? <img className="calendar-cover" src={toPublicAssetURL(selectedCalendarDay.coverUrl)} alt={selectedCalendarDate} /> : <View className="calendar-cover placeholder">日期封面</View>}
                <View className="form real-form">
                  <label className="field-label">日期描述<textarea className="field-control textarea-control" value={calendarDescription} onChange={(event) => setCalendarDescription(event.currentTarget.value)} /></label>
                  <label className="upload-box">修改日期封面<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadCalendarCover(event.currentTarget.files?.[0])} /></label>
                  <View className="primary-btn" onClick={() => saveCalendarDay()}>保存日期内容</View>
                </View>
                <Text className="section-title">当天观剧</Text>
                <View className="record-list compact-list">
                  {(selectedCalendarDay?.visits || []).map((visit) => <View className="nearby-item" key={visit.id}><View><Text className="nearby-name">{visit.title}</Text><Text className="nearby-meta">{visit.theatreName} · {visit.rating}</Text></View><Text className="nearby-count">{visit.uploads.length}</Text></View>)}
                  {(!selectedCalendarDay || selectedCalendarDay.visits.length === 0) && <View className="empty-state">这一天还没有观剧记录。</View>}
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
