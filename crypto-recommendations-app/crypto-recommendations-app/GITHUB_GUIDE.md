# دليل رفع تطبيق توصيات العملات الرقمية إلى GitHub

## نظرة عامة
هذا الدليل يشرح كيفية رفع مشروع تطبيق توصيات العملات الرقمية إلى GitHub وإنشاء ملف APK من خلال GitHub Actions.

## المتطلبات الأساسية

### 1. إنشاء حساب GitHub
- اذهب إلى [github.com](https://github.com)
- انقر على "Sign up" لإنشاء حساب جديد
- اتبع التعليمات لإكمال التسجيل

### 2. تثبيت Git
- **Windows**: حمل من [git-scm.com](https://git-scm.com/downloads)
- **macOS**: استخدم `brew install git` أو حمل من الموقع
- **Linux**: استخدم `sudo apt install git` (Ubuntu/Debian) أو `sudo yum install git` (CentOS/RHEL)

## خطوات رفع المشروع إلى GitHub

### الخطوة 1: إنشاء مستودع جديد على GitHub

1. **سجل الدخول إلى GitHub**
2. **انقر على زر "New" أو "+"** في الزاوية العلوية اليمنى
3. **اختر "New repository"**
4. **املأ تفاصيل المستودع**:
   - **Repository name**: `crypto-recommendations-app`
   - **Description**: `تطبيق أندرويد لتوصيات العملات الرقمية لمنصتي Binance و MEXC`
   - **Visibility**: اختر `Public` (عام) أو `Private` (خاص)
   - **لا تحدد** "Initialize this repository with a README" (لأننا لدينا ملفات جاهزة)
5. **انقر على "Create repository"**

### الخطوة 2: تحضير ملفات المشروع

قم بإنشاء مجلد جديد على جهازك وانسخ الملفات التالية إليه:

```
crypto-recommendations-app/
├── README.md
├── INSTALLATION.md
├── GITHUB_GUIDE.md
├── build-apk.sh
├── demo-data.json
├── capacitor.config.json
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── components/
├── android/
└── crypto-api/
    ├── src/
    │   ├── main.py
    │   └── routes/
    │       └── crypto.py
    ├── requirements.txt
    └── venv/
```

### الخطوة 3: رفع الملفات إلى GitHub

1. **افتح Terminal أو Command Prompt**
2. **انتقل إلى مجلد المشروع**:
   ```bash
   cd /path/to/crypto-recommendations-app
   ```

3. **تهيئة Git**:
   ```bash
   git init
   ```

4. **إضافة المستودع البعيد**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/crypto-recommendations-app.git
   ```
   (استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك)

5. **إضافة ملف .gitignore**:
   ```bash
   echo "node_modules/
   dist/
   .env
   *.log
   .DS_Store
   crypto-api/venv/
   crypto-api/src/database/
   android/app/build/
   android/.gradle/
   *.apk" > .gitignore
   ```

6. **إضافة جميع الملفات**:
   ```bash
   git add .
   ```

7. **تثبيت التغييرات**:
   ```bash
   git commit -m "Initial commit: تطبيق توصيات العملات الرقمية"
   ```

8. **رفع الملفات إلى GitHub**:
   ```bash
   git branch -M main
   git push -u origin main
   ```

## إنشاء GitHub Actions لبناء APK تلقائياً

### الخطوة 1: إنشاء ملف GitHub Actions

قم بإنشاء المجلد والملف التالي في مشروعك:

```bash
mkdir -p .github/workflows
```

### الخطوة 2: إنشاء ملف build.yml

أنشئ ملف `.github/workflows/build.yml` بالمحتوى التالي:

```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '11'
        
    - name: Setup Android SDK
      uses: android-actions/setup-android@v2
      
    - name: Install dependencies
      run: |
        npm install -g pnpm
        pnpm install
        
    - name: Build web app
      run: pnpm run build
      
    - name: Setup Capacitor
      run: |
        npx cap sync android
        
    - name: Build APK
      run: |
        cd android
        ./gradlew assembleDebug
        
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: crypto-recommendations-apk
        path: android/app/build/outputs/apk/debug/app-debug.apk
        
    - name: Create Release
      if: github.ref == 'refs/heads/main'
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: v1.0.${{ github.run_number }}
        release_name: Release v1.0.${{ github.run_number }}
        body: |
          تطبيق توصيات العملات الرقمية - الإصدار التلقائي
          
          الميزات:
          - توصيات ذكية للعملات الرقمية
          - دعم منصتي Binance و MEXC
          - تحليل فني متقدم
          - واجهة مستخدم سهلة الاستخدام
        draft: false
        prerelease: false
        
    - name: Upload Release Asset
      if: github.ref == 'refs/heads/main'
      uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ steps.create_release.outputs.upload_url }}
        asset_path: android/app/build/outputs/apk/debug/app-debug.apk
        asset_name: crypto-recommendations.apk
        asset_content_type: application/vnd.android.package-archive
