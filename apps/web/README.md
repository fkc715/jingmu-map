# Jingmu Map Web

这是 Jingmu Map 的 Taro + React Web 预览应用。当前页面集中在 `src/pages/index/`，用于调试北京四区 ECharts 剧院地图、剧院详情卡片和个人观剧手账雏形。

## 启动预览

建议从仓库根目录启动，这样会先同步数据：

```bash
pnpm run dev:web
```

也可以在 `apps/web` 内直接启动：

```bash
pnpm run dev:h5
```

启动后终端会输出本地地址，例如：

```text
http://localhost:3001/
```

保持命令运行就是 watch 状态。修改文件并保存后，浏览器刷新即可查看变化。

## 主要文件

```text
src/pages/index/index.tsx   页面结构、ECharts 配置、地图交互
src/pages/index/index.scss  页面布局、颜色、宽高、响应式样式
src/data/geo/               Web 运行时地图数据
src/data/theatres/          Web 运行时剧院数据
```

## 当前页面模块

- 首页总览：四区地图、剧院点位、筛选状态、待去地点列表占位。
- 北京剧院地图：全部区域和单区地图切换、剧院点击详情。
- 观剧记录：静态记录管理界面雏形。
- 观剧日历：静态日历界面雏形。

## 常见 UI 调整

首页左右布局：

```scss
.home-grid {
  grid-template-columns: minmax(0, 1.1fr) 360px;
}
```

地图页左右布局：

```scss
.workbench {
  grid-template-columns: minmax(0, 1fr) 390px;
}
```

地图高度：

```scss
.map-card-home { min-height: clamp(520px, 58vh, 680px); }
.map-card-work { min-height: clamp(620px, 72vh, 820px); }
```

地图比例：

```ts
geo: {
  zoom: viewDistrict ? 1.16 : 1.42
}
```

四区范围：

```ts
const focusDistricts = ["海淀区", "朝阳区", "东城区", "西城区"];
```

## 数据同步

源数据在仓库根目录的 `data/` 下。修改源数据后，在根目录运行：

```bash
pnpm run sync:web-data
```

这会把数据复制到 `apps/web/src/data/`，供 Web 页面导入使用。
