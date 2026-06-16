export const API_BASE_URL = "http://localhost:8080";

export const plannedApi = {
  theatres: "/api/v1/theatres",
  theatreDetail: "/api/v1/theatres/{id}",
  theatreProfile: "/api/v1/theatres/{id}/profile",
  theatreState: "/api/v1/theatres/{id}/state",
  visits: "/api/v1/visits",
  visitDetail: "/api/v1/visits/{id}",
  uploads: "/api/v1/uploads",
  uploadDetail: "/api/v1/uploads/{id}",
  calendar: "/api/v1/calendar?month=YYYY-MM"
} as const;

export const frontendIntegrationNotes = [
  "地图散点、详情卡、同区剧院列表可由 GET /api/v1/theatres 替换本地 theatres JSON。",
  "首次登录默认读取官方剧院资料和默认图片，用户修改后对接 PATCH /api/v1/theatres/{id}/profile 保存个人覆盖内容。",
  "观剧记录页后续对接 GET/POST/PATCH /api/v1/visits。",
  "收藏、待去、去过次数后续对接 /api/v1/theatres/{id}/state。",
  "图片上传入口后续先创建上传元数据，再接对象存储和内容安全检查。",
  "日历页后续按 month=YYYY-MM 请求 /api/v1/calendar。"
] as const;
