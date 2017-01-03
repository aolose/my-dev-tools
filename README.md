这个应用可以添加CMD命令按钮和配置上传按钮

可以配置多个配置方案

方便开发时候快速启动和部署

###Screenshot
![1](1.png)

![2](2.png)
###Preparation
``` 
npm i -g electron 
npm i -g electron-packager
```
####Run
```
cd my-dev-tools/app
npm i
electron .
```
####Package
```
cd my-dev-tools
electron-packager app --platform=win32 --arch=x64 --icon=build/icon.ico --version=1.4.13 --overwrite
```