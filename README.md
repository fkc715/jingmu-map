# Jingmu Map

Jingmu Map 是一个面向北京剧院的个人观剧地图和观剧手账项目。当前版本已经实现 Web 端预览页面，核心是使用 ECharts 加载 DataV.GeoAtlas 北京 GeoJSON，并展示北京核心四区的剧院点位。

## 当前已实现

- 首页总览
  - 展示北京核心四区地图：海淀区、朝阳区、东城区、西城区。
  - 地图使用 ECharts 渲染，支持缩放和拖拽。
  - 剧院点位使用 `effectScatter` 展示，并带有涟漪动效。
  - 首页筛选区保留 `全部 / 去过 / 收藏`。
  - `待去地点` 已做成列表视图占位，后续可接入真实数据。

- 北京剧院地图
  - 支持 `全部区域 / 海淀 / 朝阳 / 东城 / 西城` 切换。
  - `全部区域` 展示四区总览地图。
  - 单区按钮会切换到对应区的独立 ECharts 地图。
  - 支持 hover tooltip 和点击剧院切换右侧详情卡片。

- 剧院数据
  - 剧院数据维护在 `data/theatres/beijing-theatres.wgs84.json`。
  - Web 页面实际读取同步后的 `apps/web/src/data/theatres/beijing-theatres.wgs84.json`。
  - 坐标以 WGS84 为最终渲染坐标。
  - 如果点位来自 GCJ-02，可通过 `sourceCoordinateSystem: "GCJ-02"` 触发代码里的纠偏转换。

- 地图数据
  - 地图边界来自阿里云 DataV.GeoAtlas。
  - 数据源地址：https://geo.datav.aliyun.com/areas_v3/bound/110000_full.json
  - 本项目不接入百度地图或高德地图 API。

## 技术栈

- Monorepo: pnpm workspace
- Web: Taro + React
- Map: ECharts
- 数据：本地 GeoJSON + JSON seed data

## 本轮需求进度：观剧记录与观剧日历

本轮目标是把 `观剧记录` 和 `观剧日历` 从静态界面升级为可本地验证的真实功能。当前先不做真实登录，按单用户本地验证实现；后续接入登录后再按用户隔离数据。

### 观剧记录

- [已完成] 新增观剧记录表单，字段包含剧目名称、关联剧院、观剧日期、座位信息、评分、备注、状态。
- [已完成] 新增记录必须关联一个剧院。
- [已完成] 评分字段使用三个文字占位：`好`、`一般`、`不好`；代码中保留注释，方便后期替换为表情图标。
- [已完成] 支持上传电子票根图片。
- [已完成] 第一阶段图片存储到后端本地目录，暂不接云存储。
- [已完成] 图片格式先支持 `jpg`、`jpeg`、`png`、`webp`。
- [已完成] 观剧记录列表读取真实后端数据。
- [已完成] 支持查看、编辑、删除观剧记录。
- [已完成] 统计逻辑读取真实数据，至少包含全部记录数、关联剧院数、待补记录数、上传图片数。
- [已完成] 新增观剧记录后，对应剧院的 `去过次数` 统计增加。

### 观剧日历

- [已完成] 日历数据读取真实后端接口。
- [已完成] 功能验证范围限定为 `2026-06` 到 `2027-12`。
- [已完成] 左侧约 3/4 页面为完整月度日历，可切换月份。
- [已完成] 日历中能快速查看哪些日期有观剧记录。
- [已完成] 支持点击具体日期。
- [已完成] 右侧约 1/4 页面展示选中日期详情。
- [已完成] 用户未点击往日观剧日期时，右侧默认显示当日日期；如果当前日期不在验证范围内，则显示验证范围内的默认日期。
- [已完成] 日期封面和日期描述独立于观剧记录保存。
- [已完成] 支持修改某一天的日期封面。
- [已完成] 支持添加或修改某一天的日期描述。
- [已完成] 点击有观剧记录的日期时，右侧展示该日期的观剧封面和描述；如无自定义封面，可回退展示当天第一条观剧记录票根。

### 后端与本地验证

- [已完成] SQLite 表结构完善：观剧记录、上传文件、日期日历内容。
- [已完成] Go API 实现观剧记录 CRUD。
- [已完成] Go API 实现本地图片上传和静态文件访问。
- [已完成] Go API 实现观剧统计接口。
- [已完成] Go API 实现月度日历和日期详情接口。
- [已完成] 每个核心逻辑补充功能注释，方便后续本地修改。

## 常用命令

安装依赖：

```bash
pnpm install
```

同步数据到 Web 目录：

```bash
pnpm run sync:web-data
```

以 watch 状态打开 Web 页面：

```bash
pnpm run dev:web
```

运行后终端会输出本地访问地址，通常类似：

```text
http://localhost:3001/
```

如果 `3000` 或 `3001` 被占用，Taro 会自动切换到其他空闲端口。保持该命令运行，修改并保存代码后，浏览器刷新即可看到变化；多数情况下页面也会自动热更新。

构建 Web 页面：

```bash
pnpm run build:web
```

类型检查：

```bash
pnpm run typecheck
```

## 本地运行与调试：观剧记录和观剧日历

建议开两个终端：一个运行 Go 后端，一个运行 Web 前端。

### 终端一：启动后端 API

进入后端目录：

```bash
cd /Users/tianzhenyouxie/Downloads/jingmu-map/services/api
```

首次或依赖变化后整理 Go 依赖：

```bash
go mod tidy
```

启动后端：

```bash
go run ./cmd/server
```

默认后端地址：

```text
http://localhost:8080
```

默认 SQLite 数据库位置：

```text
services/api/data/jingmu.sqlite
```

默认上传图片目录：

```text
services/api/data/uploads/
```

