export type ProductCategory =
  | 'outdoor'
  | 'wall'
  | 'cabinet'
  | 'floor'
  | 'profile';

export interface Product {
  slug: string;
  name: string;
  englishName: string;
  category: ProductCategory;
  summary: string;
  tagline: string;
  featureIntroduction?: string;
  image: string;
  features: Array<{ title: string; description: string }>;
  specifications: Array<[string, string]>;
  applications: string[];
}

const image = (fileName: string) => `/website/images/${fileName}.jpg`;

const standardFeatures = (productName: string, highlights: string[]) => [
  {
    title: '环保安心',
    description: `严选环保原料与稳定工艺，${productName}满足健康空间对安全与质感的双重期待。`,
  },
  {
    title: highlights[0],
    description: highlights[1],
  },
  {
    title: highlights[2],
    description: highlights[3],
  },
  {
    title: '专业服务',
    description:
      '提供选材建议、图纸深化、安装指导与售后支持，让每一个细节准确落地。',
  },
];

export const productCategories: Array<{
  value: ProductCategory | 'all';
  label: string;
}> = [
  { value: 'all', label: '全部产品' },
  { value: 'wall', label: '墙面装饰' },
  { value: 'outdoor', label: '户外景观' },
  { value: 'floor', label: '地面材料' },
  { value: 'cabinet', label: '全屋定制' },
  { value: 'profile', label: '型材配件' },
];

