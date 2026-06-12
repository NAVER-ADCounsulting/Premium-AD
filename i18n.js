// ============================================================
// 다국어 (한국어 / English / 中文 / 日本語)
// - UI: 페이지 고정 문구
// - DICT: 데이터 값 번역 (data.js의 한국어 원문 → [영어, 중국어, 일본어])
//   data.js에 새 문구를 추가하면 여기에도 추가해야 번역됩니다.
//   (사전에 없으면 한국어 원문이 그대로 표시됩니다)
// ============================================================

const I18N = (() => {

  const UI = {
    ko: {
      docTitle: "네이버 보장형 광고 상품 안내",
      badge: "NAVER 보장형 DA",
      titleHtml: '네이버 <span class="accent">보장형 광고</span> 상품 안내',
      updated: "최종 업데이트",
      vatNote: "모든 단가는 VAT 별도 기준",
      changeNote: "단가 및 상품 구성은 변동될 수 있습니다",
      clickNote: "상품명을 누르면 레퍼런스 이미지를 볼 수 있습니다",
      cols: ["상품명", "단가", "판매방식", "벤치마크 노출수", "벤치마크 CTR", "프로모션", "비고"],
      footerHtml: "본 자료는 내부 안내용으로, 기재된 단가·벤치마크 효율은 집행 시점에 따라 달라질 수 있습니다. <strong>모든 단가는 VAT 별도 기준입니다.</strong><br>상세 조건 및 청약 문의는 담당자에게 연락 바랍니다.",
      refSuffix: " 레퍼런스",
      refBtn: "레퍼런스 이미지",
      imgPreparing: "레퍼런스 이미지 준비 중입니다.",
      loading: "불러오는 중...",
      pdBadge: "시간대별 단가",
      back: "← 상품 목록으로 돌아가기",
      pdTitle: name => `${name} 시간대별 단가`,
      saleLabel: "판매방식",
      ctrLabel: "벤치마크 CTR",
      ths: ["노출 시간대", "판매 단위", "공시 단가", "예상 노출량 / 구좌", "비고"],
      pdFooterHtml: "※ VAT 별도 단가입니다. 예상 노출량은 개런티되지 않는 최근 평균 예상치이며, 실제 집행 시 노출량은 이보다 많거나 적을 수 있습니다.<br>※ 특정 기간 진행되는 할인 프로모션은 반영되어 있지 않을 수 있습니다.",
      notFound: "상품을 찾을 수 없습니다.",
      emptySlots: "시간대별 단가 정보가 아직 입력되지 않았습니다."
    },
    en: {
      docTitle: "NAVER Guaranteed Ads Product Guide",
      badge: "NAVER Guaranteed DA",
      titleHtml: 'NAVER <span class="accent">Guaranteed Ads</span> Product Guide',
      updated: "Last updated",
      vatNote: "All rates exclude VAT",
      changeNote: "Rates and product lineup are subject to change",
      clickNote: "Click a product name to view its reference image",
      cols: ["Product", "Rate", "Sales Unit", "Benchmark Impressions", "Benchmark CTR", "Promotion", "Notes"],
      footerHtml: "This material is for internal guidance only; listed rates and benchmark metrics may vary by campaign timing. <strong>All rates exclude VAT.</strong><br>For detailed terms and booking inquiries, please contact the account manager.",
      refSuffix: " — Reference",
      refBtn: "Reference Image",
      imgPreparing: "Reference image coming soon.",
      loading: "Loading...",
      pdBadge: "Time-slot Rates",
      back: "← Back to product list",
      pdTitle: name => `${name} — Time-slot Rates`,
      saleLabel: "Sales unit",
      ctrLabel: "Benchmark CTR",
      ths: ["Time Slot", "Unit", "Listed Rate", "Est. Impressions / Slot", "Notes"],
      pdFooterHtml: "※ All rates exclude VAT. Estimated impressions are recent averages, are not guaranteed, and actual delivery may be higher or lower.<br>※ Limited-time promotional discounts may not be reflected.",
      notFound: "Product not found.",
      emptySlots: "Time-slot rates have not been entered yet."
    },
    zh: {
      docTitle: "NAVER保障型广告产品介绍",
      badge: "NAVER 保障型DA",
      titleHtml: 'NAVER <span class="accent">保障型广告</span> 产品介绍',
      updated: "最后更新",
      vatNote: "所有价格均不含VAT",
      changeNote: "价格及产品构成可能变动",
      clickNote: "点击产品名称可查看参考图片",
      cols: ["产品名称", "价格", "销售方式", "基准曝光量", "基准CTR", "促销", "备注"],
      footerHtml: "本资料仅供内部参考，所列价格及基准效果可能因投放时间而异。<strong>所有价格均不含VAT。</strong><br>详细条件及订购咨询请联系负责人。",
      refSuffix: " 参考图",
      refBtn: "参考图片",
      imgPreparing: "参考图片准备中。",
      loading: "加载中…",
      pdBadge: "分时段价格",
      back: "← 返回产品列表",
      pdTitle: name => `${name} 分时段价格`,
      saleLabel: "销售方式",
      ctrLabel: "基准CTR",
      ths: ["投放时段", "销售单位", "公示价格", "预计曝光量 / 广告位", "备注"],
      pdFooterHtml: "※ 所有价格均不含VAT。预计曝光量为近期平均预估值，不作保证，实际投放量可能更多或更少。<br>※ 限时促销折扣可能未反映在本表中。",
      notFound: "未找到该产品。",
      emptySlots: "分时段价格信息尚未录入。"
    },
    ja: {
      docTitle: "NAVER保証型広告 商品のご案内",
      badge: "NAVER 保証型DA",
      titleHtml: 'NAVER <span class="accent">保証型広告</span> 商品のご案内',
      updated: "最終更新",
      vatNote: "すべての価格はVAT別途です",
      changeNote: "価格および商品構成は変更される場合があります",
      clickNote: "商品名をクリックすると参考画像をご覧いただけます",
      cols: ["商品名", "価格", "販売方式", "ベンチマークインプレッション", "ベンチマークCTR", "プロモーション", "備考"],
      footerHtml: "本資料は社内参考用であり、記載の価格・ベンチマーク効率は出稿時期により異なる場合があります。<strong>すべての価格はVAT別途です。</strong><br>詳細条件およびお申し込みに関するお問い合わせは担当者までご連絡ください。",
      refSuffix: " 参考画像",
      refBtn: "参考画像",
      imgPreparing: "参考画像は準備中です。",
      loading: "読み込み中...",
      pdBadge: "時間帯別価格",
      back: "← 商品一覧に戻る",
      pdTitle: name => `${name} 時間帯別価格`,
      saleLabel: "販売方式",
      ctrLabel: "ベンチマークCTR",
      ths: ["掲載時間帯", "販売単位", "公示価格", "予想インプレッション / 枠", "備考"],
      pdFooterHtml: "※ すべての価格はVAT別途です。予想インプレッションは保証されない直近の平均予想値であり、実際の配信量は前後する場合があります。<br>※ 期間限定の割引プロモーションは反映されていない場合があります。",
      notFound: "商品が見つかりません。",
      emptySlots: "時間帯別価格はまだ入力されていません。"
    }
  };

  // 데이터 값 번역 사전: "한국어 원문": ["English", "中文", "日本語"]
  const DICT = {
    // 카테고리
    "네이버 · MO": ["NAVER · Mobile", "NAVER · 移动端", "NAVER · モバイル"],
    "네이버 · PC": ["NAVER · PC", "NAVER · PC端", "NAVER · PC"],
    "서비스 · 치지직": ["Services · CHZZK", "服务 · CHZZK", "サービス · CHZZK"],
    "서비스 · 지도": ["Services · Map", "服务 · 地图", "サービス · 地図"],
    "서비스 · Npay": ["Services · Npay", "服务 · Npay", "サービス · Npay"],
    "서비스 · 크림": ["Services · KREAM", "服务 · KREAM", "サービス · KREAM"],

    // 상품명
    "스페셜DA": ["Special DA", "Special DA", "Special DA"],
    "더블크라운": ["Double Crown", "Double Crown(双皇冠)", "Double Crown"],
    "트리플크라운": ["Triple Crown", "Triple Crown(三皇冠)", "Triple Crown"],
    "쇼케이스": ["Showcase", "Showcase", "Showcase"],
    "피드 1st (스포츠/엔터 탭)": ["Feed 1st\n(Sports/Entertainment tab)", "Feed 1st\n(体育/娱乐版块)", "Feed 1st\n(スポーツ/エンタメタブ)"],
    "타임보드": ["Timeboard", "Timeboard", "Timeboard"],
    "롤링보드": ["Rollingboard", "Rollingboard", "Rollingboard"],
    "헤드라인DA": ["Headline DA", "Headline DA", "Headline DA"],
    "PC 홈전면광고": ["PC Home Takeover", "PC首页全屏广告", "PCホーム全面広告"],
    "PC 야구홈 전면광고": ["PC Baseball Home Takeover", "PC棒球首页全屏广告", "PC野球ホーム全面広告"],
    "퍼스트뷰 패키지": ["First View Package", "First View套餐", "First Viewパッケージ"],
    "인스트림 - 15초 skip": ["In-stream — 15s skip", "In-stream — 15秒可跳过", "インストリーム — 15秒スキップ"],
    "인스트림 - 5초 skip": ["In-stream — 5s skip", "In-stream — 5秒可跳过", "インストリーム — 5秒スキップ"],
    "챗캐치배너": ["Chat Catch Banner", "Chat Catch横幅", "チャットキャッチバナー"],
    "배너 패키지": ["Banner Package", "横幅套餐", "バナーパッケージ"],
    "스플래시 패키지": ["Splash Package", "开屏广告套餐", "スプラッシュパッケージ"],

    // 판매방식
    "시간 단위": ["Hourly", "按小时", "時間単位"],
    "2시간 단위": ["2-hour blocks", "按2小时", "2時間単位"],
    "일 단위": ["Daily", "按天", "日単位"],
    "주 단위": ["Weekly", "按周", "週単位"],
    "반일 단위": ["Half-day", "按半天", "半日単位"],
    "CPM 구매": ["CPM", "CPM购买", "CPM購入"],

    // 공통 값
    "시간대별 상이": ["Varies by time slot", "按时段不同", "時間帯により異なる"],
    "평일/휴일 상이": ["Weekday/holiday rates", "工作日/节假日不同", "平日/休日により異なる"],
    "데이터 미제공": ["Data not provided", "不提供数据", "データ非提供"],
    "스페셜DA 참고": ["See Special DA", "参考Special DA", "Special DA参照"],
    "타임보드 참고": ["See Timeboard", "参考Timeboard", "Timeboard参照"],
    "인스트림 15초 skip 참고": ["See In-stream 15s skip", "参考In-stream 15秒可跳过", "インストリーム15秒スキップ参照"],

    // 단가·노출수·비고 문구
    "스페셜DA + 10,000,000원": ["Special DA\n+ KRW 10,000,000", "Special DA\n+ KRW 10,000,000", "Special DA\n+ KRW 10,000,000"],
    "*성별 구좌 집행 시 +5,000,000원": ["*+KRW 5,000,000 for gender-targeted slots", "*按性别投放时加收KRW 5,000,000", "*性別ターゲティング枠は+KRW 5,000,000"],
    "*이미지형 기준": ["*Based on image format", "*以图片形式为准", "*画像タイプ基準"],
    "*홈우측 상품": ["*Home right-side placement", "*首页右侧广告位", "*ホーム右側枠"],
    "*지면 평균": ["*Average across placements", "*版面平均值", "*掲載面平均"],
    "*좌우스킨 기준": ["*Based on left/right skin", "*以左右两侧皮肤为准", "*左右スキン基準"],
    "*스포츠: 110,000~170,000": ["*Sports: 110,000~170,000", "*体育: 110,000~170,000", "*スポーツ: 110,000~170,000"],
    "*엔터: 140,000~220,000": ["*Entertainment: 140,000~220,000", "*娱乐: 140,000~220,000", "*エンタメ: 140,000~220,000"],
    "0~6시 2시간 단위 판매": ["00–06h sold in 2-hour blocks", "0~6点按2小时单位销售", "0~6時は2時間単位で販売"],
    "10·11·18·19시 구좌는 성별 단위 집행 구좌": ["10/11/18/19h slots run with gender targeting", "10·11·18·19点时段为按性别投放的广告位", "10·11·18·19時の枠は性別ターゲティング配信枠"],
    "동영상형 집행 시 할증": ["Surcharge applies for video format", "投放视频形式时加收费用", "動画タイプ配信時は割増"],
    "최소 2달 전 논의 필요": ["Requires discussion at least 2 months in advance", "需至少提前2个月洽谈", "最低2ヶ月前の相談が必要"],
    "기념일·시즈널리티 연계 필요": ["Must tie into anniversaries / seasonal moments", "需结合纪念日·季节性主题", "記念日・シーズナリティとの連携が必要"],
    "소재 네이버 제작": ["Creative produced by NAVER", "素材由NAVER制作", "素材はNAVERが制作"],
    "일반(4번째 탭) 50,000,000원": ["Standard (4th tab)\nKRW 50,000,000", "普通版(第4个标签页)\nKRW 50,000,000", "一般(4番目のタブ)\nKRW 50,000,000"],
    "프리미엄(2번째 탭) 200,000,000원": ["Premium (2nd tab)\nKRW 200,000,000", "高级版(第2个标签页)\nKRW 200,000,000", "プレミアム(2番目のタブ)\nKRW 200,000,000"],
    "일반 2,000,000": ["Standard 2,000,000", "普通版 2,000,000", "一般 2,000,000"],
    "프리미엄 7,500,000": ["Premium 7,500,000", "高级版 7,500,000", "プレミアム 7,500,000"],
    "프리미엄 100,000,000원": ["Premium\nKRW 100,000,000", "高级版\nKRW 100,000,000", "プレミアム\nKRW 100,000,000"],
    "0~8시 4시간 단위 판매": ["00–08h sold in 4-hour blocks", "0~8点按4小时单位销售", "0~8時は4時間単位で販売"],
    "CPM 구매 가능": ["CPM available", "可按CPM购买", "CPM購入可能"],
    "0시~14시, 14시~24시": ["00–14h, 14–24h", "0点~14点, 14点~24点", "0時~14時, 14時~24時"],
    "평일 30,000,000~35,000,000": ["Weekdays 30,000,000~35,000,000", "工作日 30,000,000~35,000,000", "平日 30,000,000~35,000,000"],
    "휴일 12,000,000~13,000,000": ["Holidays 12,000,000~13,000,000", "节假日 12,000,000~13,000,000", "休日 12,000,000~13,000,000"],
    "7/19까지 판매 후 상품 스펙 변경": ["Sold until Jul 19; specs change afterward", "销售至7月19日，之后产品规格变更", "7/19まで販売後、商品スペック変更"],
    "최소 구매단가 1,000,000원": ["Minimum purchase KRW 1,000,000", "最低购买金额KRW 1,000,000", "最低購入金額 KRW 1,000,000"],
    "월요일~일요일 단위로 구매": ["Purchased in Monday–Sunday units", "以周一至周日为单位购买", "月曜~日曜単位で購入"],
    "스마트채널 지면만 클릭 가능": ["Click-through only on Smart Channel placement", "仅Smart Channel版位可点击", "Smart Channel面のみクリック可能"],
    "일반형 30,000,000원": ["Standard KRW 30,000,000", "普通型 KRW 30,000,000", "一般型 KRW 30,000,000"],
    "특수형 35,000,000원": ["Special KRW 35,000,000", "特殊型 KRW 35,000,000", "特殊型 KRW 35,000,000"],
    "플로팅형 42,000,000원": ["Floating KRW 42,000,000", "悬浮型 KRW 42,000,000", "フローティング型 KRW 42,000,000"],

    // 시간대별 단가 페이지
    "평일": ["Weekdays", "工作日", "平日"],
    "휴일": ["Holidays", "节假日", "休日"],
    "평일·휴일 공통": ["Weekdays & Holidays", "工作日·节假日通用", "平日・休日共通"],
    "반일": ["Half day", "半天", "半日"],
    "00~14시 / 14~24시": ["00–14h / 14–24h", "0~14点 / 14~24点", "00~14時 / 14~24時"],
    "성별 타겟팅 전용 (남녀 각 1구좌)": ["Gender targeting only (1 slot each for men/women)", "性别定向专用（男女各1个广告位）", "性別ターゲティング専用（男女各1枠）"],
    "각 1구좌": ["1 slot each", "各1个广告位", "各1枠"],
    "0~6시는 2시간 단위 판매": ["00–06h sold in 2-hour blocks", "0~6点按2小时单位销售", "0~6時は2時間単位で販売"],
    "10·11·18·19시는 성별 타겟팅 구좌 전용 시간대 (남녀 각 1구좌)": ["10/11/18/19h are gender-targeting-only slots (1 slot each for men/women)", "10·11·18·19点为性别定向专用时段（男女各1个广告位）", "10·11·18·19時は性別ターゲティング専用時間帯（男女各1枠）"],
    "0~8시는 4시간 단위 판매": ["00–08h sold in 4-hour blocks", "0~8点按4小时单位销售", "0~8時は4時間単位で販売"],
    "CPT 일 3구좌 판매 (동일 광고주 3구좌, 연속 집행 가능)": ["3 CPT slots sold per day (same advertiser may run all 3 consecutively)", "CPT每日销售3个广告位（同一广告主可连续投放3个）", "CPTは1日3枠販売（同一広告主が3枠連続配信可能）"],
    "CPM 구매 가능: CPM 3,200원": ["CPM available: KRW 3,200", "可按CPM购买: CPM KRW 3,200", "CPM購入可能: CPM KRW 3,200"],
    "반일 단위 판매 (00~14시 / 14~24시 각 1구좌)": ["Sold in half-day units (1 slot each for 00–14h / 14–24h)", "按半天销售（0~14点/14~24点各1个广告位）", "半日単位販売（00~14時 / 14~24時 各1枠）"],

    // Npay / 크림 카드
    "Npay 광고 상품": ["Npay Ad Products", "Npay广告产品", "Npay広告商品"],
    "크림(KREAM) 광고 상품": ["KREAM Ad Products", "KREAM广告产品", "KREAM広告商品"],
    "상품소개 · 미디어믹스 문서로 이동": ["Product intro & media mix documents", "前往产品介绍·媒体组合文档", "商品紹介・メディアミックス資料へ"],
    "상품소개 · 게임업종 프로모션 문서로 이동": ["Product intro & gaming promotion documents", "前往产品介绍·游戏行业促销文档", "商品紹介・ゲーム業界プロモーション資料へ"],
    "상품소개": ["Product Intro", "产品介绍", "商品紹介"],
    "미디어믹스 (v20260602)": ["Media Mix (v20260602)", "媒体组合 (v20260602)", "メディアミックス (v20260602)"],
    "게임업종 프로모션": ["Gaming Promotion", "游戏行业促销", "ゲーム業界プロモーション"],
    "Npay 프리미엄 패키지": ["Npay Premium Package", "Npay高级套餐", "Npayプレミアムパッケージ"]
  };

  const LANG_IDX = { en: 0, zh: 1, ja: 2 };

  // 정규식 기반 번역 (사전에 없는 패턴형 문구)
  function trPattern(line, lang) {
    let m;
    // "9,000,000원" / "9,000,000~13,000,000원" (모든 언어 KRW 표기)
    if ((m = line.match(/^([\d,]+(?:~[\d,]+)?)원$/)))
      return `KRW ${m[1]}`;
    // "CPM 13,000원"
    if ((m = line.match(/^CPM ([\d,]+)원$/)))
      return `CPM KRW ${m[1]}`;
    // "00~04시"
    if ((m = line.match(/^(\d{2})~(\d{2})시$/))) {
      if (lang === "en") return `${m[1]}:00–${m[2]}:00`;
      if (lang === "zh") return `${m[1]}~${m[2]}点`;
      return `${m[1]}~${m[2]}時`;
    }
    // "1시간" / "2시간" / "4시간"
    if ((m = line.match(/^(\d+)시간$/))) {
      if (lang === "en") return `${m[1]} hour${m[1] === "1" ? "" : "s"}`;
      if (lang === "zh") return `${m[1]}小时`;
      return `${m[1]}時間`;
    }
    return null;
  }

  // 데이터 값 번역 (여러 줄이면 줄 단위로)
  function tr(value, lang) {
    if (!value || lang === "ko") return value;
    const idx = LANG_IDX[lang];
    return String(value).split("\n").map(line => {
      const t = line.trim();
      if (DICT[t]) return DICT[t][idx];
      const p = trPattern(t, lang);
      return p !== null ? p : line;
    }).join("\n")
      // "KRW 9,000,000"이 중간에서 줄바꿈되지 않도록 (NBSP)
      .replace(/KRW (\d)/g, "KRW $1");
  }

  const LANG_LABELS = { ko: "한국어", en: "English", zh: "中文", ja: "日本語" };

  function getLang() {
    const saved = localStorage.getItem("ad-lang");
    return UI[saved] ? saved : "ko";
  }
  function setLang(lang) {
    localStorage.setItem("ad-lang", lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  }

  return { UI, tr, getLang, setLang, LANG_LABELS };
})();
