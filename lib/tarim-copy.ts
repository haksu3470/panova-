import type { Language } from './dictionary';

/**
 * /tarim (Panova Tarım ve Hayvancılık) sayfa metinleri.
 * Diller: TR, EN, MK. Arnavutça ve Arapça şimdilik İngilizce metni gösterir.
 * Makedonca metin Claude çevirisidir — yayından önce anadili Makedonca biri kontrol etmeli.
 */
export type TarimCopy = {
  metaTitle: string;
  metaDesc: string;
  groupNav: { hr: string; agri: string; construction: string; trade: string; social: string; soon: string };
  hero: { eyebrow: string; title: string; lead: string; cta: string; ctaSecondary: string; facts: { value: string; label: string }[] };
  why: { title: string; lead: string; points: { title: string; text: string }[] };
  infra: { title: string; lead: string; items: { img: string; title: string; text: string }[] };
  video: { title: string; seed: string; planting: string; note: string };
  produce: { title: string; lead: string; captions: Record<string, string> };
  bangladesh: { title: string; lead: string; captions: Record<string, string> };
  livestock: { title: string; lead: string; cards: { title: string; text: string }[] };
  models: { title: string; lead: string; cards: { title: string; text: string }[] };
  team: { title: string; lead: string; pillars: { title: string; text: string }[]; closing: string };
  contact: {
    title: string; lead: string; product: string; productPh: string; quantity: string; quantityPh: string;
    season: string; seasonPh: string; name: string; email: string; phone: string; notes: string;
    submit: string; submitting: string; successTitle: string; successText: string; error: string;
    direct: string;
  };
};

