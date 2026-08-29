export interface Prefecture {
  code: string;
  name: string;
  nameJa: string;
  latitude: number;
  longitude: number;
}

/** Japan's 47 prefectures with approximate center coordinates (capitals). */
export const JAPAN_PREFECTURES: Prefecture[] = [
  { code: "hokkaido", name: "Hokkaidō", nameJa: "北海道", latitude: 43.06, longitude: 141.35 },
  { code: "aomori", name: "Aomori", nameJa: "青森県", latitude: 40.82, longitude: 140.74 },
  { code: "iwate", name: "Iwate", nameJa: "岩手県", latitude: 39.70, longitude: 141.15 },
  { code: "miyagi", name: "Miyagi", nameJa: "宮城県", latitude: 38.27, longitude: 140.87 },
  { code: "akita", name: "Akita", nameJa: "秋田県", latitude: 39.72, longitude: 140.10 },
  { code: "yamagata", name: "Yamagata", nameJa: "山形県", latitude: 38.24, longitude: 140.36 },
  { code: "fukushima", name: "Fukushima", nameJa: "福島県", latitude: 37.75, longitude: 140.47 },
  { code: "ibaraki", name: "Ibaraki", nameJa: "茨城県", latitude: 36.34, longitude: 140.45 },
  { code: "tochigi", name: "Tochigi", nameJa: "栃木県", latitude: 36.57, longitude: 139.88 },
  { code: "gunma", name: "Gunma", nameJa: "群馬県", latitude: 36.39, longitude: 139.06 },
  { code: "saitama", name: "Saitama", nameJa: "埼玉県", latitude: 35.86, longitude: 139.65 },
  { code: "chiba", name: "Chiba", nameJa: "千葉県", latitude: 35.61, longitude: 140.12 },
  { code: "tokyo", name: "Tōkyō", nameJa: "東京都", latitude: 35.69, longitude: 139.69 },
  { code: "kanagawa", name: "Kanagawa", nameJa: "神奈川県", latitude: 35.45, longitude: 139.64 },
  { code: "niigata", name: "Niigata", nameJa: "新潟県", latitude: 37.90, longitude: 139.02 },
  { code: "toyama", name: "Toyama", nameJa: "富山県", latitude: 36.70, longitude: 137.21 },
  { code: "ishikawa", name: "Ishikawa", nameJa: "石川県", latitude: 36.59, longitude: 136.63 },
  { code: "fukui", name: "Fukui", nameJa: "福井県", latitude: 36.07, longitude: 136.22 },
  { code: "yamanashi", name: "Yamanashi", nameJa: "山梨県", latitude: 35.66, longitude: 138.57 },
  { code: "nagano", name: "Nagano", nameJa: "長野県", latitude: 36.65, longitude: 138.18 },
  { code: "gifu", name: "Gifu", nameJa: "岐阜県", latitude: 35.39, longitude: 136.72 },
  { code: "shizuoka", name: "Shizuoka", nameJa: "静岡県", latitude: 34.98, longitude: 138.38 },
  { code: "aichi", name: "Aichi", nameJa: "愛知県", latitude: 35.18, longitude: 136.91 },
  { code: "mie", name: "Mie", nameJa: "三重県", latitude: 34.73, longitude: 136.51 },
  { code: "shiga", name: "Shiga", nameJa: "滋賀県", latitude: 35.00, longitude: 135.87 },
  { code: "kyoto", name: "Kyōto", nameJa: "京都府", latitude: 35.02, longitude: 135.76 },
  { code: "osaka", name: "Ōsaka", nameJa: "大阪府", latitude: 34.69, longitude: 135.52 },
  { code: "hyogo", name: "Hyōgo", nameJa: "兵庫県", latitude: 34.69, longitude: 135.20 },
  { code: "nara", name: "Nara", nameJa: "奈良県", latitude: 34.69, longitude: 135.83 },
  { code: "wakayama", name: "Wakayama", nameJa: "和歌山県", latitude: 34.23, longitude: 135.17 },
  { code: "tottori", name: "Tottori", nameJa: "鳥取県", latitude: 35.50, longitude: 134.24 },
  { code: "shimane", name: "Shimane", nameJa: "島根県", latitude: 35.47, longitude: 133.05 },
  { code: "okayama", name: "Okayama", nameJa: "岡山県", latitude: 34.66, longitude: 133.93 },
  { code: "hiroshima", name: "Hiroshima", nameJa: "広島県", latitude: 34.40, longitude: 132.46 },
  { code: "yamaguchi", name: "Yamaguchi", nameJa: "山口県", latitude: 34.19, longitude: 131.47 },
  { code: "tokushima", name: "Tokushima", nameJa: "徳島県", latitude: 34.07, longitude: 134.56 },
  { code: "kagawa", name: "Kagawa", nameJa: "香川県", latitude: 34.34, longitude: 134.04 },
  { code: "ehime", name: "Ehime", nameJa: "愛媛県", latitude: 33.84, longitude: 132.77 },
  { code: "kochi", name: "Kōchi", nameJa: "高知県", latitude: 33.56, longitude: 133.53 },
  { code: "fukuoka", name: "Fukuoka", nameJa: "福岡県", latitude: 33.61, longitude: 130.42 },
  { code: "saga", name: "Saga", nameJa: "佐賀県", latitude: 33.25, longitude: 130.30 },
  { code: "nagasaki", name: "Nagasaki", nameJa: "長崎県", latitude: 32.74, longitude: 129.87 },
  { code: "kumamoto", name: "Kumamoto", nameJa: "熊本県", latitude: 32.79, longitude: 130.74 },
  { code: "oita", name: "Ōita", nameJa: "大分県", latitude: 33.24, longitude: 131.61 },
  { code: "miyazaki", name: "Miyazaki", nameJa: "宮崎県", latitude: 31.91, longitude: 131.42 },
  { code: "kagoshima", name: "Kagoshima", nameJa: "鹿児島県", latitude: 31.56, longitude: 130.56 },
  { code: "okinawa", name: "Okinawa", nameJa: "沖縄県", latitude: 26.21, longitude: 127.68 },
];

/** National view center/zoom for the dashboard map. */
export const JAPAN_NATIONAL = {
  latitude: 37.5,
  longitude: 137.0,
  latitudeDelta: 16,
  longitudeDelta: 16,
};
