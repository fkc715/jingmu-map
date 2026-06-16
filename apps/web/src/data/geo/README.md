# Geo Data

北京地图底图使用阿里云 DataV.GeoAtlas 的北京市行政区划 GeoJSON：

- 在线地址：https://geo.datav.aliyun.com/areas_v3/bound/110000_full.json
- 本地源文件：`data/geo/beijing-datav-110000_full.json`
- Web 运行文件：`apps/web/src/data/geo/beijing-datav-110000_full.web.json`
- 坐标系：WGS84，适配 ECharts `geo` / `map` 默认坐标系统

请不要替换为百度地图或高德地图 API 返回的边界数据，避免商业授权和坐标偏移风险。

## 手动更新方式

1. 在浏览器打开 DataV 地址，保存响应内容。
2. 覆盖 `data/geo/beijing-datav-110000_full.json`。
3. 在项目根目录运行：

```bash
node scripts/sync-web-data.mjs
```

4. 启动 H5 页面确认区县分割线、缩放拖拽和剧院散点位置正常。