如果你不想写入项目目录，可以用临时路径启动：

```bash
JINGMU_DATABASE_PATH=/private/tmp/jingmu-map.sqlite \
JINGMU_UPLOAD_DIR=/private/tmp/jingmu-map-uploads \
go run ./cmd/server
```

如果 `8080` 被占用，可以换端口：

```bash
JINGMU_API_ADDR=:18080 go run ./cmd/server
```

换端口后，前端的 API 地址也要同步修改：

```text
apps/web/src/services/api-preview.ts
```

把 `API_BASE_URL` 改为对应地址，例如：

```ts
export const API_BASE_URL = "http://localhost:18080";
```

### 终端二：启动 Web 前端

进入项目根目录：

```bash
cd /Users/tianzhenyouxie/Downloads/jingmu-map
```

启动 Web 预览：

```bash
pnpm dev:web
```

终端会输出访问地址，通常类似：

```text
http://localhost:3000/
```

如果端口被占用，Taro 会自动切换到其他端口，例如：

```text
http://localhost:3003/
```

### 功能调试顺序

1. 先打开后端健康检查：

```text
http://localhost:8080/healthz
```

看到：

```json
{"status":"ok"}
```

说明后端已启动。

2. 打开剧院接口，确认 seed 数据已导入：

```text
http://localhost:8080/api/v1/theatres
```

3. 打开前端页面，进入 `观剧记录`。

4. 在右侧新增记录表单中填写：

- 剧目名称
- 关联剧院
- 观剧日期，建议先选 `2026-06` 到 `2027-12` 范围内日期
- 座位信息
- 评分：`好 / 一般 / 不好`
- 备注
- 状态：`完整 / 待补`

5. 点击 `保存记录`。

6. 保存后再上传电子票根图片。第一阶段必须先保存记录，再上传图片。

7. 进入 `观剧日历`，切换到对应月份，点击有记录的日期，右侧会显示当天记录。

8. 在右侧修改日期描述或上传日期封面，然后点击 `保存日期内容`。

### 常用接口调试

查看全部观剧记录：

```bash
curl -s http://localhost:8080/api/v1/visits
```

新增一条观剧记录：

```bash
curl -s -X POST http://localhost:8080/api/v1/visits \
  -H 'Content-Type: application/json' \
  -d '{"theatreId":"capital-theatre","title":"测试剧目","visitedAt":"2026-06-08","seat":"一层中区","rating":"好","note":"本地验证记录","status":"complete"}'
```

查看统计：

```bash
curl -s http://localhost:8080/api/v1/visit-stats
```

查看月度日历：

```bash
curl -s 'http://localhost:8080/api/v1/calendar?month=2026-06'
```

查看某一天：

```bash
curl -s http://localhost:8080/api/v1/calendar/days/2026-06-08
```

修改某一天描述：

```bash
curl -s -X PATCH http://localhost:8080/api/v1/calendar/days/2026-06-08 \
  -H 'Content-Type: application/json' \
  -d '{"description":"六月八日的日历描述"}'
```

上传图片示例：

```bash
curl -s -X POST http://localhost:8080/api/v1/uploads \
  -F 'file=@/absolute/path/to/ticket.jpg' \
  -F 'visitId=visit_xxx' \
  -F 'theatreId=capital-theatre'
```

上传成功后会返回 `publicUrl`，浏览器可以通过：

```text
http://localhost:8080/uploads/返回的文件名
```

查看图片。

### 常见问题

- 前端提示后端未连接：确认 `go run ./cmd/server` 正在运行，并检查 `apps/web/src/services/api-preview.ts` 里的 `API_BASE_URL`。
- 新增记录后日历没显示：确认观剧日期在 `2026-06` 到 `2027-12` 范围内，并切换到对应月份。
- 上传按钮不可用：需要先保存观剧记录，再上传电子票根。
- 上传失败：当前只支持 `jpg`、`jpeg`、`png`、`webp` 图片。
- 想清空本地数据：停止后端后删除 `services/api/data/jingmu.sqlite`，再重新启动后端。

## 后续手动调整位置

主要页面代码：

```text
apps/web/src/pages/index/index.tsx
```

主要样式代码：

```text
apps/web/src/pages/index/index.scss
```

常调配置：

- 展示哪些区：修改 `index.tsx` 里的 `focusDistricts`。
- 首页待去列表：修改 `todoPlaceholders`。
- 地图缩放比例：修改 ECharts `geo.zoom`。
- 地图中心点：修改 `getDistrictCenter()` 或 GeoJSON feature 的 `properties.center`。
- 首页和地图页布局宽高：修改 `index.scss` 里的 `.home-grid`、`.workbench`、`.map-card-home`、`.map-card-work`、`.echarts-map`。

## 数据维护

修改剧院数据：

```text
data/theatres/beijing-theatres.wgs84.json
```

修改后同步到 Web：

```bash
pnpm run sync:web-data
```

修改地图数据：

```text
data/geo/beijing-datav-110000_full.json
```

修改后同样运行：

```bash
pnpm run sync:web-data
```

## 目录说明

```text
apps/web/                 Web 前端
apps/web/src/pages/       页面代码
apps/web/src/data/        Web 运行时数据，由 scripts/sync-web-data.mjs 同步生成
data/geo/                 地图源数据
data/theatres/            剧院源数据
packages/shared/          共享类型和工具
scripts/                  数据同步脚本
services/api/             后端服务草稿
```

## 当前注意事项

- 当前 Web 页面是单页面原型，首页总览、北京剧院地图、观剧记录、观剧日历在同一个页面组件内切换。
- 观剧记录和观剧日历目前主要是静态界面雏形。
- ECharts/Taro 构建时可能出现包体积 warning，这是当前依赖体积造成的，不影响本地预览。