```

### الخطوة 3: رفع ملف GitHub Actions

```bash
git add .github/workflows/build.yml
git commit -m "Add GitHub Actions for automatic APK build"
git push origin main
```

## تحميل ملف APK من GitHub

### الطريقة 1: من GitHub Actions (Artifacts)

1. **اذهب إلى مستودعك على GitHub**
2. **انقر على تبويب "Actions"**
3. **انقر على آخر workflow run**
4. **في قسم "Artifacts"، انقر على "crypto-recommendations-apk"**
5. **سيتم تحميل ملف ZIP يحتوي على APK**

### الطريقة 2: من Releases

1. **اذهب إلى مستودعك على GitHub**
2. **انقر على "Releases" في الشريط الجانبي**
3. **انقر على آخر إصدار**
4. **في قسم "Assets"، انقر على "crypto-recommendations.apk"**

## إعداد package.json

تأكد من وجود ملف `package.json` في المجلد الرئيسي:

```json
{
  "name": "crypto-recommendations-app",
  "version": "1.0.0",
  "description": "تطبيق أندرويد لتوصيات العملات الرقمية",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "lucide-react": "^0.263.1",
    "@capacitor/core": "^7.4.2",
    "@capacitor/android": "^7.4.2"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.4.2",
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^6.3.5"
  },
  "keywords": ["crypto", "recommendations", "android", "binance", "mexc"],
  "author": "Your Name",
  "license": "MIT"
}
```

## نصائح مهمة

### 1. أمان المشروع
- **لا تضع مفاتيح API** في الكود المرفوع إلى GitHub
- استخدم **GitHub Secrets** لحفظ المعلومات الحساسة
- تأكد من إضافة ملفات حساسة إلى `.gitignore`

### 2. إدارة الإصدارات
- استخدم **tags** لتمييز الإصدارات المختلفة
- اكتب **commit messages** واضحة ومفيدة
- استخدم **branches** للميزات الجديدة

### 3. التوثيق
- حافظ على تحديث ملف **README.md**
- أضف **screenshots** للتطبيق
- وثق أي تغييرات في **CHANGELOG.md**

## استكشاف الأخطاء

### مشكلة: فشل في بناء APK
**الحل**: تحقق من:
- إعدادات Android SDK
- إصدارات Node.js و Java
- ملفات Capacitor

### مشكلة: خطأ في رفع الملفات
**الحل**: تأكد من:
- صحة رابط المستودع
- صلاحيات الوصول
- حجم الملفات (GitHub يحدد 100MB للملف الواحد)

### مشكلة: GitHub Actions لا يعمل
**الحل**: تحقق من:
- صحة ملف `.github/workflows/build.yml`
- صلاحيات GitHub Actions في إعدادات المستودع
- متطلبات النظام في الـ workflow

## الخلاصة

باتباع هذه الخطوات، ستتمكن من:
1. رفع مشروع تطبيق توصيات العملات الرقمية إلى GitHub
2. إعداد بناء تلقائي لملف APK
3. تحميل ملف APK الجاهز من GitHub
4. مشاركة المشروع مع الآخرين

هذا يوفر لك نسخة احتياطية آمنة من المشروع وإمكانية الوصول إليه من أي مكان، بالإضافة إلى بناء تلقائي لملف APK عند كل تحديث.

