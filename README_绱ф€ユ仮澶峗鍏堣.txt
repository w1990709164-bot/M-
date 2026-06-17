这版是 M叽紧急硬恢复包。

用途：
1. 修复打开后只显示 CSS 文本的问题。
2. 清掉旧 service worker / 旧缓存。
3. 先保证电脑和手机能正常打开。

上传方法：
1. 解压本 zip。
2. 把里面的 index.html、style.css、desktop-style-theme.css、js、icons、manifest.json、sw.js 等全部上传到 GitHub 仓库根目录。
3. 如果仓库里已有旧文件，建议先全删再上传。
4. 上传完成后，手机删掉旧桌面图标，浏览器打开网址并刷新，再重新添加到主屏幕。

注意：
这版 sw.js 是紧急恢复版，优先避免坏缓存，不做离线缓存。等页面稳定后再恢复离线缓存。
