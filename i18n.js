// ============================================================
// 다국어 (한국어 / English / 中文)
// - UI: 페이지 고정 문구
// - DICT: 데이터 값 번역 (data.js의 한국어 원문 → [영어, 중국어])
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
    }
  };

  // 데이터 값 번역 사전: "한국어 원문": ["English", "中文"]
  const DICT = {
    // 카테고리
    "네이버 · MO": ["NAVER · Mobile", "NAVER · 移动端"],
    "네이버 · PC": ["NAVER · PC", "NAVER · PC端"],
    "서비스 · 치지직": ["Services · CHZZK", "服务 · CHZZK"],
    "서비스 · 지도": ["Services · Map", "服务 · 地图"],
    "서비스 · Npay": ["Services · Npay", "服务 · Npay"],
    "서비스 · 크림": ["Services · KREAM", "服务 · KREAM"],

    // 상품명
    "스페셜DA": ["Special DA", "Special DA"],
    "더블크라운": ["Double Crown", "Double Crown(双皇冠)"],
    "트리플크라운": ["Triple Crown", "Triple Crown(三皇冠)"],
    "쇼케이스": ["Showcase", "Showcase"],
    "피드 1st (스포츠/엔터 탭)": ["Feed 1st\n(Sports/Entertainment tab)", "Feed 1st\n(体育/娱乐版块)"],
    "타임보드": ["Timeboard", "Timeboard"],
    "롤링보드": ["Rollingboard", "Rollingboard"],
    "헤드라인DA": ["Headline DA", "Headline DA"],
    "PC 홈전면광고": ["PC Home Takeover", "PC首页全屏广告"],
    "PC 야구홈 전면광고": ["PC Baseball Home Takeover", "PC棒球首页全屏广告"],
    "퍼스트뷰 패키지": ["First View Package", "First View套餐"],
    "인스트림 - 15초 skip": ["In-stream — 15s skip", "In-stream — 15秒可跳过"],
    "인스트림 - 5초 skip": ["In-stream — 5s skip", "In-stream — 5秒可跳过"],
    "챗캐치배너": ["Chat Catch Banner", "Chat Catch横幅"],
    "배너 패키지": ["Banner Package", "横幅套餐"],
    "스플래시 패키지": ["Splash Package", "开屏广告套餐"],

    // 판매방식
    "시간 단위": ["Hourly", "按小时"],
    "2시간 단위": ["2-hour blocks", "按2小时"],
    "일 단위": ["Daily", "按天"],
    "주 단위": ["Weekly", "按周"],
    "반일 단위": ["Half-day", "按半天"],
    "CPM 구매": ["CPM", "CPM购买"],

    // 공통 값
    "시간대별 상이": ["Varies by time slot", "按时段不同"],
    "평일/휴일 상이": ["Weekday/holiday rates", "工作日/节假日不同"],
    "데이터 미제공": ["Data not provided", "不提供数据"],
    "스페셜DA 참고": ["See Special DA", "参考Special DA"],
    "타임보드 참고": ["See Timeboard", "参考Timeboard"],
    "인스트림 15초 skip 참고": ["See In-stream 15s skip", "参考In-stream 15秒可跳过"],

    // 단가·노출수·비고 문구
    "스페셜DA + 10,000,000원": ["Special DA\n+ KRW 10,000,000", "Special DA\n+ KRW 10,000,000"],
    "*성별 구좌 집행 시 +5,000,000원": ["*+KRW 5,000,000 for gender-targeted slots", "*按性别投放时加收KRW 5,000,000"],
    "*이미지형 기준": ["*Based on image format", "*以图片形式为准"],
    "*홈우측 상품": ["*Home right-side placement", "*首页右侧广告位"],
    "*지면 평균": ["*Average across placements", "*版面平均值"],
    "*좌우스킨 기준": ["*Based on left/right skin", "*以左右两侧皮肤为准"],
    "*스포츠: 110,000~170,000": ["*Sports: 110,000~170,000", "*体育: 110,000~170,000"],
    "*엔터: 140,000~220,000": ["*Entertainment: 140,000~220,000", "*娱乐: 140,000~220,000"],
    "0~6시 2시간 단위 판매": ["00–06h sold in 2-hour blocks", "0~6点按2小时单位销售"],
    "10·11·18·19시 구좌는 성별 단위 집행 구좌": ["10/11/18/19h slots run with gender targeting", "10·11·18·19点时段为按性别投放的广告位"],
    "동영상형 집행 시 할증": ["Surcharge applies for video format", "投放视频形式时加收费用"],
    "최소 2달 전 논의 필요": ["Requires discussion at least 2 months in advance", "需至少提前2个月洽谈"],
    "기념일·시즈널리티 연계 필요": ["Must tie into anniversaries / seasonal moments", "需结合纪念日·季节性主题"],
    "소재 네이버 제작": ["Creative produced by NAVER", "素材由NAVER制作"],
    "일반(4번째 탭) 50,000,000원": ["Standard (4th tab)\nKRW 50,000,000", "普通版(第4个标签页)\nKRW 50,000,000"],
    "프리미엄(2번째 탭) 200,000,000원": ["Premium (2nd tab)\nKRW 200,000,000", "高级版(第2个标签页)\nKRW 200,000,000"],
    "일반 2,000,000": ["Standard 2,000,000", "普通版 2,000,000"],
    "프리미엄 7,500,000": ["Premium 7,500,000", "高级版 7,500,000"],
    "프리미엄 100,000,000원": ["Premium\nKRW 100,000,000", "高级版\nKRW 100,000,000"],
    "0~8시 4시간 단위 판매": ["00–08h sold in 4-hour blocks", "0~8点按4小时单位销售"],
    "CPM 구매 가능": ["CPM available", "可按CPM购买"],
    "0시~14시, 14시~24시": ["00–14h, 14–24h", "0点~14点, 14点~24点"],
    "평일 30,000,000~35,000,000": ["Weekdays 30,000,000~35,000,000", "工作日 30,000,000~35,000,000"],
    "휴일 12,000,000~13,000,000": ["Holidays 12,000,000~13,000,000", "节假日 12,000,000~13,000,000"],
    "7/19까지 판매 후 상품 스펙 변경": ["Sold until Jul 19; specs change afterward", "销售至7月19日，之后产品规格变更"],
    "최소 구매단가 1,000,000원": ["Minimum purchase KRW 1,000,000", "最低购买金额KRW 1,000,000"],
    "월요일~일요일 단위로 구매": ["Purchased in Monday–Sunday units", "以周一至周日为单位购买"],
    "스마트채널 지면만 클릭 가능": ["Click-through only on Smart Channel placement", "仅Smart Channel版位可点击"],
    "일반형 30,000,000원": ["Standard KRW 30,000,000", "普通型 KRW 30,000,000"],
    "특수형 35,000,000원": ["Special KRW 35,000,000", "特殊型 KRW 35,000,000"],
    "플로팅형 42,000,000원": ["Floating KRW 42,000,000", "悬浮型 KRW 42,000,000"],

    // 시간대별 단가 페이지
    "평일": ["Weekdays", "工作日"],
    "휴일": ["Holidays", "节假日"],
    "평일·휴일 공통": ["Weekdays & Holidays", "工作日·节假日通用"],
    "반일": ["Half day", "半天"],
    "00~14시 / 14~24시": ["00–14h / 14–24h", "0~14点 / 14~24点"],
    "성별 타겟팅 전용 (남녀 각 1구좌)": ["Gender targeting only (1 slot each for men/women)", "性别定向专用（男女各1个广告位）"],
    "각 1구좌": ["1 slot each", "各1个广告位"],
    "0~6시는 2시간 단위 판매": ["00–06h sold in 2-hour blocks", "0~6点按2小时单位销售"],
    "10·11·18·19시는 성별 타겟팅 구좌 전용 시간대 (남녀 각 1구좌)": ["10/11/18/19h are gender-targeting-only slots (1 slot each for men/women)", "10·11·18·19点为性别定向专用时段（男女各1个广告位）"],
    "0~8시는 4시간 단위 판매": ["00–08h sold in 4-hour blocks", "0~8点按4小时单位销售"],
    "CPT 일 3구좌 판매 (동일 광고주 3구좌, 연속 집행 가능)": ["3 CPT slots sold per day (same advertiser may run all 3 consecutively)", "CPT每日销售3个广告位（同一广告主可连续投放3个）"],
    "CPM 구매 가능: CPM 3,200원": ["CPM available: KRW 3,200", "可按CPM购买: CPM KRW 3,200"],
    "반일 단위 판매 (00~14시 / 14~24시 각 1구좌)": ["Sold in half-day units (1 slot each for 00–14h / 14–24h)", "按半天销售（0~14点/14~24点各1个广告位）"],

    // Npay / 크림 카드
    "Npay 광고 상품": ["Npay Ad Products", "Npay广告产品"],
    "크림(KREAM) 광고 상품": ["KREAM Ad Products", "KREAM广告产品"],
    "상품소개 · 미디어믹스 문서로 이동": ["Product intro & media mix documents", "前往产品介绍·媒体组合文档"],
    "상품소개 · 게임업종 프로모션 문서로 이동": ["Product intro & gaming promotion documents", "前往产品介绍·游戏行业促销文档"],
    "상품소개": ["Product Intro", "产品介绍"],
    "미디어믹스 (v20260602)": ["Media Mix (v20260602)", "媒体组合 (v20260602)"],
    "게임업종 프로모션": ["Gaming Promotion", "游戏行业促销"],
    "Npay 프리미엄 패키지": ["Npay Premium Package", "Npay高级套餐"]
  };

  // 정규식 기반 번역 (사전에 없는 패턴형 문구)
  function trPattern(line, lang) {
    let m;
    // "9,000,000원" / "9,000,000~13,000,000원" (중국어도 KRW 표기)
    if ((m = line.match(/^([\d,]+(?:~[\d,]+)?)원$/)))
      return `KRW ${m[1]}`;
    // "CPM 13,000원"
    if ((m = line.match(/^CPM ([\d,]+)원$/)))
      return `CPM KRW ${m[1]}`;
    // "00~04시"
    if ((m = line.match(/^(\d{2})~(\d{2})시$/)))
      return lang === "en" ? `${m[1]}:00–${m[2]}:00` : `${m[1]}~${m[2]}点`;
    // "1시간" / "2시간" / "4시간"
    if ((m = line.match(/^(\d+)시간$/)))
      return lang === "en" ? `${m[1]} hour${m[1] === "1" ? "" : "s"}` : `${m[1]}小时`;
    return null;
  }

  // 데이터 값 번역 (여러 줄이면 줄 단위로)
  function tr(value, lang) {
    if (!value || lang === "ko") return value;
    const idx = lang === "en" ? 0 : 1;
    return String(value).split("\n").map(line => {
      const t = line.trim();
      if (DICT[t]) return DICT[t][idx];
      const p = trPattern(t, lang);
      return p !== null ? p : line;
    }).join("\n")
      // "KRW 9,000,000"이 중간에서 줄바꿈되지 않도록 (NBSP)
      .replace(/KRW (\d)/g, "KRW $1");
  }

  const LANG_LABELS = { ko: "한국어", en: "English", zh: "中文" };

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
