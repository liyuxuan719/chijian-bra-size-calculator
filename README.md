# 尺间 · 胸围计算器

一个可以直接部署到 GitHub Pages 的胸围与参考尺码计算器。输入下胸围和胸围后，页面会实时计算 CN / EU / US / UK 参考尺码，并提供测量方法与试穿提示。

![尺间胸围计算器预览](preview.png)

## 功能

- 下胸围、胸围数字输入与滑块联动
- 厘米 / 英寸实时切换，不丢失原始测量值
- CN、EU、US、UK 参考尺码换算
- 根据上下胸围差计算 AA–G 及更大杯型
- 本地自动保存最近一次测量
- 响应式布局、键盘操作与弹窗无障碍支持
- 零后端、零运行时依赖、不收集用户数据

## 本地运行

项目不依赖 npm 包，只需要 Node.js 18 或更高版本。

```bash
node server.mjs
```

打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。

运行测试：

```bash
node --test
```

## 部署到 GitHub Pages

1. 在 GitHub 新建一个空仓库。
2. 如果使用下载的压缩包，先在项目目录初始化 Git：

```bash
git init -b main
git add .
git commit -m "Initial commit"
```

3. 关联远程仓库并推送 `main` 分支：

```bash
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

4. 打开仓库的 **Settings → Pages**。
5. 将 **Source** 设置为 **Deploy from a branch**，分支选择 `main`，目录选择 `/ (root)`，然后保存。

## 计算规则

- 底围按下胸围四舍五入到最接近的 5 cm 档位，例如 73 cm → 75。
- 杯差为胸围减下胸围。7.5 cm 以内为 AA，此后每 2.5 cm 递增一档。
- CN / EU 使用厘米底围与杯型；US / UK 的底围和杯级使用常见参考映射。
- 不同品牌、地区、胸型与面料弹性会造成实际穿着差异。国际换算仅作为试穿起点，不代表品牌官方尺码。

## 项目结构

```text
.
├── app.js
├── atelier.jpg
├── favicon.svg
├── index.html
├── preview.png
├── server.mjs
├── sizing.js
├── sizing.test.js
└── styles.css
```

## 隐私

所有计算均在浏览器内完成。最近一次测量值只保存在当前浏览器的 `localStorage` 中，不会发送到服务器。

## 图片

主视觉来自 [Unsplash](https://unsplash.com/)（素材 ID：`photo-1558769132-cb1aea458c5e`），已下载到项目中以保证部署稳定性。图片仅用于页面氛围，不展示或判断用户身体。

## License

源代码采用 [MIT](LICENSE)。Unsplash 主视觉照片遵循 Unsplash License，不包含在 MIT 授权范围内。
