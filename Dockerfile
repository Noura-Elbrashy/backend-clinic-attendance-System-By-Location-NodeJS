# 1. اختيار نسخة Node مناسبة
FROM node:20.19.2

# 2. تحديد مكان العمل داخل الكونتينر
WORKDIR /app

# 3. نسخ ملفات package.json و package-lock.json
COPY package*.json ./

# 4. تثبيت الباكج بدون devDependencies
RUN npm install --production

# 5. نسخ باقي الملفات للمشروع
COPY . .

# 6. تحديد البورت اللي هيفتحه السيرفر
EXPOSE 5000

# 7. الأمر اللي بيشغل السيرفر
CMD ["npm", "start"]
