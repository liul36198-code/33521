@echo off
chcp 65001 >nul
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   iOS17 聊天室 - 一键部署脚本 v1.0          ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  本脚本帮助你完成云端部署
echo.

:menu
echo  请选择操作：
echo  1. 初始化 Git 仓库（首次使用）
echo  2. 查看目录结构
echo  3. 启动本地测试
echo  4. 部署到 GitHub Pages + PartyKit
echo  5. 查看部署说明
echo  0. 退出
echo.
set /p choice=请输入数字: 

if "%choice%"=="1" goto init
if "%choice%"=="2" goto structure
if "%choice%"=="3" goto local
if "%choice%"=="4" goto deploy
if "%choice%"=="5" goto guide
if "%choice%"=="0" exit

echo 无效选项，请重试
goto menu

:init
echo.
echo [1/3] 初始化 Git 仓库...
git init
echo.
echo [2/3] 添加所有文件...
git add .
echo.
echo [3/3] 初始提交...
git commit -m "feat: iOS17 聊天室 v3.0"
echo.
echo ✅ Git 仓库初始化完成！
echo.
echo 下一步：上传到 GitHub
echo   git remote add origin https://github.com/你的用户名/chatroom.git
echo   git push -u origin main
echo.
pause
goto menu

:structure
echo.
echo 📁 目录结构：
tree /F /A
pause
goto menu

:local
echo.
echo 正在启动本地测试服务器...
echo.
echo ⚠️  注意：
echo   - 本地测试需要单独安装 partykit 后端
echo   - 如果只想测试前端 UI，可直接双击 index.html
echo.
echo 启动 PartyKit 后端（party 文件夹）...
cd party
if exist node_modules (
    echo PartyKit 依赖已安装
    npx partykit dev
) else (
    echo 正在安装 PartyKit 依赖...
    call npm install
    npx partykit dev
)
pause
goto menu

:deploy
echo.
echo ════════════════════════════════════════════
echo    部署说明
echo ════════════════════════════════════════════
echo.
echo  本地部署脚本无法直接推送到 GitHub，
echo  请按以下步骤手动操作：
echo.
echo  【Step 1】在 GitHub 上创建新仓库
echo    https://github.com/new
echo    仓库名：chatroom（私有）
echo.
echo  【Step 2】本地连接 GitHub
echo    git remote add origin https://github.com/你的用户名/chatroom.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo  【Step 3】启用 GitHub Pages
echo    仓库 Settings ^> Pages ^> Source: GitHub Actions
echo.
echo  【Step 4】配置 PartyKit
echo    1. 访问 partykit.io，用 GitHub 登录
echo    2. 创建项目，记住项目名
echo    3. 在 partykit.io/account 生成 Token
echo    4. 仓库 Settings ^> Secrets ^> New secret
echo       Name: PARTYKIT_TOKEN
echo       Secret: 粘贴 Token
echo.
echo  【Step 5】触发部署
echo    git add . ^&^& git commit -m "deploy" ^&^& git push
echo.
echo  完成后访问：
echo    前端：https://你的用户名.github.io/chatroom/
echo    后端：wss://你的项目名.partykit.dev
echo.
echo ════════════════════════════════════════════
echo.
pause
goto menu

:guide
type README.md
pause
goto menu