export const products: Product[] = [
  {
    slug: 'wpc',
    name: '塑木材料',
    englishName: 'WPC Material',
    category: 'outdoor',
    summary:
      '环保木塑复合材料，兼具天然木质纹理与塑料耐用性能，开启户外装饰新纪元。',
    tagline:
      '环保木塑复合材料，兼具天然木质纹理与塑料耐用性能，开启户外装饰新纪元。',
    featureIntroduction:
      '筑绿塑木材料以高密度木纤维与食品级树脂为原料，经高温高压挤出成型，完美融合木材的自然质感与塑料耐用性能。',
    image: image('product-wpc'),
    features: [
      {
        title: '环保可持续',
        description:
          '采用回收木纤维与环保树脂，100%可回收再利用，零甲醛释放，符合绿色建筑标准。',
      },
      {
        title: '防水防潮防腐',
        description:
          '不吸水、不霉变、不腐烂，适用于户外潮湿环境，使用寿命是普通木材的5-10倍。',
      },
      {
        title: '免护理易清洁',
        description:
          '表面经特殊工艺处理，不开裂、不褪色，日常只需清水冲洗，无需定期刷漆保养。',
      },
      {
        title: '安装便捷高效',
        description:
          '专用卡扣式安装系统，施工速度快，缝隙均匀美观，大幅缩短工期与人工成本。',
      },
    ],
    specifications: [
      ['产品名称', '木塑复合板材（WPC）'],
      [
        '主要成分',
        '高密度木纤维（55%）+ 食品级PE树脂（35%）+ 功能性添加剂（10%）',
      ],
      [
        '常规规格',
        '146×22mm、150×25mm、140×25mm 实心/空心；长度可定制（2.2m-5.8m）',
      ],
      ['颜色系列', '深棕色、咖啡色、浅木色、灰色、红檀木、柚木色等12种标准色'],
      ['弯曲强度', '≥ 25 MPa'],
      ['弹性模量', '≥ 2500 MPa'],
      ['吸水率', '≤ 0.8%'],
      ['使用温度', '-40℃ ～ +60℃'],
      ['使用寿命', '户外正常使用 15-25 年'],
      ['环保认证', 'ISO9001、ISO14001、SGS环保检测、CE认证'],
    ],
    applications: [
      '户外露台地板',
      '花园围栏护栏',
      '景观廊架花架',
      '泳池周边铺装',
    ],
  },
  {
    slug: 'flexible-stone',
    name: '柔性软石',
    englishName: 'Flexible Stone',
    category: 'wall',
    summary: '轻质柔性饰面材料，可弯曲贴合弧形墙面，再现天然石材纹理与质感。',
    tagline: '一片轻盈软石，赋予墙面天然石材的细腻纹理与自由曲线。',
    image: image('product-flexible-stone'),
    features: standardFeatures('柔性软石', [
      '轻薄可弯曲',
      '可贴合圆柱、弧墙等复杂基层，为设计提供更大的造型自由度。',
      '纹理自然逼真',
      '还原洞石、砂岩、板岩等自然纹理，呈现克制高级的空间层次。',
    ]),
    specifications: [
      ['产品名称', '柔性石材饰面板'],
      ['常规厚度', '2-5mm'],
      ['常规尺寸', '600×1200mm，支持定制'],
      ['适用基层', '水泥、木工板、石膏板等平整基层'],
      ['适用空间', '室内墙面、商业立面、弧形造型'],
    ],
    applications: [
      '客厅背景墙',
      '商业空间立面',
      '酒店弧形墙面',
      '艺术装置包覆',
    ],
  },
  {
    slug: 'pu-stone',
    name: 'PU石材',
    englishName: 'PU Stone',
    category: 'wall',
    summary:
      '聚氨酯仿石材饰面板，轻质安装便捷，纹理逼真，广泛用于室内背景墙装饰。',
    tagline: '以轻盈材质还原立体石材质感，让空间效果快速呈现。',
    image: image('product-pu-stone'),
    features: standardFeatures('PU石材', [
      '立体纹理逼真',
      '多层压制工艺塑造自然凹凸和石材色泽，兼顾视觉效果与触感。',
      '轻质安装便捷',
      '重量远低于天然石材，可切割、可胶粘，显著降低运输与施工负担。',
    ]),
    specifications: [
      ['产品名称', '聚氨酯仿石饰面板'],
      ['常规厚度', '20-45mm'],
      ['表面效果', '文化石、洞石、粗岩、砖石等'],
      ['安装方式', '结构胶粘贴，局部可加固'],
      ['适用空间', '室内背景墙、门厅、商业展示墙'],
    ],
    applications: ['电视背景墙', '玄关造景', '商业门店立面', '酒店会所装饰'],
  },
  {
    slug: 'spc',
    name: 'SPC墙板',
    englishName: 'SPC Wall Panel',
    category: 'wall',
    summary:
      '石塑复合墙板，防水防潮、零甲醛，锁扣式安装快速便捷，适合全屋墙面装饰。',
    tagline: '稳定防潮的整墙方案，让简洁利落的空间快速落地。',
    image: image('product-spc-wall-panel'),
    features: standardFeatures('SPC墙板', [
      '防水防潮',
      '石塑复合基材稳定耐用，适合厨卫、阳台等对防潮有要求的空间。',
      '锁扣快速安装',
      '模块化锁扣结构减少湿作业，缩短工期并保持拼缝整齐。',
    ]),
    specifications: [
      ['产品名称', '石塑复合墙板'],
      ['常规厚度', '5-10mm'],
      ['表面工艺', '木纹、石纹、金属、纯色'],
      ['安装方式', '卡扣、胶粘或龙骨安装'],
      ['适用空间', '住宅、酒店、公寓、商业空间'],
    ],
    applications: ['全屋墙面翻新', '厨房餐区墙面', '酒店客房', '办公空间'],
  },
  {
    slug: 'slab',
    name: '岩板',
    englishName: 'Porcelain Slab',
    category: 'wall',
    summary:
      '超大尺寸超薄瓷质板材，高温烧制而成，硬度高、耐污蚀，适合台面与墙面应用。',
    tagline: '以大规格连纹效果塑造纯粹、坚韧而高级的现代空间。',
    image: image('case-slab-living'),
    features: standardFeatures('岩板', [
      '耐污耐磨',
      '高温烧制形成致密表面，耐刮耐热且易于清洁，适合高频使用区域。',
      '大规格连纹',
      '超大尺寸减少拼缝，令墙面、台面与地面拥有更完整的视觉延展。',
    ]),
    specifications: [
      ['产品名称', '瓷质岩板'],
      ['常规厚度', '6mm、9mm、12mm、20mm'],
      ['常规尺寸', '1200×2400mm、1600×3200mm'],
      ['表面工艺', '亮光、哑光、柔光、模具面'],
      ['适用空间', '墙面、地面、岛台、厨卫台面'],
    ],
    applications: ['客厅背景墙', '整体厨房台面', '卫浴干区', '酒店大堂'],
  },
  {
    slug: 'aluminum',
    name: '铝合金型材',
    englishName: 'Aluminum Profile',
    category: 'profile',
    summary:
      '高精密度铝合金装饰型材，多种表面处理工艺，适合门窗、幕墙、收边等装饰应用。',
    tagline: '以精确的金属线条收束空间边界，成就细节处的品质感。',
    image: image('product-aluminum-profile'),
    features: standardFeatures('铝合金型材', [
      '尺寸精确稳定',
      '精密挤压成型，线条挺拔、收口平整，适配现代空间的细节控制。',
      '多样表面处理',
      '可选阳极氧化、喷涂、木纹转印等工艺，匹配不同设计语言。',
    ]),
    specifications: [
      ['产品名称', '铝合金装饰型材'],
      ['材质牌号', '6063-T5 铝合金'],
      ['表面工艺', '氧化、喷涂、氟碳、木纹转印'],
      ['常规长度', '3m、6m，支持定尺'],
      ['适用部位', '门窗、墙板收边、柜体、幕墙'],
    ],
    applications: ['墙板收边', '柜体嵌条', '门窗装饰', '商业展示架'],
  },
  {
    slug: 'rattan',
    name: '藤编材料',
    englishName: 'Rattan Material',
    category: 'cabinet',
    summary:
      '天然与仿藤编织材料，质感自然细腻，适合家具、屏风、墙面装饰等东南亚及侘寂风格。',
    tagline: '用自然编织的呼吸感，为空间带来松弛而温暖的表情。',
    image: image('product-rattan'),
    features: standardFeatures('藤编材料', [
      '自然透气质感',
      '细腻编织肌理带来光影与空气流动，让家具和立面更富呼吸感。',
      '风格适配广泛',
      '从侘寂、东南亚到新中式风格，都能形成自然克制的视觉重点。',
    ]),
    specifications: [
      ['产品名称', '藤编饰面材料'],
      ['材质选择', '天然藤、PE仿藤、纸藤'],
      ['编织方式', '六角孔、密编、疏编等'],
      ['常规宽度', '0.45m、0.6m、0.9m'],
      ['适用空间', '柜门、屏风、墙面、家具'],
    ],
    applications: ['藤编柜门', '玄关屏风', '民宿墙面', '休闲家具'],
  },
  {
    slug: 'resin-stone',
    name: '树脂水洗石',
    englishName: 'Resin Washed Stone',
    category: 'floor',
    summary:
      '树脂基水洗石地坪材料，整体无缝、颜色丰富，适合商业空间与别墅地面装饰。',
    tagline: '以无缝颗粒地面，打造兼具耐用性与艺术感的行走体验。',
    image: image('product-resin-washed-stone'),
    features: standardFeatures('树脂水洗石', [
      '整体无缝成型',
      '现场摊铺成型，减少缝隙藏污，呈现连续舒展的地面视觉效果。',
      '色彩组合丰富',
      '多种骨料与色彩可自由搭配，可为品牌空间定制专属地面语言。',
    ]),
    specifications: [
      ['产品名称', '树脂基水洗石地坪'],
      ['常规厚度', '8-15mm'],
      ['骨料选择', '彩砂、天然石粒、玻璃颗粒'],
      ['表面效果', '哑光防滑、细腻磨砂'],
      ['适用空间', '展厅、商业、别墅、庭院'],
    ],
    applications: ['品牌展厅', '商业门店地坪', '别墅庭院', '酒店公共区'],
  },
  {
    slug: 'gold-board',
    name: '鎏金板',
    englishName: 'Gold Foil Board',
    category: 'wall',
    summary:
      '金属质感装饰板材，表面鎏金工艺处理，华丽低奢，为空间增添精致质感与层次。',
    tagline: '让克制的金属光泽成为空间的点睛之笔。',
    image: image('product-gold-foil-board'),
    features: standardFeatures('鎏金板', [
      '金属光泽层次',
      '独特鎏金工艺让光线在表面自然游走，营造精致而不过度张扬的氛围。',
      '易于加工搭配',
      '可与木饰面、石材和灯光系统组合，满足大面积背景与局部造景需要。',
    ]),
    specifications: [
      ['产品名称', '金属质感装饰板'],
      ['常规厚度', '3-8mm'],
      ['表面效果', '鎏金、拉丝、镜面、肌理'],
      ['常规尺寸', '1220×2440mm，支持定制'],
      ['适用空间', '酒店、会所、商业、住宅背景墙'],
    ],
    applications: ['酒店大堂', '会所背景墙', '高端零售空间', '轻奢住宅'],
  },
  {
    slug: 'custom',
    name: '全屋定制',
    englishName: 'Custom Furniture',
    category: 'cabinet',
    summary:
      '柜体、柜门、弧形板、格栅、旋转格栅、格栅星空墙，六大系列打造个性化整体家居。',
    tagline: '从一处柜体到一整套空间系统，为生活方式定制理想居所。',
    image: image('product-custom-furniture'),
    features: standardFeatures('全屋定制', [
      '空间一体化设计',
      '柜体、门墙、格栅与灯光系统协同设计，统一材质、尺度与空间秩序。',
      '灵活个性化定制',
      '尺寸、收纳模块、颜色和五金均可按户型与生活习惯灵活配置。',
    ]),
    specifications: [
      ['产品系列', '柜体、柜门、弧形板、格栅、旋转格栅、星空墙'],
      ['板材选择', '多层板、颗粒板、生态板、PET等'],
      ['门板工艺', '肤感、木纹、烤漆、玻璃、金属'],
      ['五金配置', '缓冲铰链、隐藏滑轨、灯光系统'],
      ['服务内容', '测量、设计、深化、安装、售后'],
    ],
    applications: ['整体厨房', '客厅收纳系统', '衣帽间', '书房与阳台柜'],
  },
  {
    slug: 'open-wardrobe',
    name: '开放式衣柜',
    englishName: 'Open Wardrobe',
    category: 'cabinet',
    summary: '无门开放式衣帽间系统，收纳展示一体，营造轻奢时尚的更衣体验。',
    tagline: '将收纳变成展示，以轻盈开放的结构整理日常。',
    image: image('product-open-wardrobe'),
    features: standardFeatures('开放式衣柜', [
      '收纳展示一体',
      '开放式层板、挂衣区与灯光系统共同呈现，拿取直观，展示有序。',
      '模块自由组合',
      '可依据衣物类别与空间尺寸组合挂杆、抽屉、格架与中岛模块。',
    ]),
    specifications: [
      ['产品名称', '开放式衣帽间系统'],
      ['结构选择', '铝框、板式、玻璃门组合'],
      ['模块配置', '挂衣、层板、抽屉、裤架、中岛'],
      ['灯光系统', '层板灯、感应灯、灯带'],
      ['适用空间', '主卧衣帽间、次卧、样板房'],
    ],
    applications: ['步入式衣帽间', '主卧收纳', '精品店陈列', '样板间展示'],
  },
  {
    slug: 'metal-wardrobe',
    name: '金属衣柜',
    englishName: 'Metal Wardrobe',
    category: 'cabinet',
    summary: '工业风金属框架衣柜系统，结构稳固、防虫防潮，演绎现代工业美学。',
    tagline: '纤细而稳固的金属框架，定义利落通透的衣帽空间。',
    image: image('product-metal-wardrobe'),
    features: standardFeatures('金属衣柜', [
      '结构稳固耐用',
      '金属框架承重可靠，耐潮防虫，满足长期高频使用的收纳需求。',
      '通透轻盈视觉',
      '细窄边框与玻璃、灯带结合，令大容量收纳依然保持通透轻盈。',
    ]),
    specifications: [
      ['产品名称', '金属框架衣柜系统'],
      ['框架材质', '铝合金或碳钢喷涂'],
      ['颜色选择', '雅黑、香槟金、灰色等'],
      ['模块配置', '挂衣、层板、抽屉、玻璃门'],
      ['适用空间', '衣帽间、卧室、商业展示'],
    ],
    applications: ['现代衣帽间', '精品服装陈列', '主卧收纳', '公寓样板房'],
  },
];

