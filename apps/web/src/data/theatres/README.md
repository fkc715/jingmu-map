# Theatre Data

剧院点位维护在 `data/theatres/beijing-theatres.wgs84.json`，页面实际读取同步后的
`apps/web/src/data/theatres/beijing-theatres.wgs84.json`。

## 字段说明

- `id`：唯一标识，建议使用英文 kebab-case。
- `name`：剧院名称，会显示在地图标签和详情面板。
- `district`：行政区名称，必须与 GeoJSON 区县名称一致，如 `东城区`、`西城区`。
- `address`：详细地址。
- `value`：经纬度数组 `[lng, lat]`。
- `sourceCoordinateSystem`：`WGS84` 或 `GCJ-02`。
- `size`：散点大小，建议 9-14。
- `intro`：tooltip 和详情面板里的简介。
- `image`：可选图片 URL；为空时页面展示文字占位。
- `source`：坐标或资料来源备注。

## 坐标规则

ECharts 的 `geo` / `map` 默认使用 WGS84。本项目地图边界来自 DataV.GeoAtlas，剧院点位最终也必须以 WGS84 渲染。

如果你拿到的是 WGS84 坐标：

```json
{
  "value": [116.3833, 39.9089],
  "sourceCoordinateSystem": "WGS84"
}
```

如果你使用坐标拾取工具得到的是 GCJ-02 坐标：

```json
{
  "value": [116.3901, 39.9102],
  "sourceCoordinateSystem": "GCJ-02"
}
```

页面会在 `apps/web/src/pages/index/index.tsx` 内通过 `gcj02ToWgs84()` 自动纠偏后再渲染。
不要直接粘贴 BD-09 坐标；如来自百度拾取器，请先转换为 GCJ-02 或 WGS84。

## 手动增删剧院

1. 修改 `data/theatres/beijing-theatres.wgs84.json` 的 `theatres` 数组。
2. 在项目根目录运行：

```bash
node scripts/sync-web-data.mjs
```

3. 刷新页面，点击「北京剧院地图」查看 tooltip、详情面板和区县剧院数量是否正确。