const tr: TarimCopy = {
  metaTitle: 'Panova Tarım ve Hayvancılık — Makedonya\'da sizin için üretelim',
  metaDesc: 'Kuzey Makedonya Struga\'da hazır tarım altyapısı: 200 dönüm arazi, sulama ve havuz sistemi, 10 sera, viyol fide üretimi ve makine parkı. Sözleşmeli üretim ve yatırım ortaklığı.',
  groupNav: { hr: 'İnsan Kaynakları', agri: 'Tarım', construction: 'İnşaat', trade: 'Ticaret', social: 'Sosyal Projeler', soon: 'yakında' },
  hero: {
    eyebrow: 'Panova Tarım ve Hayvancılık · Struga, Kuzey Makedonya',
    title: 'Avrupa\'da hazır tarım altyapısı. Sizin için üretelim.',
    lead: 'Arazi, su, sera, makine ve ekip hazır. Alıcıyı ya da sermayeyi siz getirin; ürünü sizin adınıza, sizin standardınızda üretelim.',
    cta: 'Teklif isteyin',
    ctaSecondary: 'Altyapıyı görün',
    facts: [
      { value: '200 dönüm', label: 'ekime hazır arazi' },
      { value: '10 sera', label: 'fide üretimi' },
      { value: '6–7 ton', label: 'dönüm başına ürün' },
      { value: '2024–2025', label: 'kapya biber ve kavun' },
    ],
  },
  why: {
    title: 'Neden Makedonya?',
    lead: 'Struga ovası verimli toprağı, bol suyu ve Avrupa pazarlarına kara yolu yakınlığıyla üretim için güçlü bir yer.',
    points: [
      { title: 'Verimli ova', text: 'Dağlarla çevrili, düz ve sulanabilir arazi. İstediğimiz sezonda ekebiliyoruz.' },
      { title: 'Su ve enerji', text: 'Kendi sulama havuzumuz, filtre istasyonumuz ve güneş panellerimiz var.' },
      { title: 'İşçilik çözümü', text: 'Grubun İnsan Kaynakları kolu sayesinde ihtiyaç duyulan ekip getirilebiliyor.' },
      { title: 'Avrupa\'ya yakınlık', text: 'Avrupa\'nın içinde; ürün AB pazarlarına kara yoluyla kısa sürede ulaşır.' },
    ],
  },
  infra: {
    title: 'Hazır altyapımız',
    lead: 'Tohumdan hasada kadar her adım için gereken donanım kurulu ve çalışıyor.',
    items: [
      { img: 'havuz-kazisi', title: 'Sulama havuzu', text: 'Sezon boyu suyu depolayan havuzu kendimiz kazdık ve kaplattık.' },
      { img: 'havuz-dolum', title: 'Su deposu dolu', text: 'Havuz kuyu ve kanal suyuyla doluyor, damla sulamaya buradan basılıyor.' },
      { img: 'filtre-istasyonu', title: 'Filtre istasyonu', text: 'Damla sulama hattına temiz su veren filtre ve pompa grubu.' },
      { img: 'gunes-panelleri', title: 'Güneş enerjisi', text: 'Pompaları çalıştıran güneş panelleri.' },
      { img: 'sera-viyol-fide', title: '10 sera, viyolde fide', text: 'Fidelerimizi kendi seralarımızda, viyollerde üretiyoruz.' },
      { img: 'fide-koku', title: 'Güçlü kök', text: 'Tarlaya sağlam kök yapısıyla çıkan fide.' },
      { img: 'fide-dikim-makinesi', title: 'Makineli dikim', text: '4 sıralı fide dikim makinesi, tohum ekme makinesi ve diğer ekipman.' },
    ],
  },
  video: {
    title: 'Tohumdan tarlaya',
    seed: 'Tohumların viyole ekimi',
    planting: 'Fidelerin tarlaya dikimi',
    note: 'Videolar sessizdir.',
  },
  produce: {
    title: 'Neler ürettik',
    lead: '2024 ve 2025 sezonlarında kapya biber ve kavun ürettik; dönüm başına 6–7 ton ürün aldık. Ders de çıkardık: üretimden önce alıcı ve taahhüt.',
    captions: {
      'kapya-biber-tarlasi': 'Kapya biber tarlası',
      'kapya-biber-hasat': 'Kapya biber hasadı',
      'kavun-yakin': 'Olgun kavun',
      'kavun-kasa': 'Kasada kavun',
      'kavun-hasat-yigini': 'Kavun hasadı',
    },
  },
  bangladesh: {
    title: 'Bangladeş deneyimi',
    lead: 'Ekibimiz, Bangladeş\'e makineli tarımı götüren ilk ekiplerdendi: yerel çiftçilere makine kullanmayı, tohumdan fide üretmeyi ve ekimi öğrettik.',
    captions: {
      'bangladesh-egitim': 'Yerel çiftçilerle fide eğitimi',
      'bangladesh-sera-fide': 'Serada fide üretimi',
      'bangladesh-ekim-makinesi': 'Makineli ekim',
      'bangladesh-silaj-hasadi': 'Mısır silaj hasadı',
    },
  },
  livestock: {
    title: 'Hayvancılık fırsatları',
    lead: 'Altyapı ve arazi hayvancılığa da uygun. Doğru yatırımcıyla hemen başlayabileceğimiz alanlar:',
    cards: [
      { title: 'Süt', text: 'Makedonya\'da süt litre başı yaklaşık 30 denardan toplu alınıyor ve devlet desteği var.' },
      { title: 'Besi', text: 'Arazi ve yem üretimi bir arada; besi için uygun koşullar.' },
      { title: 'Kümes', text: 'Yumurta ve beyaz et üretimi için kurulabilecek tesisler.' },
    ],
  },
  models: {
    title: 'Nasıl çalışırız?',
    lead: 'Üç kapı açıyoruz. Üçünde de üretim, alıcı veya sermaye netleştiğinde başlar.',
    cards: [
      { title: 'Sözleşmeli üretim', text: 'Ürünü, miktarı ve fiyatı siz taahhüt edersiniz; biz kendi arazi, sera ve ekibimizle sizin adınıza üretiriz.' },
      { title: 'Yatırım ortaklığı', text: 'Sezon sermayesini ya da yeni bir tesisi (örneğin süt çiftliği) siz finanse edersiniz; kâr paylaşılır.' },
      { title: 'Ürün tedariki', text: 'Bölgede alıcı bulamayan üreticinin ürününü (örneğin elma) sizin pazarınıza ulaştırırız.' },
    ],
  },
  team: {
    title: 'Biz kimiz?',
    lead: 'Mühendislik geçmişi olan bir ekiple, yıllarını sahada ve insani yardım projelerinde geçirmiş bir ekibin ortak çatısıyız. Farklı yollardan gelip Makedonya\'da buluştuk; ortak noktamız, işi yerinde ve baştan sona kendimiz kurmak.',
    pillars: [
      { title: 'Mühendislik bakışı', text: 'Elektronik ve otomasyon sistemleri tasarlayıp üretmiş bir mühendislik geçmişinden geliyoruz. Sulama, havuz ve otomasyon altyapımızı bu titizlikle, ölçerek ve test ederek kurduk.' },
      { title: 'Sahada tecrübe', text: 'Bangladeş\'te makineli tarımı ilk başlatan ekiplerden biriyiz; Afrika\'da bir hastane projesini arsa alımından anahtar teslimine kadar yürüttük. Zor koşullarda iş kurmayı ve ekibi yönetmeyi biliyoruz.' },
      { title: 'Üretim ve ticaret', text: '2008\'de okul öncesi eğitim materyalleri ithalatıyla başladık, ardından kendi üretimimize geçtik: 5.000 m² kapalı fabrika, depo ve showroom, otomasyona öncelik veren bir makine parkı ve Türkiye genelinde toptan ve perakende satış ağı. Eğitici oyuncaklarımızı kendi markamızla geliştiriyoruz.' },
      { title: 'İnsana yatırım', text: 'Uzun yıllar okul öncesi eğitim kurumu yönettik. Çalıştığımız her yerde yerel ekipleri eğitiyor, bilgiyi bırakıyor ve onlarla birlikte büyüyoruz.' },
      { title: 'Açık iletişim', text: 'Ne yapabileceğimizi ve neyin eksik olduğunu açıkça söyleriz. 2025\'te pazarsız üretimin bedelini ödedik; bu yüzden bugün önce alıcıyı ve taahhüdü netleştiriyoruz.' },
    ],
    closing: 'Kazancımızın bir kısmını, ihtiyaç sahiplerine yönelik sosyal projelere ayırıyoruz.',
  },
  contact: {
    title: 'Teklif isteyin',
    lead: 'Hangi ürünü, ne kadar ve hangi sezonda istediğinizi yazın; size dönüş yapalım.',
    product: 'Ürün', productPh: 'Örn. kapya biber, kavun, fide',
    quantity: 'Miktar', quantityPh: 'Örn. 50 ton',
    season: 'Sezon', seasonPh: 'Örn. 2027 yaz',
    name: 'Ad soyad / Firma', email: 'E-posta', phone: 'Telefon', notes: 'Notunuz',
    submit: 'Gönder', submitting: 'Gönderiliyor…',
    successTitle: 'Talebiniz alındı', successText: 'En kısa sürede size dönüş yapacağız.',
    error: 'Talebiniz gönderilemedi. Lütfen tekrar deneyin ya da e-posta ile yazın.',
    direct: 'Doğrudan iletişim',
  },
};