export const productMap = Object.fromEntries(
  products.map((product) => [product.slug, product]),
) as Record<string, Product>;

export const projectCases = [
  {
    title: '现代轻奢客厅背景墙',
    category: '岩板 · 客厅空间',
    description: '连纹岩板一体化设计',
    image: image('case-slab-living'),
  },
  {
    title: '别墅花园塑木露台',
    category: '塑木 · 户外空间',
    description: '深灰塑木地板围栏系统',
    image: image('case-wpc-garden'),
  },
  {
    title: '轻奢风格客厅背景墙',
    category: 'PU石材 · 客厅',
    description: '米白文化石立体质感',
    image: image('case-pu-living'),
  },
  {
    title: '轻奢步入式衣帽间',
    category: '全屋定制 · 衣帽间',
    description: '玻璃门 + 灯带 + 中岛台系统',
    image: image('case-custom-wardrobe'),
  },
  {
    title: '五星级酒店大堂装饰',
    category: '鎏金板 · 酒店',
    description: '鎏金板背景墙奢华呈现',
    image: image('case-gold-hotel'),
  },
  {
    title: '品牌展厅整体地坪',
    category: '水洗石 · 商业空间',
    description: '浅白树脂水洗石无缝地面',
    image: image('case-resin-showroom'),
  },
];

export const websiteImages = {
  hero: image('hero'),
  aboutOutdoor: image('case-wpc-garden'),
  aboutStone: image('case-pu-living'),
  aboutKitchen: image('about-kitchen'),
  application: image('application-scenario'),
};

export const productDetailImages: Record<
  string,
  {
    feature: string;
    applications: string[];
    gallery: string[];
  }
> = {
  wpc: {
    feature: image('wpc-detail-feature'),
    applications: [
      image('wpc-application-deck'),
      image('wpc-application-fence'),
      image('wpc-application-pergola'),
      image('wpc-application-pool'),
    ],
    gallery: [
      image('wpc-detail-feature'),
      image('wpc-application-fence'),
      image('wpc-application-deck'),
      image('wpc-application-pergola'),
      image('wpc-application-pool'),
      image('wpc-gallery-6'),
    ],
  },
};
