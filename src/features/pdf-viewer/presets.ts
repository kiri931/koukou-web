export interface PdfQuizPreset {
  id: string;
  category: string;
  label: string;
  pdfUrl: string;
  suggestedTitle: string;
}

export const PDF_QUIZ_PRESETS: PdfQuizPreset[] = [
  {
    id: 'ip-r7-question',
    category: 'ITパスポート',
    label: '令和7年度 公開問題（問題冊子）',
    pdfUrl: 'https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_qs.pdf',
    suggestedTitle: 'ITパスポート 令和7年度 公開問題',
  },
  {
    id: 'ip-r7-answer',
    category: 'ITパスポート',
    label: '令和7年度 公開問題（解答例）',
    pdfUrl: 'https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2025r07_ip_ans.pdf',
    suggestedTitle: 'ITパスポート 令和7年度 解答例',
  },
  {
    id: 'ip-r6-question',
    category: 'ITパスポート',
    label: '令和6年度 公開問題（問題冊子）',
    pdfUrl: 'https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_qs.pdf',
    suggestedTitle: 'ITパスポート 令和6年度 公開問題',
  },
  {
    id: 'ip-r6-answer',
    category: 'ITパスポート',
    label: '令和6年度 公開問題（解答例）',
    pdfUrl: 'https://www3.jitec.ipa.go.jp/JitesCbt/html/openinfo/pdf/questions/2024r06_ip_ans.pdf',
    suggestedTitle: 'ITパスポート 令和6年度 解答例',
  },
  {
    id: 'sg-r7-question',
    category: 'IPA（SG/FE）',
    label: '情報セキュリティマネジメント 令和7年度 公開問題',
    pdfUrl: 'https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_sg_qs.pdf',
    suggestedTitle: 'SG 令和7年度 公開問題',
  },
  {
    id: 'fe-r7-a-question',
    category: 'IPA（SG/FE）',
    label: '基本情報技術者 令和7年度 科目A 公開問題',
    pdfUrl: 'https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_a_qs.pdf',
    suggestedTitle: '基本情報技術者 令和7年度 科目A 公開問題',
  },
  {
    id: 'fe-r7-b-question',
    category: 'IPA（SG/FE）',
    label: '基本情報技術者 令和7年度 科目B 公開問題',
    pdfUrl: 'https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/tbl5kb0000005r9r-att/2025r07_fe_kamoku_b_qs.pdf',
    suggestedTitle: '基本情報技術者 令和7年度 科目B 公開問題',
  },
  {
    id: 'zensho-info-guide',
    category: '全商 情報処理検定',
    label: '情報処理検定 新科目手引き（サンプル問題あり）',
    pdfUrl: 'https://zensho.or.jp/websystem/joho_tebiki_johokiso_johoshori_1-1_2026_01.pdf',
    suggestedTitle: '全商 情報処理検定 手引き・サンプル問題',
  },
  {
    id: 'zenkoukyo-72joho-kekka',
    category: '全工協 情報技術検定',
    label: '第72回 情報技術検定 結果',
    pdfUrl: 'https://zenkoukyo.or.jp/web/content/uploads/72joho_kekka.pdf',
    suggestedTitle: '全工協 情報技術検定 第72回 結果',
  },
];