const en: TarimCopy = {
  metaTitle: 'Panova Agriculture & Livestock — we grow for you in North Macedonia',
  metaDesc: 'Ready-to-use farming infrastructure in Struga, North Macedonia: 20 hectares of land, irrigation and reservoir, 10 greenhouses, tray seedling production and machinery. Contract farming and investment partnerships.',
  groupNav: { hr: 'Human Resources', agri: 'Agriculture', construction: 'Construction', trade: 'Trade', social: 'Social Projects', soon: 'soon' },
  hero: {
    eyebrow: 'Panova Agriculture & Livestock · Struga, North Macedonia',
    title: 'Farming infrastructure in Europe, ready to grow for you.',
    lead: 'Land, water, greenhouses, machinery and crew are in place. Bring the buyer or the capital; we grow the crop on your behalf, to your standard.',
    cta: 'Request a quote',
    ctaSecondary: 'See the infrastructure',
    facts: [
      { value: '20 ha', label: 'land ready to plant' },
      { value: '10', label: 'greenhouses for seedlings' },
      { value: '60–70 t/ha', label: 'yield achieved' },
      { value: '2024–2025', label: 'peppers and melons' },
    ],
  },
  why: {
    title: 'Why North Macedonia?',
    lead: 'The Struga plain combines fertile soil, plenty of water and short road links to European markets.',
    points: [
      { title: 'Fertile plain', text: 'Flat, irrigable land framed by mountains. We can plant in whichever season we choose.' },
      { title: 'Water and power', text: 'Our own irrigation reservoir, filter station and solar panels.' },
      { title: 'Labour solved', text: 'The group\'s Human Resources arm brings in the crew a season needs.' },
      { title: 'Close to the EU', text: 'Inside Europe; produce reaches EU markets by road in a short time.' },
    ],
  },
  infra: {
    title: 'Our infrastructure',
    lead: 'Everything needed from seed to harvest is installed and working.',
    items: [
      { img: 'havuz-kazisi', title: 'Irrigation reservoir', text: 'We dug and lined our own reservoir to store water for the whole season.' },
      { img: 'havuz-dolum', title: 'Water in storage', text: 'The reservoir fills from well and canal water and feeds the drip lines.' },
      { img: 'filtre-istasyonu', title: 'Filter station', text: 'Filter and pump unit that delivers clean water to the drip system.' },
      { img: 'gunes-panelleri', title: 'Solar power', text: 'Solar panels that run the pumps.' },
      { img: 'sera-viyol-fide', title: '10 greenhouses, tray seedlings', text: 'We raise our own seedlings in trays in our greenhouses.' },
      { img: 'fide-koku', title: 'Strong roots', text: 'Seedlings go to the field with a firm root ball.' },
      { img: 'fide-dikim-makinesi', title: 'Mechanised planting', text: 'Four-row transplanter, seed drill and the rest of our machinery.' },
    ],
  },
  video: {
    title: 'From seed to field',
    seed: 'Sowing seeds into trays',
    planting: 'Transplanting seedlings to the field',
    note: 'Videos have no sound.',
  },
  produce: {
    title: 'What we have grown',
    lead: 'In 2024 and 2025 we grew Kapia peppers and melons, at 60–70 tonnes per hectare. The lesson: secure the buyer and the commitment before planting.',
    captions: {
      'kapya-biber-tarlasi': 'Kapia pepper field',
      'kapya-biber-hasat': 'Kapia pepper harvest',
      'kavun-yakin': 'Ripe melon',
      'kavun-kasa': 'Melons in crates',
      'kavun-hasat-yigini': 'Melon harvest',
    },
  },
  bangladesh: {
    title: 'Experience in Bangladesh',
    lead: 'Our team was among the first to bring mechanised farming to Bangladesh: we taught local farmers to use machinery, raise seedlings from seed and plant them.',
    captions: {
      'bangladesh-egitim': 'Seedling training with local farmers',
      'bangladesh-sera-fide': 'Seedlings in the greenhouse',
      'bangladesh-ekim-makinesi': 'Mechanised sowing',
      'bangladesh-silaj-hasadi': 'Maize silage harvest',
    },
  },
  livestock: {
    title: 'Livestock opportunities',
    lead: 'The land and infrastructure suit livestock too. Areas we can start with the right investor:',
    cards: [
      { title: 'Dairy', text: 'In North Macedonia milk is bought in bulk at about 30 denars per litre, with state support.' },
      { title: 'Beef', text: 'Land and feed production in one place make good conditions for fattening.' },
      { title: 'Poultry', text: 'Facilities for egg and broiler production can be set up.' },
    ],
  },
  models: {
    title: 'How we work',
    lead: 'Three ways in. In all three, production starts once the buyer or the capital is confirmed.',
    cards: [
      { title: 'Contract farming', text: 'You commit to the crop, volume and price; we grow it for you with our own land, greenhouses and crew.' },
      { title: 'Investment partnership', text: 'You finance the season or a new facility (a dairy farm, for example); profit is shared.' },
      { title: 'Produce supply', text: 'We bring produce that local growers cannot sell (apples, for example) to your market.' },
    ],
  },
  team: {
    title: 'Who we are',
    lead: 'We bring together an engineering team and a team that has spent years in the field and on humanitarian projects. We came by different roads and met in North Macedonia; what we share is building the work ourselves, on site, from start to finish.',
    pillars: [
      { title: 'An engineer\'s eye', text: 'Our background is in designing and building electronics and automation systems. We set up our irrigation, reservoir and automation with the same care: measured and tested.' },
      { title: 'Field experience', text: 'We were among the first teams to start mechanised farming in Bangladesh, and we ran a hospital project in Africa from land purchase to handover. We know how to build and lead a team in hard conditions.' },
      { title: 'Manufacturing and trade', text: 'We started in 2008 by importing early-childhood education materials, then moved into our own manufacturing: a 5,000 m² indoor factory, warehouse and showroom, a machine park built around automation, and a wholesale and retail network across Türkiye. We develop educational toys under our own brand.' },
      { title: 'Investing in people', text: 'For many years we ran an early-childhood education institution. Wherever we work we train local teams, leave the know-how behind and grow together with them.' },
      { title: 'Straight talk', text: 'We say plainly what we can do and what is missing. In 2025 we paid the price of growing without a market; that is why today we secure the buyer and the commitment first.' },
    ],
    closing: 'Part of what we earn goes to social projects for people in need.',
  },
  contact: {
    title: 'Request a quote',
    lead: 'Tell us which crop, how much and for which season; we will get back to you.',
    product: 'Crop', productPh: 'e.g. Kapia pepper, melon, seedlings',
    quantity: 'Quantity', quantityPh: 'e.g. 50 tonnes',
    season: 'Season', seasonPh: 'e.g. summer 2027',
    name: 'Name / Company', email: 'Email', phone: 'Phone', notes: 'Your note',
    submit: 'Send', submitting: 'Sending…',
    successTitle: 'Request received', successText: 'We will get back to you shortly.',
    error: 'Your request could not be sent. Please try again or write to us by email.',
    direct: 'Direct contact',
  },
};

const mk: TarimCopy = {
  metaTitle: 'Панова Земјоделство и Сточарство — произведуваме за вас во Македонија',
  metaDesc: 'Подготвена земјоделска инфраструктура во Струга: 20 хектари земја, систем за наводнување и базен, 10 пластеници, производство на расад и механизација. Договорно производство и инвестициско партнерство.',
  groupNav: { hr: 'Човечки ресурси', agri: 'Земјоделство', construction: 'Градежништво', trade: 'Трговија', social: 'Социјални проекти', soon: 'наскоро' },
  hero: {
    eyebrow: 'Панова Земјоделство и Сточарство · Струга, Северна Македонија',
    title: 'Подготвена земјоделска инфраструктура во Европа. Произведуваме за вас.',
    lead: 'Земјата, водата, пластениците, механизацијата и екипата се подготвени. Донесете купувач или капитал; ние го произведуваме производот во ваше име, според ваш стандард.',
    cta: 'Побарајте понуда',
    ctaSecondary: 'Погледнете ја инфраструктурата',
    facts: [
      { value: '20 ha', label: 'земја подготвена за сеење' },
      { value: '10', label: 'пластеници за расад' },
      { value: '60–70 t/ha', label: 'постигнат принос' },
      { value: '2024–2025', label: 'пиперки и диње' },
    ],
  },
  why: {
    title: 'Зошто Македонија?',
    lead: 'Струшкото поле нуди плодна почва, доволно вода и кратка патна врска до европските пазари.',
    points: [
      { title: 'Плодно поле', text: 'Рамна земја за наводнување, опкружена со планини. Сееме во сезоната што ја избираме.' },
      { title: 'Вода и енергија', text: 'Сопствен базен за наводнување, филтер станица и соларни панели.' },
      { title: 'Работна сила', text: 'Секторот за човечки ресурси на групата ја обезбедува потребната екипа.' },
      { title: 'Блиску до ЕУ', text: 'Во срцето на Европа; производите брзо стигнуваат до пазарите на ЕУ по пат.' },
    ],
  },
  infra: {
    title: 'Нашата инфраструктура',
    lead: 'Сè што е потребно од семе до берба е поставено и работи.',
    items: [
      { img: 'havuz-kazisi', title: 'Базен за наводнување', text: 'Сами го ископавме и обложивме базенот што чува вода за цела сезона.' },
      { img: 'havuz-dolum', title: 'Резерва на вода', text: 'Базенот се полни од бунар и канал и ги снабдува системите капка по капка.' },
      { img: 'filtre-istasyonu', title: 'Филтер станица', text: 'Филтри и пумпи што даваат чиста вода во системот капка по капка.' },
      { img: 'gunes-panelleri', title: 'Соларна енергија', text: 'Соларни панели што ги погонуваат пумпите.' },
      { img: 'sera-viyol-fide', title: '10 пластеници, расад во контејнери', text: 'Расадот го произведуваме сами, во контејнери во нашите пластеници.' },
      { img: 'fide-koku', title: 'Силен корен', text: 'Расадот излегува на нива со цврст корен.' },
      { img: 'fide-dikim-makinesi', title: 'Механизирано садење', text: 'Машина за садење во четири реда, сеалка и останата механизација.' },
    ],
  },
  video: {
    title: 'Од семе до нива',
    seed: 'Сеење семе во контејнери',
    planting: 'Садење расад на нива',
    note: 'Видеата се без звук.',
  },
  produce: {
    title: 'Што произведовме',
    lead: 'Во 2024 и 2025 произведовме пиперки капија и диње, со принос од 60–70 тони по хектар. Поуката: прво купувач и договор, па производство.',
    captions: {
      'kapya-biber-tarlasi': 'Нива со пиперки капија',
      'kapya-biber-hasat': 'Берба на пиперки капија',
      'kavun-yakin': 'Зрела диња',
      'kavun-kasa': 'Диње во гајби',
      'kavun-hasat-yigini': 'Берба на диње',
    },
  },
  bangladesh: {
    title: 'Искуство во Бангладеш',
    lead: 'Нашиот тим беше меѓу првите што донесоа механизирано земјоделство во Бангладеш: ги обучивме локалните земјоделци да користат машини, да произведуваат расад од семе и да садат.',
    captions: {
      'bangladesh-egitim': 'Обука за расад со локални земјоделци',
      'bangladesh-sera-fide': 'Расад во пластеник',
      'bangladesh-ekim-makinesi': 'Механизирано сеење',
      'bangladesh-silaj-hasadi': 'Берба на пченка за силажа',
    },
  },
  livestock: {
    title: 'Можности во сточарството',
    lead: 'Земјата и инфраструктурата се погодни и за сточарство. Области каде што можеме да започнеме со вистинскиот инвеститор:',
    cards: [
      { title: 'Млеко', text: 'Во Македонија млекото се откупува на големо по околу 30 денари за литар, со државна поддршка.' },
      { title: 'Тов', text: 'Земја и производство на добиточна храна на едно место — добри услови за тов.' },
      { title: 'Живинарство', text: 'Може да се изградат објекти за јајца и бројлери.' },
    ],
  },
  models: {
    title: 'Како работиме',
    lead: 'Три начини за соработка. Во сите три производството почнува кога купувачот или капиталот се потврдени.',
    cards: [
      { title: 'Договорно производство', text: 'Вие се обврзувате за производот, количината и цената; ние го одгледуваме за вас со наша земја, пластеници и екипа.' },
      { title: 'Инвестициско партнерство', text: 'Вие ја финансирате сезоната или нов објект (на пример, фарма за млеко); добивката се дели.' },
      { title: 'Снабдување со производи', text: 'Производите што локалните производители не можат да ги продадат (на пример, јаболка) ги носиме до вашиот пазар.' },
    ],
  },
  team: {
    title: 'Кои сме ние',
    lead: 'Обединуваме инженерски тим и тим што долги години работел на терен и на хуманитарни проекти. Дојдовме од различни патишта и се сретнавме во Македонија; заедничко ни е тоа што работата ја градиме сами, на лице место, од почеток до крај.',
    pillars: [
      { title: 'Инженерски пристап', text: 'Доаѓаме од инженерство — дизајн и производство на електронски и автоматизирани системи. Наводнувањето, базенот и автоматизацијата ги поставивме со истата прецизност: измерено и тестирано.' },
      { title: 'Искуство на терен', text: 'Бевме меѓу првите тимови што започнаа механизирано земјоделство во Бангладеш, а во Африка водевме проект за болница од купување на земјиштето до предавање. Знаеме да градиме и да водиме тим во тешки услови.' },
      { title: 'Производство и трговија', text: 'Во 2008 започнавме со увоз на материјали за предучилишно образование, а потоа преминавме на сопствено производство: 5.000 m² затворена фабрика, магацин и изложбен салон, машински парк насочен кон автоматизација и мрежа за големопродажба и малопродажба низ цела Турција. Развиваме едукативни играчки под сопствен бренд.' },
      { title: 'Вложуваме во луѓето', text: 'Долги години раководевме со установа за предучилишно образование. Каде и да работиме, ги обучуваме локалните тимови, го оставаме знаењето и растеме заедно со нив.' },
      { title: 'Отворена комуникација', text: 'Јасно кажуваме што можеме и што недостасува. Во 2025 ја плативме цената на производство без пазар; затоа денес прво ги обезбедуваме купувачот и договорот.' },
    ],
    closing: 'Дел од заработката ја издвојуваме за социјални проекти за луѓето во потреба.',
  },
  contact: {
    title: 'Побарајте понуда',
    lead: 'Напишете кој производ, колкава количина и за која сезона; ќе ви се јавиме.',
    product: 'Производ', productPh: 'пр. пиперка капија, диња, расад',
    quantity: 'Количина', quantityPh: 'пр. 50 тони',
    season: 'Сезона', seasonPh: 'пр. лето 2027',
    name: 'Име и презиме / Фирма', email: 'Е-пошта', phone: 'Телефон', notes: 'Ваша порака',
    submit: 'Испрати', submitting: 'Се испраќа…',
    successTitle: 'Барањето е примено', successText: 'Наскоро ќе ви се јавиме.',
    error: 'Барањето не може да се испрати. Обидете се повторно или пишете ни по е-пошта.',
    direct: 'Директен контакт',
  },
};

export const tarimCopy: Record<Language, TarimCopy> = { tr, en, mk, sq: en, ar: en };
