// =====================================================================
//  Кухня.js v30 — БАЗИС-Мебельщик 2022.12.21, cp1251 (ANSI)
//  v30: автосохранение настроек, расширенный перебор методов для опор,
//       вывод текста ошибок установки
// =====================================================================
FileOptions = 'Кухня_v6.xml';

var W=[], NP=0, XR=0, dS=0, BOFF=0, C={}, AnimUsed={}, ROT=false, SP={}, MH={}, ERRS={};
var DUCT=null, KanWarn=false, KOFF=0, GOvr=0, Loaded=false, Saving=false, Making=false;
var fPetl=null,fNapr=null,fNapr2=null,fOpor=null,fRuch=null,fPolk=null;
var yN=0,yS=0,yMid=0,yV=0,yVT=0,hA=0,hDob=0,TK=16,TFN=19,TFV=16,TZ=3;
var Prop,KrV,KrN;

MakeProps();
try { Loaded = Action.Properties.Load(FileOptions); } catch(e){ Loaded=false; }
Action.OnFinish = function() { SaveProps(); }
KrV = NewButtMaterialInput('Кромка видимая');
KrN = NewButtMaterialInput('Кромка невидимая');
NewButtonInput('Закончить').OnChange = function() { Make(); SaveProps(); Action.Finish(); }
NewButtonInput('Диагностика фурнитуры').OnChange = function() { LoadFurn(); DiagFurn(); }
NewButtonInput('Сохранить настройки').OnChange = function() { SaveProps(); alert('Настройки записаны в '+FileOptions); }
NewButtonInput('Типы анимации').OnChange = function() { AnimDump(); }
NewButtonInput('Дамп блоков').OnChange = function() { BlockDump(); }
NewButtonInput('Деталировка CSV').OnChange = function() { ExportCSV(); }
NewButtonInput('Проверить модель').OnChange = function() { Check(); }
Make();
Action.Continue();

function SaveProps(){
  if(Saving) return;
  Saving=true;
  try{ Action.Properties.Save(FileOptions); }catch(e){}
  Saving=false;
}

function MakeProps() {
  Prop = Action.Properties;

  var g = Prop.NewGroup('ФУРНИТУРА ИЗ БАЗЫ (кнопка «…» = выбор из базы)');
  FOpor = g.NewFurniture('Опоры — нужна привязка Face');
  FRuch = g.NewFurniture('Ручки — нужна привязка Face');
  FPolk = g.NewFurniture('Полкодержатели — Face или FaceFace');

  g = Prop.NewGroup('ФРАГМЕНТЫ .fr3d (файлы)');
  SPetl = g.NewSelector('Петля ZM-HCSL09-3DBEO');
  SPetl.OnClick = function() { var f = system.askFileName('fr3d'); if (f){ SPetl.Value = f; SaveProps(); } };
  SNapr = g.NewSelector('Ящик PB-MBPRO-KPL450B');
  SNapr.OnClick = function() { var f = system.askFileName('fr3d'); if (f){ SNapr.Value = f; SaveProps(); } };
  SNapr2 = g.NewSelector('Ящик под холодильник KPL550A');
  SNapr2.OnClick = function() { var f = system.askFileName('fr3d'); if (f){ SNapr2.Value = f; SaveProps(); } };
  PetlMet = g.NewString('Метод петель: Mount/Mount1/Scheme', 'Mount');
  RuchLen = g.NewNumber('Длина ручки (межцентровое)', 128);
  RuchOt = g.NewNumber('Ручка: отступ от кромки по ширине', 50);
  RuchV = g.NewNumber('Ручка: от верха до конца ручки', 60);

  g = Prop.NewGroup('ДОСТУП В УГЛОВУЮ СЕКЦИЮ');
  UglDostup = g.NewBool('Вырез в боковине A3', true);
  UglDostAuto = g.NewBool('Максимальный размер автоматически', true);
  UglDostRamka = g.NewNumber('Рамка вокруг выреза (прочность)', 70);
  UglDostW = g.NewNumber('Вырез: ширина (если не авто)', 400);
  UglDostH = g.NewNumber('Вырез: высота (если не авто)', 625);
  UglDostU = g.NewNumber('Вырез: от задней кромки (если не авто)', 70);
  UglDostV = g.NewNumber('Вырез: от пола (если не авто)', 165);

  g = Prop.NewGroup('ФАРТУК (стена A)');
  FartOn = g.NewBool('Учитывать фартук', true);
  FartT = g.NewNumber('Фартук: отступ от стены A', 10);
  FartLevo = g.NewNumber('Фартук: левый край от стены B', 1255);
  FartPravo = g.NewNumber('Фартук: правый край от стены B', 0);
  FartNiz = g.NewNumber('Фартук: низ от пола', 924);
  FartVerh = g.NewNumber('Фартук: верх от пола (замер)', 1530);
  FartModel = g.NewBool('Фартук как деталь модели', true);

  g = Prop.NewGroup('УГЛОВАЯ НИЖНЯЯ СЕКЦИЯ');
  UglRotOn = g.NewBool('Повернуть на 90° (вдоль стены B)', true);
  UglRotGlub = g.NewNumber('Глубина повёрнутой (0=по кромке столешницы)', 0);
  UglFront = g.NewString('Фронт угловой: Глухая/Дверь/Нет', 'Нет');

  g = Prop.NewGroup('КАНАЛ С ТРУБАМИ (стена B)');
  KanalOn = g.NewBool('Учитывать канал', true);
  KanalZ1 = g.NewNumber('Канал: от стены A, начало', 0);
  KanalZ2 = g.NewNumber('Канал: от стены A, конец', 1100);
  KanalY1 = g.NewNumber('Канал: низ от пола', 400);
  KanalY2 = g.NewNumber('Канал: верх от пола', 610);
  KanalP = g.NewNumber('Канал: выступ от стены B, мм', 70);

  g = Prop.NewGroup('КОММУНИКАЦИИ ПММ');
  PmmDostup = g.NewBool('Вырезы в боковинах B2/B3', true);
  PmmKomZ1 = g.NewNumber('Прямоуг.: от стены A, лево', 650);
  PmmKomZ2 = g.NewNumber('Прямоуг.: от стены A, право', 1100);
  PmmKomY1 = g.NewNumber('Прямоуг.: низ от пола', 400);
  PmmKomY2 = g.NewNumber('Прямоуг.: верх от пола', 710);
  PmmDostW = g.NewNumber('Вырез: глубина от стены', 200);

  g = Prop.NewGroup('ЦОКОЛЬ');
  CokDva = g.NewBool('Цоколь A в два цвета', true);
  CokSplitX = g.NewNumber('Граница цветов X (0=авто)', 0);
  CokAKorotko = g.NewBool('Цоколь A укоротить до цоколя B', true);
  CokAEnd = g.NewNumber('Правый конец цоколя A (0=авто)', 0);
  CokSplosh = g.NewBool('Цоколь сплошной по стене', true);
  CokZaz = g.NewNumber('Зазор по краям планки', 2);
  CokDoDobor = g.NewBool('Цоколь A до левого добора', true);
  CokBStyk = g.NewBool('Цоколь B вплотную к цоколю A', true);
  CokTorec = g.NewBool('Цоколь с открытого торца B', true);

  g = Prop.NewGroup('ВЕНТТРАССА ВЫТЯЖКИ');
  VentTruba = g.NewBool('Прорезать трассу', true);
  VentDia = g.NewNumber('Диаметр трубы в гарнитуре', 120);
  VentPotDia = g.NewNumber('Диаметр отверстия в потолке', 150);
  VentPotB = g.NewNumber('Ось потолка: от стены B', 800);
  VentPotA = g.NewNumber('Ось потолка: от стены A', 200);
  VytPriv = g.NewString('Вытяжка: Центр варочной / Центр шкафа', 'Центр варочной');
  VytOsiOtZad = g.NewNumber('Ось вытяжки: от задней кромки ниши', 81);
  VytOsiSmU = g.NewNumber('Ось вытяжки: сдвиг от центра секции', 0);
  DuctZazor = g.NewNumber('Зазор трубы в пазу полки', 5);

  g = Prop.NewGroup('Лючки доступа');
  LukSpisok = g.NewString('Лючки: секция:элемент:u:v:Ш:В', '');
  LukOn = g.NewBool('Люк в боковине угловой A4', true);
  LukW = g.NewNumber('Люк A4: ширина', 300);
  LukH = g.NewNumber('Люк A4: высота', 300);
  LukU = g.NewNumber('Люк A4: от задней кромки', 100);
  LukV = g.NewNumber('Люк A4: от пола', 150);

  g = Prop.NewGroup('Структура и анимация');
  SecBlocks = g.NewBool('Блок на каждую секцию', true);
  AnimOn = g.NewBool('Блоки с анимацией', true);
  PetlVBlk = g.NewBool('Петли внутри блока двери', true);
  PmmAnim = g.NewString('Анимация фасада ПММ', 'DoorFlap');
  RotB = g.NewBool('Стена B: поворот блока', true);
  YasAnim = g.NewString('Анимация ящика: Блок/Комплект', 'Блок');

  g = Prop.NewGroup('Помещение');
  HGarn = g.NewNumber('Высота гарнитура', 2746);
  HPot = g.NewNumber('До потолка (добор)', 2900);
  WallA = g.NewNumber('Стена A', 2335);
  WallB = g.NewNumber('Стена B (от угла)', 2100);

  g = Prop.NewGroup('Высоты');
  Cok = g.NewNumber('Цоколь', 95);
  HNiz = g.NewNumber('Верх низа', 860);
  TStol = g.NewNumber('Столешница', 40);
  Fart = g.NewNumber('Фартук: зазор по высоте (низ верхних)', 600);
  HVerh = g.NewNumber('Верхние A', 900);
  PenAntr = g.NewBool('Антресоль над пеналами', true);
  YStyk = g.NewNumber('Уровень стыка дверей (0 = верх полки A2)', 0);

  g = Prop.NewGroup('Глубины');
  GNiz = g.NewNumber('Корпус низа', 560);
  GVerh = g.NewNumber('Корпус навесных (= пенал)', 560);
  GPen = g.NewNumber('Корпус пенала', 560);
  Sves = g.NewNumber('Свес столешницы', 20);
  CokUt = g.NewNumber('Утопление цоколя', 50);
  PmmGap = g.NewNumber('ПММ: зазор от стены (0=вплотную)', 0);
  JointX = g.NewNumber('Шов столешницы X (0=авто)', 0);

  g = Prop.NewGroup('Низ: стяжки вместо крышек');
  CargaOn = g.NewBool('Две стяжки вместо крышки', true);
  CargaW = g.NewNumber('Ширина стяжки (царги)', 100);

  g = Prop.NewGroup('Доборы');
  DobDoDobor = g.NewBool('Верхний добор от левого добора', true);
  DobVentA2 = g.NewBool('Решётка в доборе над A2 (выход воздуха)', true);
  Dobor = g.NewNumber('Добор слева', 30);

  g = Prop.NewGroup('Холодильник Jackys JR BW177NF');
  HolStyk = g.NewNumber('Стык дверей от низа ножек (692)', 692);
  HolNiche = g.NewNumber('Высота ниши (E 1770-1778)', 1774);
  HolW = g.NewNumber('Ширина ниши (560-570)', 560);
  HolD = g.NewNumber('Глубина прибора', 545);
  HolFasady = g.NewBool('Фасады дверей холодильника', true);
  HolPolVerh = g.NewNumber('Полок в шкафу над холодильником', 1);
  HolYasMin = g.NewNumber('Мин. фасад ящика KPL550A', 105);
  NaprL2 = g.NewNumber('KPL550A: длина направляющей', 550);
  YasH2 = g.NewNumber('KPL550A: высота борта', 84);
  VentHol = g.NewBool('Решётка под холодильником (не делаем)', false);

  g = Prop.NewGroup('Духовка EO 637 PB');
  DuhH = g.NewNumber('Ниша: высота (чертёж 590)', 590);
  DuhW = g.NewNumber('Ниша: ширина (чертёж 563)', 563);
  DuhD = g.NewNumber('Ниша: глубина (чертёж 550)', 550);
  DuhFrontW = g.NewNumber('Лицевая панель прибора: Ш (595)', 595);
  DuhFrontH = g.NewNumber('Лицевая панель прибора: В (600)', 600);
  DuhGapTop = g.NewNumber('Зазор сверху (0 = проём ровно 590)', 0);
  DuhGapBot = g.NewNumber('Канал У СТЕНЫ: полки, ящик, щели', 25);
  DuhZad = g.NewString('Задняя стенка зоны техники: Убрать/Отверстия/Оставить', 'Убрать');
  DuhVentArea = g.NewNumber('Площадь перфорации, см2 (>=200)', 250);
  DuhZazReq = g.NewNumber('Требуемый зазор сзади (паспорт)', 50);
  DuhVarC = g.NewBool('Вариант C: компенсация вентиляцией', true);
  DuhCokVent = g.NewBool('Решётка в цоколе под духовкой', true);
  DuhKryshaVent = g.NewBool('Щель в крыше пенала (укоротить)', true);
  DuhDnoVent = g.NewBool('Щель в дне пенала (укоротить)', true);
  DuhAntrDno = g.NewBool('Щель в дне антресоли A2', true);
  DuhAntrKrysha = g.NewBool('Щель в крыше антресоли A2 (выход)', true);
  KolPolA2 = g.NewNumber('Полок в шкафу A2 над СВЧ', 3);
  SvchH = g.NewNumber('СВЧ: высота ниши', 362);
  SvchW = g.NewNumber('СВЧ: ширина ниши', 560);
  Srez = g.NewNumber('Срез сзади 2-го пенала (под фартук)', 10);

  g = Prop.NewGroup('Вент. решётки');
  VentPmm = g.NewBool('Под ПММ (по паспорту)', false);
  VentW = g.NewNumber('Решётка Ш', 200);
  VentH = g.NewNumber('Решётка В', 60);

  g = Prop.NewGroup('Толщины по Заданию');
  ForceT = g.NewBool('Форсировать толщины', true);
  TKor = g.NewNumber('Корпус', 16);
  TNiz = g.NewNumber('Фасад низа МДФ', 19);
  TVerh = g.NewNumber('Фасад верха и пенала', 16);
  TZad = g.NewNumber('Задняя стенка ЛХДФ', 3);

  g = Prop.NewGroup('Зазоры, кромка, четверть');
  ZazF = g.NewNumber('Зазор фасадов', 2);
  ZazPol = g.NewNumber('Зазор полок', 2);
  Prir = g.NewNumber('Припуск кромки (по Заданию)', 0.5);
  KromMDF = g.NewBool('Кромить МДФ под эмаль', false);
  ChetOn = g.NewBool('Задняя стенка в четверть', true);
  ChetSh = g.NewNumber('Ширина четверти', 10);

  g = Prop.NewGroup('Стена A');
  AW = g.NewString('Ширины', '600,600,535,600');
  AT = g.NewString('Типы', 'холод,дух,варочная,угол');

  g = Prop.NewGroup('Стена B (только низ)');
  BW = g.NewString('Ширины', '500,600,420');
  BT = g.NewString('Типы', 'пмм,мойка,ящики');
  BOff = g.NewNumber('Отступ от угла (0=авто)', 0);
  BShift = g.NewNumber('Сдвиг нумерации B', 1);

  g = Prop.NewGroup('Наполнение и открывание');
  DrawList = g.NewString('Секции с ящиками', 'B4');
  KolYas = g.NewNumber('Ящиков в секции', 3);
  YasProp = g.NewString('Пропорции ящиков снизу вверх', '360,300,200');
  KolPol = g.NewNumber('Полок в нижних секциях', 1);
  KolPolVerh = g.NewNumber('Полок в верхнем A4', 2);
  KolPolA3 = g.NewNumber('Полок в верхнем A3 над вытяжкой', 2);
  MoyPol = g.NewNumber('Полок в секции мойки', 0);
  MoyDver = g.NewNumber('Дверец в секции мойки', 1);
  RuchMap = g.NewString('Сторона ручек', 'A1:R,A2:R,A3:L,A4:L,B2:L,B3:L,B4:L');

  g = Prop.NewGroup('Материалы');
  MKor = g.NewMaterial('Корпус: ЛДСП16 Кашемир');
  MFasN = g.NewMaterial('Низ: МДФ19 эмаль NCS S5030-G30Y');
  MFasV = g.NewMaterial('Верх/пенал: Дуб Кассела H1386');
  MBok = g.NewMaterial('Стойка/прав.боковина: Дуб Кассела');
  MZad = g.NewMaterial('Зад.стенка: ЛХДФ3 белый');
  MStol = g.NewMaterial('Столешница и фартук: камень');
  MCok = g.NewMaterial('Цоколь (если один цвет)');

  g = Prop.NewGroup('Фрезеровка');
  RamOn = g.NewBool('Рамка минимальная', true);
  RamOt = g.NewNumber('Отступ рамки', 30);
  Freza = g.NewString('Профиль', 'Фреза1.frw');

  g = Prop.NewGroup('Петли и ящики');
  PetlOt = g.NewNumber('Петля отступ по высоте', 100);
  PetlPl = g.NewNumber('Петля планка от передней кромки', 37);
  NaprL = g.NewNumber('Направляющая длина (KPL450B)', 450);
  YasH = g.NewNumber('Ящик борт (KPL450B)', 135);

  g = Prop.NewGroup('Прочая техника');
  PmmW = g.NewNumber('ПММ Ш', 453);
  PmmH = g.NewNumber('ПММ В', 820);
  VyrW = g.NewNumber('Варочная вырез Ш', 420);
  VyrD = g.NewNumber('Варочная вырез Г', 490);
  PlitaW = g.NewNumber('Варочная панель Ш', 450);
  VytH = g.NewNumber('Вытяжка В', 159);
  VytW = g.NewNumber('Вытяжка Ш', 498);
  VytD = g.NewNumber('Вытяжка Г', 260);
  MoyW = g.NewNumber('Мойка вырез Ш', 560);
  MoyD = g.NewNumber('Мойка вырез Г', 430);

  Prop.OnChange = function() { Make(); }
  Prop.NewButton('Сбросить настройки').OnClick = function() {
    try { system.writeTextFile(FileOptions, ''); } catch (e) {}
    alert('Настройки очищены. Перезапусти скрипт.');
  };
}

function CK(k){ if(!C[k]) C[k]={ok:0,nul:0,err:0,skip:0}; return C[k]; }
function IsA(wall){ return (wall=='A')||ROT; }
function SecCode(tg){ var m=String(tg).match(/[AB]\d+/); return m?m[0]:String(tg); }
function NV(o,k){ try{ var v=o[k]; return (typeof v==='function')?o[k]():v; }catch(e){ return null; } }
function ContCount(p){ try{ return NV(p.Contour,'Count'); }catch(e){ return -1; } }
function AreaOf(p){ try{ return geometry.Area(p.Contour); }catch(e){ return -1; } }
function WV(){ return TZ+1+DuhGapBot.Value; }
function Bad(){ for(var i=0;i<arguments.length;i++){ var v=arguments[i]; if(typeof v!=='number'||isNaN(v)) return true; } return false; }
function note(kind,how,e){ var k=kind+' / '+how; if(!ERRS[k]) ERRS[k]=String(e); }
function SecName(t){
  if(t=='холод') return 'Холодильник';
  if(t=='дух') return 'Духовка+СВЧ';
  if(t=='варочная') return 'Варочная';
  if(t=='угол') return 'Угловая';
  if(t=='пмм') return 'ПММ';
  if(t=='мойка') return 'Мойка';
  if(t=='ящики') return 'Ящики';
  return t;
}
function BlkOn(n){ if(!SecBlocks.Value) return null; try{ return BeginBlock(n); }catch(e){ return null; } }
function BlkOff(b){ if(b){ try{ EndBlock(); }catch(e){} } }
function Reg(tg,bl,br,zad,zadN){ SP[tg]={bl:bl,br:br,zad:zad,zadN:zadN}; }

function FurnVal(prop,name){
  var f=null;
  try{ f=prop.Value; }catch(e){}
  if(!f){ W.push('!! '+name+': не выбрана в базе'); return null; }
  var code='', got=false;
  try{ code=f.EncodeToString(); got=true; }catch(e){}
  if(got && (!code || code.length<8)){ W.push('!! '+name+': не выбрана в базе'); return null; }
  return f;
}
function DatumOf(f){
  var dm='?';
  try{ dm=(typeof f.DatumMode==='function')?f.DatumMode():f.DatumMode; }catch(e){}
  return dm;
}
function Place(o,q,axz){
  try{ o.Position=q; }catch(e){}
  if(axz){ try{ o.Orient(axz,AxisY); }catch(e){} }
}

// ==== установка фурнитуры: 5 попыток + сбор текстов ошибок ====
function MountFurn(f,kind,pA,pB,wall,u,v,w,ang,axz,altV){
  var c=CK(kind);
  if(!f){ c.skip++; return null; }
  var q=G(wall,u,v,w), o=null, how='';
  var prim=(kind=='Петли')?'Mount':'Mount1';
  if(prim=='Mount1'){ try{ o=f.Mount1(pA,q.x,q.y,q.z,ang); how='Mount1'; }catch(e){ note(kind,'Mount1',e); } }
  else { try{ o=f.Mount(pA,pB,q.x,q.y,q.z); how='Mount'; }catch(e){ note(kind,'Mount',e); } }
  if(!o){
    if(prim=='Mount1'){ if(pB){ try{ o=f.Mount(pA,pB,q.x,q.y,q.z); how='Mount'; }catch(e){ note(kind,'Mount',e); } } }
    else { try{ o=f.Mount1(pA,q.x,q.y,q.z,ang); how='Mount1'; }catch(e){ note(kind,'Mount1',e); } }
  }
  if(!o && altV!==undefined && altV!==null){
    var q2=G(wall,u,altV,w);
    try{ o=f.Mount1(pA,q2.x,q2.y,q2.z,ang); how='Mount1 вторая пласть'; }catch(e){ note(kind,'Mount1 пласть2',e); }
  }
  if(!o){ try{ o=f.Make(TK,TK); if(o){ Place(o,q,axz); how='Make(t,t) без присадки'; } }catch(e){ note(kind,'Make(t,t)',e); } }
  if(!o){ try{ o=f.Make(); if(o){ Place(o,q,axz); how='Make() без присадки'; } }catch(e){ note(kind,'Make()',e); } }
  if(o){ c.ok++; var k=kind+' / '+how; MH[k]=(MH[k]||0)+1; }
  else c.nul++;
  return o;
}

function CutHor(p,u1,w1,du,dw,tag){
  if(Bad(u1,w1,du,dw)){ W.push('!! '+tag+': неверные числа, вырез пропущен'); return; }
  var c=p.Contour,ox=0,yT=0;
  try{ ox=c.Min.x; yT=c.Max.y; }catch(e){}
  var n0=ContCount(p),a0=AreaOf(p);
  var x0=ox+u1,y2=yT-w1,y1=y2-dw;
  var h=NewContour(); h.AddRectangle(x0,y1,x0+du,y2);
  try{ p.Contour.Subtraction(h); }catch(e){ try{ p.Contour.Substraction(h); }catch(e2){} }
  try{ p.Build(); }catch(e){}
  var a1=AreaOf(p),need=du*dw;
  if(!(a0>0&&a1>0&&(a0-a1)>need*0.5)){
    try{ p.Contour.AddRectangle(x0,y1,x0+du,y2); p.Build(); }catch(e){}
    a1=AreaOf(p);
  }
  var got=(a0>0&&a1>0)?Math.round(a0-a1):-1;
  W.push('Проём '+tag+': '+n0+'->'+ContCount(p)+' элем., снято '+got+' из '+Math.round(need)+
         ((got>need*0.5)?' OK':' !! НЕ СДЕЛАН')+'; от стены '+Math.round(w1)+'...'+Math.round(w1+dw)+' мм');
}
function CutFront(p,x1,y1,dx,dy,tag){
  if(Bad(x1,y1,dx,dy)){ W.push('!! '+tag+': неверные числа, вырез пропущен'); return; }
  try{
    var c=p.Contour,h=NewContour(),x=c.Min.x+x1,y=c.Min.y+y1;
    h.AddRectangle(x,y,x+dx,y+dy);
    var n0=ContCount(p),a0=AreaOf(p);
    try{ p.Contour.Subtraction(h); }catch(e){ p.Contour.Substraction(h); }
    p.Build();
    var got=Math.round(a0-AreaOf(p));
    W.push(tag+': '+n0+'->'+ContCount(p)+' элем., снято '+got+' из '+Math.round(dx*dy)+
           ((got>dx*dy*0.5)?' OK':' !! НЕ СДЕЛАН'));
  }catch(e){ W.push('Проём не сделан: '+tag); }
}

function KanBox(wall){
  var P=KanalP.Value,z1=KanalZ1.Value,z2=KanalZ2.Value,v1=KanalY1.Value,v2=KanalY2.Value;
  if(wall=='A') return {u1:XR-P,u2:XR,w1:z1,w2:z2,v1:v1,v2:v2};
  var off=ROT?KOFF:0;
  return {u1:z1-off,u2:z2-off,w1:0,w2:P,v1:v1,v2:v2};
}
function FartBox(wall){
  var x1=XR-FartLevo.Value, x2=XR-FartPravo.Value, t=FartT.Value;
  var v1=FartNiz.Value, v2=FartVerh.Value;
  if(wall=='A') return {u1:x1,u2:x2,w1:0,w2:t,v1:v1,v2:v2};
  var off=ROT?KOFF:0;
  return {u1:0-off,u2:t-off,w1:XR-x2,w2:XR-x1,v1:v1,v2:v2};
}
function ObsOK(wall,on){
  if(!on) return false;
  if(!IsA(wall)){ if(!KanWarn){ W.push('Препятствия считаются только при повороте стены B'); KanWarn=true; } return false; }
  return true;
}
function Sever(a1,a2,b1,b2,pu1,pu2,pw1,pw2,tag,pre){
  var fA=(a2-a1)>=(pu2-pu1)-0.5, fB=(b2-b1)>=(pw2-pw1)-0.5;
  var iA=(a1>pu1+0.5&&a2<pu2-0.5), iB=(b1>pw1+0.5&&b2<pw2-0.5);
  if((fA&&iB)||(fB&&iA)){
    if(String(tag).indexOf('Зад.стенка')>=0)
      W.push(pre+' делит '+tag+' на две части — для ЛХДФ допустимо');
    else
      W.push('!! '+pre+' рассекает '+tag+' насквозь — нужно конструктивное решение');
  }
}
function ObsHor(p,wall,u1,u2,w1,w2,v,t,tag,K,pre){
  if(Bad(u1,u2,w1,w2,v,t,K.u1,K.u2,K.w1,K.w2,K.v1,K.v2)) return;
  if(v+t<=K.v1||v>=K.v2) return;
  var a1=Math.max(u1,K.u1),a2=Math.min(u2,K.u2);
  var b1=Math.max(w1,K.w1),b2=Math.min(w2,K.w2);
  if(a2<=a1||b2<=b1) return;
  Sever(a1,a2,b1,b2,u1,u2,w1,w2,tag,pre);
  CutHor(p,a1-u1,b1-w1,a2-a1,b2-b1,pre+' '+tag);
}
function ObsBok(p,wall,u,w1,w2,v1,v2,t,tag,K,pre){
  if(Bad(u,w1,w2,v1,v2,K.u1,K.u2,K.w1,K.w2,K.v1,K.v2)) return;
  if(u+TK<=K.u1||u>=K.u2) return;
  var a1=Math.max(w1,K.w1),a2=Math.min(w2,K.w2);
  var b1=Math.max(v1,K.v1),b2=Math.min(v2,K.v2);
  if(a2<=a1||b2<=b1) return;
  Sever(a1,a2,b1,b2,w1,w2,v1,v2,tag,pre);
  CutFront(p,a1-w1,b1-v1,a2-a1,b2-b1,pre+' '+tag);
}
function ObsFas(p,wall,u1,u2,v1,v2,w,t,tag,K,pre){
  if(Bad(u1,u2,v1,v2,w,t,K.u1,K.u2,K.w1,K.w2,K.v1,K.v2)) return;
  if(w+t<=K.w1||w>=K.w2) return;
  var a1=Math.max(u1,K.u1),a2=Math.min(u2,K.u2);
  var b1=Math.max(v1,K.v1),b2=Math.min(v2,K.v2);
  if(a2<=a1||b2<=b1) return;
  Sever(a1,a2,b1,b2,u1,u2,v1,v2,tag,pre);
  CutFront(p,a1-u1,b1-v1,a2-a1,b2-b1,pre+' '+tag);
}
function ApplyObs(p,wall,kind,tag,a,b,c,d,e,f){
  if(ObsOK(wall,KanalOn.Value)){
    var K=KanBox(wall);
    if(kind=='hor') ObsHor(p,wall,a,b,c,d,e,f,tag,K,'КАНАЛ');
    else if(kind=='bok') ObsBok(p,wall,a,b,c,d,e,f,tag,K,'КАНАЛ');
    else ObsFas(p,wall,a,b,c,d,e,f,tag,K,'КАНАЛ');
  }
  if(ObsOK(wall,FartOn.Value)){
    var F=FartBox(wall);
    if(kind=='hor') ObsHor(p,wall,a,b,c,d,e,f,tag,F,'ФАРТУК');
    else if(kind=='bok') ObsBok(p,wall,a,b,c,d,e,f,tag,F,'ФАРТУК');
    else ObsFas(p,wall,a,b,c,d,e,f,tag,F,'ФАРТУК');
  }
}

function ApplyPmmDostup(){
  if(!PmmDostup.Value) return;
  var ts=SplitStr(BT.Value),tgP=null,tgM=null;
  for(var i=0;i<ts.length;i++){
    if(ts[i]=='пмм') tgP=Tag('B',i);
    if(ts[i]=='мойка') tgM=Tag('B',i);
  }
  if(!tgP||!tgM){ W.push('Доступ ПММ: секции пмм/мойка не найдены'); return; }
  var h=PmmKomY2.Value-PmmKomY1.Value, dep=PmmDostW.Value;
  var rp=SP[tgP],rm=SP[tgM];
  if(rp&&rp.br) CutFront(rp.br,0,PmmKomY1.Value-Cok.Value,dep,h,'ДОСТУП ПММ боковина прав '+tgP);
  if(rm&&rm.bl) CutFront(rm.bl,0,PmmKomY1.Value-Cok.Value,dep,h,'ДОСТУП ПММ боковина лев '+tgM);
}
function ApplyUglDostup(){
  if(!UglDostup.Value) return;
  var ts=SplitStr(AT.Value), idx=-1;
  for(var i=0;i<ts.length;i++) if(ts[i]=='угол') idx=i;
  if(idx<1){ W.push('Доступ в угол: секция перед угловой не найдена'); return; }
  var tg=Tag('A',idx-1), rec=SP[tg];
  if(!rec||!rec.br){ W.push('Доступ в угол: боковина '+tg+' не найдена'); return; }
  var u1,v1,ww,hh;
  if(UglDostAuto.Value){
    var g=GNiz.Value, ram=UglDostRamka.Value;
    u1=Math.max(ram,60);
    var u2=Math.min(g-ram,g-90);
    v1=Cok.Value+ram;
    var v2=yN-ram;
    ww=u2-u1; hh=v2-v1;
    if(ww<50||hh<50){ W.push('Доступ в угол: рамка '+ram+' слишком велика'); return; }
  } else { u1=UglDostU.Value; v1=UglDostV.Value; ww=UglDostW.Value; hh=UglDostH.Value; }
  CutFront(rec.br,u1,v1-Cok.Value,ww,hh,'ДОСТУП В УГОЛ боковина прав '+tg);
  W.push('Доступ в угол: вырез '+Math.round(ww)+'x'+Math.round(hh)+', от пола '+Math.round(v1)+'...'+Math.round(v1+hh));
}
function ApplyLuki(){
  var s=SplitStr(LukSpisok.Value);
  for(var i=0;i<s.length;i++){
    if(!s[i]) continue;
    var p=s[i].split(':');
    if(p.length<6){ W.push('Лючок: неверный формат "'+s[i]+'"'); continue; }
    var tg=p[0],el=p[1],u=parseFloat(p[2]),v=parseFloat(p[3]),dw=parseFloat(p[4]),dh=parseFloat(p[5]);
    var rec=SP[tg];
    if(!rec){ W.push('Лючок: секция '+tg+' не найдена'); continue; }
    var pan=(el=='лев')?rec.bl:(el=='прав')?rec.br:(el=='задниз')?rec.zadN:rec.zad;
    if(!pan){ W.push('Лючок: элемент "'+el+'" в '+tg+' отсутствует'); continue; }
    CutFront(pan,u,v,dw,dh,'ЛЮЧОК '+tg+' '+el+' '+dw+'x'+dh);
  }
}
function MakeFartuk(){
  if(!FartOn.Value||!FartModel.Value) return;
  var x1=XR-FartLevo.Value,x2=XR-FartPravo.Value;
  var b=BlkOn('Фартук');
  MStol.SetActive();
  var p=AddFrontPanel(x1,FartNiz.Value,x2,FartVerh.Value,0);
  Fin(p,'Фартук',true,[0,1,2,3],false,FartT.Value);
  BlkOff(b);
  W.push('ФАРТУК: X '+x1+'...'+x2+', Y '+FartNiz.Value+'...'+FartVerh.Value+', Z 0...'+FartT.Value);
  if(Srez.Value<FartT.Value) W.push('!! Срез боковины A2 '+Srez.Value+' < отступа фартука '+FartT.Value);
}

function DuctCut(p,pu1,pu2,pw1,pw2,axis,notch,tag){
  if(!DUCT||!DUCT.on) return;
  var r=DUCT.dia/2,x1,x2,z1,z2,zz=DuctZazor.Value;
  if(axis=='hood'){ x1=DUCT.hx-r; x2=DUCT.hx+r; z1=DUCT.hz-r; z2=DUCT.hz+r; }
  else if(axis=='ceil'){ x1=DUCT.cx-r; x2=DUCT.cx+r; z1=DUCT.cz-r; z2=DUCT.cz+r; }
  else { x1=Math.min(DUCT.hx,DUCT.cx)-r; x2=Math.max(DUCT.hx,DUCT.cx)+r;
         z1=Math.min(DUCT.hz,DUCT.cz)-r; z2=Math.max(DUCT.hz,DUCT.cz)+r; }
  var u1,du,w1,dw;
  if(notch){ u1=x1-pu1-zz; du=(x2-x1)+2*zz; w1=0; dw=(z2-pw1)+zz; if(dw>(pw2-pw1)) dw=pw2-pw1; }
  else { u1=x1-pu1; du=x2-x1; w1=z1-pw1; dw=z2-z1; }
  if(u1<0||u1+du>(pu2-pu1)+0.5||w1<0||dw<=0){ W.push('ТРАССА '+tag+': проём не влезает'); return; }
  CutHor(p,u1,w1,du,dw,'ТРАССА '+tag+(notch?' ПАЗ к задней кромке':' отверстие')+
         ' по оси '+(axis=='hood'?'вытяжки':axis=='ceil'?'потолка':'ОБЕИХ'));
}

function SetAnim(blk,names){
  if(!blk||!AnimOn.Value) return null;
  for(var i=0;i<names.length;i++){
    try{ var v=AnimationType[names[i]];
      if(v!==undefined&&v!==null){ blk.AnimType=v; AnimUsed[names[i]]=(AnimUsed[names[i]]||0)+1; return names[i]; }
    }catch(e){}
  }
  AnimUsed['НЕ НАЙДЕН']=(AnimUsed['НЕ НАЙДЕН']||0)+1; return null;
}
function AnimDump(){
  var s='AnimationType:\n';
  try{ for(var k in AnimationType) s+=k+' = '+AnimationType[k]+'\n'; }catch(e){}
  s+='\nПрименено:\n';
  for(var k2 in AnimUsed) s+=k2+': '+AnimUsed[k2]+'\n';
  alert(s);
}
function BlockDump(){
  var s='ДАМП БЛОКОВ\n',cnt=0;
  function Props(o){ var t='';
    for(var k in o){ try{ var v=o[k],tp=typeof v;
      if(tp==='function') continue;
      if(tp==='object'&&v!==null&&v.x!==undefined) t+='  '+k+' = ('+v.x+','+v.y+','+v.z+')\n';
      else if(tp!=='object') t+='  '+k+' = '+v+'\n';
    }catch(e){} } return t; }
  function Walk(list,d){
    if(d>5) return;
    var n=NV(list,'Count'),arr=(typeof n==='number')?null:NV(list,'Objects');
    var t=(typeof n==='number')?n:(arr?arr.length:0);
    for(var i=0;i<t;i++){
      var o=arr?arr[i]:list[i]; if(!o) continue;
      var nm=String(NV(o,'Name'));
      if(NV(o,'List')){
        if(cnt<8&&(nm.indexOf('Ящик')===0||nm.indexOf('Двер')===0)){
          cnt++; s+='\n=== '+nm+' ===\n';
          var m=NV(o,'Count'),a2=(typeof m==='number')?null:NV(o,'Objects');
          var tt=(typeof m==='number')?m:(a2?a2.length:0);
          for(var j=0;j<tt;j++){ var q=a2?a2[j]:o[j]; if(q) s+='  '+NV(q,'Name')+'\n'; }
          s+=Props(o);
        }
        Walk(o,d+1);
      }
    }
  }
  try{ Walk(Model,0); }catch(e){ s+='Обход: '+e; }
  try{ system.askWriteTextFile('txt',s); alert('Дамп сохранён.'); }catch(e){ alert(s); }
}

function LoadFurn(){
  fPetl=OpenOne(SPetl.Value,'Петля');
  fNapr=OpenOne(SNapr.Value,'Ящик KPL450B');
  fNapr2=OpenOne(SNapr2.Value,'Ящик KPL550A');
  fOpor=FurnVal(FOpor,'Опоры');
  fRuch=FurnVal(FRuch,'Ручки');
  fPolk=FurnVal(FPolk,'Полкодержатели');
  var ok=[];
  if(fPetl) ok.push('петля'); if(fNapr) ok.push('ящик450'); if(fNapr2) ok.push('ящик550');
  if(fOpor) ok.push('опоры'); if(fRuch) ok.push('ручки'); if(fPolk) ok.push('полкодержатели');
  W.push('Фурнитура загружена: '+(ok.length?ok.join(', '):'НИ ОДНОЙ')+' ('+ok.length+' из 6)');
  if(fOpor) W.push('Привязка опор: '+DatumOf(fOpor)+(DatumOf(fOpor)==0?' — присадки не будет, ищи тип Face':''));
  if(fRuch) W.push('Привязка ручек: '+DatumOf(fRuch));
  if(fPolk) W.push('Привязка полкодержателей: '+DatumOf(fPolk));
}
function OpenOne(path,name){
  if(!path){ W.push('!! '+name+': путь к .fr3d не задан'); return null; }
  try{ var f=OpenFurniture(path); if(!f) W.push(name+': OpenFurniture вернул пусто'); return f?f:null; }
  catch(e){ W.push(name+': не открыт — '+e); return null; }
}
function DiagFurn(){
  var s='ДИАГНОСТИКА ФУРНИТУРЫ\n';
  s+='\nНастройки: '+(Loaded?'загружены из '+FileOptions:'НЕ загружены')+'; автосохранение включено';
  s+='\n\n-- фрагменты .fr3d --';
  s+=DFile('Петля',SPetl.Value,fPetl);
  s+=DFile('Ящик 450',SNapr.Value,fNapr);
  s+=DFile('Ящик 550',SNapr2.Value,fNapr2);
  s+='\n\n-- фурнитура из базы --';
  s+=DBase('Опоры',fOpor);
  s+=DBase('Ручки',fRuch);
  s+=DBase('Полкодержатели',fPolk);
  s+='\n\nСЧЁТ (создано/пусто/ошибок/пропущено)';
  for(var k in C) s+='\n'+k+': '+C[k].ok+' / '+C[k].nul+' / '+C[k].err+' / '+C[k].skip;
  s+='\n\nМЕТОДЫ УСТАНОВКИ';
  for(var m in MH) s+='\n'+m+': '+MH[m];
  s+='\n\nОШИБКИ ПОПЫТОК (первая на каждый метод)';
  var any=false;
  for(var e in ERRS){ any=true; s+='\n'+e+' -> '+ERRS[e]; }
  if(!any) s+='\nнет';
  s+='\n\nПривязки: 0=None, 1=Face>Mount1, 2..5=FaceFace/etc>Mount, 6=Box>MountBox, 7=Scheme';
  try{ system.askWriteTextFile('txt',s); alert('Диагностика сохранена в txt.'); }catch(e){ alert(s); }
}
function DFile(name,path,obj){
  var s='\n'+name+': ';
  if(!path) return s+'ПУТЬ НЕ ЗАДАН';
  s+=system.getFileName(path);
  if(!obj) return s+'\n  НЕ ОТКРЫТ';
  return s+', привязка '+DatumOf(obj);
}
function DBase(name,obj){
  var s='\n'+name+': ';
  if(!obj) return s+'НЕ ВЫБРАНА';
  s+='выбрана, привязка '+DatumOf(obj);
  var code=''; try{ code=obj.EncodeToString(); }catch(e){}
  if(code) s+='\n  код: '+code.substring(0,70);
  return s;
}

function Make(){
  if(Making) return;
  Making=true;
  DeleteNewObjects(); W=[]; NP=0; C={}; AnimUsed={}; ROT=false; SP={}; MH={}; ERRS={};
  DUCT=null; KanWarn=false; KOFF=0; GOvr=0;
  LoadFurn();
  W.push('Настройки: '+(Loaded?'загружены из файла':'НЕ загружены (будут записаны сейчас)'));
  try{ KrV.Allowance=Prir.Value; KrV.ClipPanel=true; KrN.Allowance=Prir.Value; KrN.ClipPanel=true; }catch(e){}
  try{
    MKor.SetActive();  TK  = ForceT.Value?TKor.Value:ActiveMaterial.Thickness;
    MFasN.SetActive(); TFN = ForceT.Value?TNiz.Value:ActiveMaterial.Thickness;
    MFasV.SetActive(); TFV = ForceT.Value?TVerh.Value:ActiveMaterial.Thickness;
    MZad.SetActive();  TZ  = ForceT.Value?TZad.Value:ActiveMaterial.Thickness;
    XR=WallA.Value; dS=GNiz.Value+TFN+Sves.Value;
    BOFF=BOff.Value; if(BOFF<=0) BOFF=GNiz.Value+TFN;
    yN=HNiz.Value; yS=yN+TStol.Value;
    yMid=YStyk.Value>0?YStyk.Value:yS;
    yV=yS+Fart.Value; yVT=yV+HVerh.Value;
    hA=HGarn.Value-yVT; if(hA<100){ hA=0; W.push('Антресоль не влезает'); }
    hDob=HPot.Value-HGarn.Value;
    if(KanalOn.Value) W.push('КАНАЛ: X '+(XR-KanalP.Value)+'...'+XR+', Y '+KanalY1.Value+'...'+
        KanalY2.Value+', Z '+KanalZ1.Value+'...'+KanalZ2.Value);
    SetupDuct();
    CheckTech();
    BuildWall('A',0);
    KOFF=BOFF;
    if(RotB.Value){
      ROT=true;
      var wb=BlkOn('Стена B');
      BuildWall('B',0);
      BlkOff(wb);
      ROT=false;
      if(wb){
        try{ wb.RotateY(-90); }catch(e){ W.push('Поворот B: '+e); }
        try{ wb.TranslateGCS(NewVector(XR,0,BOFF)); }catch(e){ W.push('Сдвиг B: '+e); }
      } else BuildWall('B',BOFF);
    } else BuildWall('B',BOFF);
    MakeCountertops();
    MakeFartuk();
    ApplyPmmDostup();
    ApplyUglDostup();
    ApplyLuki();
    if(ForceT.Value) W.push('Толщины форсированы — материалы назначь для спецификации');
  }catch(e){ alert('Ошибка построения: '+e); }
  SaveProps();
  Making=false;
  Report();
}

function SetupDuct(){
  DUCT={on:VentTruba.Value,dia:VentDia.Value,hx:0,hz:0,cx:0,cz:0,nw1:0};
  var ws=SplitNum(AW.Value),ts=SplitStr(AT.Value),u=0,found=false;
  for(var i=0;i<ts.length;i++){
    if(ts[i]=='варочная'){ DUCT.hx=u+ws[i]/2+VytOsiSmU.Value; found=true; }
    u+=ws[i];
  }
  DUCT.cx=XR-VentPotB.Value; DUCT.cz=VentPotA.Value;
  var hc=dS/2;
  DUCT.nw1=(VytPriv.Value=='Центр шкафа')?((GVerh.Value-VytD.Value)/2):(hc-VytD.Value/2);
  DUCT.hz=DUCT.nw1+VytOsiOtZad.Value;
  if(!found){ DUCT.on=false; W.push('Трасса: секция варочной не найдена'); return; }
  if(DUCT.on){
    var dx=Math.abs(DUCT.cx-DUCT.hx),dz=Math.abs(DUCT.cz-DUCT.hz);
    W.push('ТРАССА: ниша вытяжки '+DUCT.nw1+'...'+(DUCT.nw1+VytD.Value)+', ось Z='+DUCT.hz+
           '; ось потолка X='+DUCT.cx+' Z='+DUCT.cz+'; смещение '+dx+'/'+dz);
  }
}

function CheckTech(){
  var ws=SplitNum(AW.Value),ts=SplitStr(AT.Value),i;
  for(i=0;i<ts.length;i++){
    var inner=ws[i]-2*TK;
    if(ts[i]=='варочная'){
      if(PlitaW.Value>ws[i]) W.push('ВАРОЧНАЯ: панель '+PlitaW.Value+' > секции '+ws[i]);
      if(VyrW.Value>inner) W.push('ВАРОЧНАЯ: вырез '+VyrW.Value+' > просвета '+inner);
      if(VytW.Value>inner) W.push('ВЫТЯЖКА: '+VytW.Value+' > просвета '+inner);
    }
    if(ts[i]=='холод'){
      if(HolW.Value>inner) W.push('ХОЛОДИЛЬНИК: ниша '+HolW.Value+' > просвета '+inner);
      var hb=yMid-HolStyk.Value,ht=hb+HolNiche.Value,fh=hb-Cok.Value-2*ZazF.Value;
      if(fh<HolYasMin.Value) W.push('ХОЛОДИЛЬНИК: фасад '+Math.round(fh)+' < '+HolYasMin.Value);
      if(ht+TK>yVT-60) W.push('ХОЛОДИЛЬНИК: верх ниши '+Math.round(ht));
      if(GPen.Value-HolD.Value<40) W.push('Холодильник: зазор сзади '+(GPen.Value-HolD.Value)+' мм < min 40');
    }
    if(ts[i]=='дух'){
      if(DuhW.Value>inner) W.push('ДУХОВКА: ниша '+DuhW.Value+' > просвета '+inner);
      if(GPen.Value-DuhD.Value<DuhZazReq.Value&&DuhVarC.Value)
        W.push('Духовка: зазор сзади '+(GPen.Value-DuhD.Value)+' мм — ВАРИАНТ C');
    }
  }
  var bs=SplitNum(BW.Value),bt=SplitStr(BT.Value);
  for(i=0;i<bt.length;i++)
    if(bt[i]=='пмм'&&PmmW.Value>bs[i]-2*TK) W.push('ПММ: '+PmmW.Value+' > просвета '+(bs[i]-2*TK));
}

function BuildWall(wall,u0){
  var ws=SplitNum(wall=='A'?AW.Value:BW.Value);
  var ts=SplitStr(wall=='A'?AT.Value:BT.Value);
  if(ws.length!=ts.length){ W.push('Стена '+wall+': ширины/типы не совпали'); return; }
  var i,u=u0,sum=0,pos=[],penTop=[],vents=[];
  for(i=0;i<ws.length;i++){ pos.push(u); sum+=ws[i]; u+=ws[i]; }
  for(i=0;i<ws.length;i++){
    var t=ts[i],tg=Tag(wall,i),b=null,pt=yVT;
    if(wall=='A' && t=='угол' && UglRotOn.Value){
      var Wr=GNiz.Value+TFN;
      var Gr=(UglRotGlub.Value>0)?UglRotGlub.Value:(dS-TFN);
      ROT=true; KOFF=0; GOvr=Gr;
      b=BlkOn(tg+' Угловая повёрнутая');
      pt=Niz('B',0,Wr,'угол',tg);
      BlkOff(b);
      GOvr=0; ROT=false;
      if(b){
        try{ b.RotateY(-90); }catch(e){ W.push('Поворот угловой: '+e); }
        try{ b.TranslateGCS(NewVector(XR,0,0)); }catch(e){ W.push('Сдвиг угловой: '+e); }
      }
      W.push('Угловая '+tg+' повёрнута 90°: Z 0...'+Wr+', X '+(XR-Gr-TFN)+'...'+XR);
    } else {
      b=BlkOn(tg+' '+SecName(t));
      if(t=='холод'||t=='дух') pt=Penal(wall,pos[i],ws[i],t,tg);
      else if(t=='пмм') pt=Nisha(wall,pos[i],ws[i],tg);
      else pt=Niz(wall,pos[i],ws[i],t,tg);
      BlkOff(b);
    }
    penTop.push(pt);
    if(wall=='A'&&t=='холод'&&VentHol.Value) vents.push(pos[i]+ws[i]/2);
    if(wall=='A'&&t=='дух'&&DuhCokVent.Value) vents.push(pos[i]+ws[i]/2);
    if(wall=='B'&&t=='пмм'&&VentPmm.Value) vents.push(pos[i]+ws[i]/2);
  }
  var z=CokZaz.Value/2,pl0=u0,pl1=u;
  if(wall=='A'){
    if(CokDoDobor.Value) pl0=u0-Dobor.Value;
    if(CokAKorotko.Value){
      pl1=(CokAEnd.Value>0)?CokAEnd.Value:(XR-(GNiz.Value-CokUt.Value+TK));
      W.push('Цоколь A укорочен справа до X='+pl1);
    }
  }
  var bc=BlkOn('Цоколь '+wall);
  if(wall=='A'&&CokDva.Value){
    var sx=CokSplitX.Value;
    if(sx<=0){ sx=u0; for(i=0;i<ws.length;i++){ if(ts[i]=='холод'||ts[i]=='дух') sx=pos[i]+ws[i]; else break; } }
    var va=[],vb=[];
    for(var q=0;q<vents.length;q++){ if(vents[q]<sx) va.push(vents[q]); else vb.push(vents[q]); }
    PlinthRunM(wall,pl0+z,sx-z,GNiz.Value,va,'A пеналы',MFasV);
    PlinthRunM(wall,sx+z,pl1-z,GNiz.Value,vb,'A низ',MFasN);
    W.push('Цоколь A: '+pl0+'...'+sx+' — Дуб Кассела; '+sx+'...'+pl1+' — МДФ эмаль');
  } else if(wall=='B'&&CokBStyk.Value){
    var st=GNiz.Value-CokUt.Value+TK; if(ROT) st-=BOFF;
    var en=CokTorec.Value?(u-TK):(pl1-z);
    PlinthRunM(wall,st,en,GNiz.Value,vents,wall,MCok);
  } else if(CokSplosh.Value) PlinthRunM(wall,pl0+z,pl1-z,GNiz.Value,vents,wall,MCok);
  else for(i=0;i<ws.length;i++){
    var vv=[];
    for(var q2=0;q2<vents.length;q2++) if(vents[q2]>pos[i]&&vents[q2]<pos[i]+ws[i]) vv.push(vents[q2]);
    PlinthRunM(wall,pos[i]+z,pos[i]+ws[i]-z,GNiz.Value,vv,Tag(wall,i),MCok);
  }
  if(wall=='B'&&CokTorec.Value) PlinthSide(wall,u,GNiz.Value,Tag(wall,ws.length-1));
  BlkOff(bc);
  if(wall=='A'){
    for(i=0;i<ws.length;i++){
      var tg2=Tag(wall,i),isPen=(ts[i]=='холод'||ts[i]=='дух'),isHood=(ts[i]=='варочная');
      if(!isPen){
        var b1=BlkOn('Верх '+tg2+(isHood?' (вытяжка)':''));
        Verh(wall,pos[i],ws[i],yV,HVerh.Value,'Верх '+tg2,ts[i],isHood?'низ':'');
        BlkOff(b1);
      }
      if(hA>0&&(PenAntr.Value||!isPen)){
        if(penTop[i]>yVT+1){
          var bf=BlkOn('Добор над '+tg2);
          Fas(wall,pos[i],pos[i]+ws[i],penTop[i],HGarn.Value,GVerh.Value,'Добор над '+tg2,MFasV,false,TFV);
          BlkOff(bf);
        } else {
          var b2=BlkOn('Антресоль '+tg2);
          Verh(wall,pos[i],ws[i],yVT,hA,'Антресоль '+tg2,(ts[i]=='дух'?'вент':''),isHood?'антр':'');
          BlkOff(b2);
        }
      }
    }
    var bd=BlkOn('Доборы'),d0=DobDoDobor.Value?(u0-Dobor.Value):u0;
    if(hDob>0){
      var dp=Fas(wall,d0,u,HGarn.Value,HPot.Value,GVerh.Value,'Добор верхний A',MFasV,false,TFV);
      if(DobVentA2.Value)
        for(var k=0;k<ts.length;k++)
          if(ts[k]=='дух') VentAt(dp,pos[k]+ws[k]/2-d0,'ДОБОР над '+Tag(wall,k));
    }
    if(Dobor.Value>0) Fas(wall,u0-Dobor.Value,u0,Cok.Value,HGarn.Value,GPen.Value,'Добор слева 30',MFasV,false,TFV);
    BlkOff(bd);
  }
  var lim=(wall=='A')?WallA.Value:WallB.Value;
  var fact=sum+((wall=='B')?BOFF:0);
  if(Math.abs(fact-lim)>25) W.push('Стена '+wall+': занято '+fact+' из '+lim);
}

function PlinthRunM(wall,a,b,g,vents,tag,mat){
  if(b<=a) return null;
  var ck=Fas(wall,a,b,0,Cok.Value,g-CokUt.Value,'Цоколь '+tag,mat,false,0);
  for(var i=0;i<vents.length;i++) VentAt(ck,vents[i]-a,'цоколь '+tag);
  return ck;
}
function VentAt(p,uc,tag){
  try{
    var c=p.Contour,h=NewContour(),x=c.Min.x+uc-VentW.Value/2,y=c.Min.y+15;
    h.AddRectangle(x,y,x+VentW.Value,y+VentH.Value);
    var n0=ContCount(p),a0=AreaOf(p);
    try{ p.Contour.Subtraction(h); }catch(e){ p.Contour.Substraction(h); }
    p.Build();
    W.push('Решётка '+tag+': '+n0+'->'+ContCount(p)+' элем., снято '+Math.round(a0-AreaOf(p))+' мм2');
  }catch(e){ W.push('Решётка не сделана: '+tag); }
}
function PlinthSide(wall,uEnd,g,tg){
  MCok.SetActive();
  var w2=g-CokUt.Value+TK;
  var p=IsA(wall)?AddVertPanel(0,0,w2,Cok.Value,uEnd-TK):AddFrontPanel(XR-w2,0,XR,Cok.Value,uEnd-TK);
  return Fin(p,'Цоколь боковой '+tg,true,[0,1,2,3],false,0);
}

function MakeCountertops(){
  var wsA=SplitNum(AW.Value),tsA=SplitStr(AT.Value);
  var wsB=SplitNum(BW.Value),tsB=SplitStr(BT.Value);
  var i,posA=[],u=0,aStart=-1;
  for(i=0;i<wsA.length;i++){ posA.push(u); if(aStart<0&&tsA[i]!='холод'&&tsA[i]!='дух') aStart=u; u+=wsA[i]; }
  var xj=JointX.Value; if(xj<=0) xj=XR-dS;
  var zEnd=BOFF; for(i=0;i<wsB.length;i++) zEnd+=wsB[i];
  var b=BlkOn('Столешницы'),stA=null;
  MStol.SetActive();
  if(aStart>=0&&xj>aStart+10){
    stA=AddHorizPanel(aStart,0,xj,dS,yN);
    Fin(stA,'Столешница A',true,[1,2,3],false,TStol.Value);
  }
  var stB=AddHorizPanel(xj,0,XR,zEnd,yN);
  Fin(stB,'Столешница B',true,[1,2,3],false,TStol.Value);
  for(i=0;i<wsA.length;i++)
    if(tsA[i]=='варочная'&&stA)
      CutHor(stA,posA[i]+(wsA[i]-VyrW.Value)/2-aStart,(dS-VyrD.Value)/2,VyrW.Value,VyrD.Value,'ВАРОЧНАЯ в столешнице A');
  var uz=BOFF;
  for(i=0;i<tsB.length;i++){
    if(tsB[i]=='мойка')
      CutHor(stB,(XR-dS+(dS-MoyD.Value)/2)-xj,uz+(wsB[i]-MoyW.Value)/2,MoyD.Value,MoyW.Value,'МОЙКА в столешнице B');
    uz+=wsB[i];
  }
  BlkOff(b);
}

function TopRails(wall,u,w,g,v,tg,mat){
  var cw=CargaW.Value;
  var r1=Hor(wall,u+TK,u+w-TK,0,cw,v,'Стяжка задняя '+tg,mat,false,TK);
  Hor(wall,u+TK,u+w-TK,g-cw,g,v,'Стяжка передняя '+tg,mat,false,TK);
  if(ChetOn.Value) Chetvert(r1,true);
  return r1;
}

function Niz(wall,u,w,t,tg){
  var g=(GOvr>0)?GOvr:GNiz.Value, y1=Cok.Value;
  var bl=Bok(wall,u,0,g,y1,yN,'Бок.лев '+tg,MKor);
  var br=Bok(wall,u+w-TK,0,g,y1,yN,'Бок.прав '+tg,MKor);
  var dn=Hor(wall,u+TK,u+w-TK,0,g,y1,'Дно '+tg,MKor,false,TK);
  var zw=ChetOn.Value?ChetSh.Value:0;
  if(ChetOn.Value){ Chetvert(bl,false);Chetvert(br,false);Chetvert(dn,true); }
  if(CargaOn.Value) TopRails(wall,u,w,g,yN-TK,tg,MKor);
  else { var kr=Hor(wall,u+TK,u+w-TK,0,g,yN-TK,'Крыша '+tg,MKor,false,TK); if(ChetOn.Value) Chetvert(kr,true); }
  var zad=Fas(wall,u+TK-zw,u+w-TK+zw,y1+TK-zw,yN-TK+zw,0,'Зад.стенка '+tg,MZad,false,TZ);
  Reg(tg,bl,br,zad,null);
  var np=(t=='мойка')?MoyPol.Value:KolPol.Value;
  if(!IsDraw(tg)&&np>0) Polki(wall,u,w,g,y1+TK,yN-TK,tg,bl,br,np,0,'');
  Opory(dn,wall,u,w,g,bl,br);
  if(t=='угол'){
    if(LukOn.Value) Luk(br);
    if(UglFront.Value=='Глухая')
      Fas(wall,u+ZazF.Value,u+w-ZazF.Value,y1+ZazF.Value,yN-ZazF.Value,g,'Глухая панель '+tg,MFasN,true,TFN);
    else if(UglFront.Value=='Дверь') Facades(wall,u,w,y1,yN,g,MFasN,1,tg,true,false,bl,br);
  } else if(IsDraw(tg)) Yaschiki(wall,u,w,y1,yN,g,tg,0,MFasN,0,0,false);
  else Facades(wall,u,w,y1,yN,g,MFasN,(t=='мойка'?MoyDver.Value:1),tg,true,false,bl,br);
  return yN;
}

function Verh(wall,u,w,y1,h,tg,type,ductMode){
  var g=GVerh.Value,y2=y1+h,isV=(type=='вент');
  var wvD=(isV&&DuhAntrDno.Value)?WV():0;
  var wvK=(isV&&DuhAntrKrysha.Value)?WV():0;
  var pu1=u+TK,pu2=u+w-TK;
  var bl=Bok(wall,u,0,g,y1,y2,'Бок.лев '+tg,MKor);
  var br=Bok(wall,u+w-TK,0,g,y1,y2,'Бок.прав '+tg,MKor);
  var dn=Hor(wall,pu1,pu2,wvD,g,y1,'Дно '+tg,MKor,false,TK);
  var kr=Hor(wall,pu1,pu2,wvK,g,y2-TK,'Крыша '+tg,MKor,false,TK);
  var zw=ChetOn.Value?ChetSh.Value:0;
  if(ChetOn.Value){ Chetvert(bl,false);Chetvert(br,false);
    if(wvD==0) Chetvert(dn,true); if(wvK==0) Chetvert(kr,true); }
  var zad=null;
  if(!isV) zad=Fas(wall,u+TK-zw,u+w-TK+zw,y1+TK-zw,y2-TK+zw,0,'Зад.стенка '+tg,MZad,false,TZ);
  Reg(tg,bl,br,zad,null);
  if(ductMode=='антр') DuctCut(dn,pu1,pu2,wvD,g,'hood',false,'дно '+tg);
  if(ductMode=='низ') DuctCut(kr,pu1,pu2,wvK,g,'hood',false,'крыша '+tg);
  else if(ductMode=='антр') DuctCut(kr,pu1,pu2,wvK,g,'ceil',false,'крыша '+tg);
  if(type=='варочная'){
    var nw1=(DUCT&&DUCT.on)?DUCT.nw1:((g-VytD.Value)/2);
    CutHor(dn,(w-2*TK-VytW.Value)/2,nw1,VytW.Value,VytD.Value,'ВЫТЯЖКА в дне '+tg);
    var yh=y1+VytH.Value,d1=TZ+zw+1;
    var pk=Hor(wall,pu1,pu2,d1,g,yh,'Полка над вытяжкой '+tg,MKor,false,TK);
    if(ductMode=='низ') DuctCut(pk,pu1,pu2,d1,g,'hood',true,'полка над вытяжкой '+tg);
    if(KolPolA3.Value>0) Polki(wall,u,w,g,yh+TK,y2-TK,tg,bl,br,KolPolA3.Value,0,ductMode=='низ'?'hood':'');
    Facades(wall,u,w,yh+TK,y2,g,MFasV,1,tg,false,false,bl,br);
  } else {
    var isA=(String(tg).indexOf('Антресоль')===0);
    var np=isA?KolPol.Value:KolPolVerh.Value;
    var sb=isV?DuhGapBot.Value:0;
    var ax=(ductMode=='антр')?'union':(ductMode=='низ'?'hood':'');
    if(np>0) Polki(wall,u,w,g,y1+TK,y2-TK,tg,bl,br,np,sb,ax);
    Facades(wall,u,w,y1,y2,g,MFasV,1,tg,false,false,bl,br);
  }
}

function Penal(wall,u,w,t,tg){
  var g=GPen.Value,y1=Cok.Value,penTop=yVT;
  var back=(tg=='A2')?Srez.Value:0;
  var mSt=(t=='холод')?MBok:MKor;
  var hb=0,ht=0,z=ZazF.Value;
  if(t=='холод'){
    hb=yMid-HolStyk.Value; ht=hb+HolNiche.Value;
    if(ht+TK>penTop-60){ penTop=Math.min(HGarn.Value,ht+TK+200); W.push('Холодильник: пенал поднят до '+penTop); }
  }
  var isD=(t=='дух');
  var wvD=(isD&&DuhDnoVent.Value)?WV():0;
  var wvK=(isD&&DuhKryshaVent.Value)?WV():0;
  var bl=Bok(wall,u,0,g,y1,penTop,'Пенал бок.лев '+tg,mSt);
  var br=Bok(wall,u+w-TK,back,g,y1,penTop,'Пенал бок.прав '+tg,MBok);
  var dn=Hor(wall,u+TK,u+w-TK,wvD,g,y1,'Пенал дно '+tg,mSt,false,TK);
  var kr=Hor(wall,u+TK,u+w-TK,wvK,g,penTop-TK,'Пенал крыша '+tg,mSt,false,TK);
  Opory(dn,wall,u,w,g,bl,br);
  if(t=='холод'){
    var zad=Fas(wall,u+TK,u+w-TK,y1+TK,penTop-TK,0,'Пенал зад.стенка '+tg,MZad,false,TZ);
    Reg(tg,bl,br,zad,null);
    Hor(wall,u+TK,u+w-TK,TZ+1,g,hb-TK,'Полка под холод. '+tg,mSt,false,TK);
    Hor(wall,u+TK,u+w-TK,TZ+1,g,ht,'Полка над холод. '+tg,mSt,false,TK);
    var fh=hb-y1-2*z;
    if(fh>=HolYasMin.Value) Yaschiki(wall,u,w,y1,hb,g,tg+'н',1,MFasV,0,0,true);
    else if(fh>20) Fas(wall,u+z,u+w-z,y1+z,hb-z,g,'Планка под холод. '+tg,MFasV,false,TFV);
    if(HolFasady.Value){
      var f1=Fas(wall,u+z,u+w-z,hb+z,yMid-z/2,g,'Фасад морозильника '+tg,MFasV,false,TFV);
      Ruchka(f1,wall,u,w,hb,yMid,g+TFV,tg,false);
      var f2=Fas(wall,u+z,u+w-z,yMid+z/2,ht+TK-z,g,'Фасад холодильника '+tg,MFasV,false,TFV);
      Ruchka(f2,wall,u,w,yMid,ht+TK,g+TFV,tg,false);
    }
    if(HolPolVerh.Value>0) Polki(wall,u,w,g,ht+TK,penTop-TK,tg+'в',bl,br,HolPolVerh.Value,0,'');
    Facades(wall,u,w,ht+TK,penTop,g,MFasV,1,tg+'в',false,false,bl,br);
  } else {
    var shBot=yS-TK;
    var nBot=shBot-(DuhH.Value+DuhGapTop.Value),undBot=nBot-TK;
    var svTop=yS+SvchH.Value,svShTop=svTop+TK;
    var wBack=WV();
    Hor(wall,u+TK,u+w-TK,wBack,g,undBot,'Полка под духовкой '+tg,MKor,false,TK);
    Hor(wall,u+TK,u+w-TK,wBack,g,shBot,'Полка духовка-СВЧ '+tg,MKor,false,TK);
    Hor(wall,u+TK,u+w-TK,wBack,g,svTop,'Полка над СВЧ '+tg,MKor,false,TK);
    var zN=null,zV=null;
    if(DuhZad.Value=='Убрать'){
      zN=Fas(wall,u+TK,u+w-TK,y1+TK,undBot,0,'Зад.стенка низ '+tg,MZad,false,TZ);
      zV=Fas(wall,u+TK,u+w-TK,svShTop,penTop-TK,0,'Зад.стенка верх '+tg,MZad,false,TZ);
    } else {
      zV=Fas(wall,u+TK,u+w-TK,y1+TK,penTop-TK,0,'Пенал зад.стенка '+tg,MZad,false,TZ);
      if(DuhZad.Value=='Отверстия'){
        var hw=Math.min(w-2*TK-40,400),hh=DuhVentArea.Value*100/hw;
        CutFront(zV,(w-2*TK-hw)/2,(nBot+shBot)/2-(y1+TK)-hh/2,hw,hh,'перфорация зад.стенки '+tg);
      }
    }
    Reg(tg,bl,br,zV,zN);
    Yaschiki(wall,u,w,y1,nBot,g,tg+'н',1,MFasV,wBack,DuhGapBot.Value,false);
    if(KolPolA2.Value>0) Polki(wall,u,w,g,svShTop,penTop-TK,tg+'ср',bl,br,KolPolA2.Value,DuhGapBot.Value,'');
    Facades(wall,u,w,svShTop,penTop,g,MFasV,1,tg+'в',false,false,bl,br);
  }
  return penTop;
}

function Nisha(wall,u,w,tg){
  var g=GNiz.Value,o=PmmGap.Value,gg=g+o;
  var bl=Bok(wall,u,o,gg,Cok.Value,yN,'ПММ бок.лев '+tg,MKor);
  var br=Bok(wall,u+w-TK,o,gg,Cok.Value,yN,'ПММ бок.прав '+tg,MKor);
  if(CargaOn.Value) TopRails(wall,u,w,gg,yN-TK,tg,MKor);
  else Hor(wall,u+TK,u+w-TK,o,gg,yN-TK,'ПММ крыша '+tg,MKor,false,TK);
  Reg(tg,bl,br,null,null);
  var blk=null;
  if(AnimOn.Value){ try{ blk=BeginBlock('Дверца ПММ '+tg); }catch(e){} }
  var f=Fas(wall,u+ZazF.Value,u+w-ZazF.Value,Cok.Value+ZazF.Value,yN-ZazF.Value,gg,'Фасад ПММ '+tg,MFasN,true,TFN);
  Ramka(f);
  Ruchka(f,wall,u,w,Cok.Value,yN,gg+TFN,tg,false);
  if(blk){ try{ EndBlock(); }catch(e){} }
  if(blk) SetAnim(blk,[PmmAnim.Value,'DoorFlap','DoorRight']);
  return yN;
}

function Polki(wall,u,w,g,y1,y2,tg,bl,br,n,sb,ductAxis){
  var step=(y2-y1-n*TK)/(n+1),y=y1,zw=ChetOn.Value?ChetSh.Value:0,s=sb?sb:0;
  var d1=TZ+zw+1+s,d2=g-20;
  var pu1=u+TK+ZazPol.Value,pu2=u+w-TK-ZazPol.Value;
  for(var i=0;i<n;i++){
    y+=step;
    var p=Hor(wall,pu1,pu2,d1,d2,y,'Полка '+tg+'-'+(i+1),MKor,false,TK);
    if(ductAxis) DuctCut(p,pu1,pu2,d1,d2,ductAxis,true,'полка '+tg+'-'+(i+1));
    MountFurn(fPolk,'Полкодержатели',bl,p,wall,u+TK,y,40+s,0,AxisX,null);
    MountFurn(fPolk,'Полкодержатели',br,p,wall,u+w-TK,y,40+s,0,Axis_X,null);
    MountFurn(fPolk,'Полкодержатели',bl,p,wall,u+TK,y,g-60,0,AxisX,null);
    MountFurn(fPolk,'Полкодержатели',br,p,wall,u+w-TK,y,g-60,0,Axis_X,null);
    y+=TK;
  }
}

function Facades(wall,u,w,y1,y2,g,mat,n,tg,ram,isDraw,bl,br){
  var z=ZazF.Value,h=(y2-y1-z*(n+1))/n;
  if(h<=0){ W.push('Фасады '+tg+': мало высоты'); return; }
  var mdf=(mat==MFasN),tf=mdf?TFN:TFV,side=RuchSide(SecCode(tg));
  for(var i=0;i<n;i++){
    var yy=y1+z+i*(h+z),blk=null;
    if(AnimOn.Value){ try{ blk=BeginBlock('Дверь '+tg+'-'+(i+1)); }catch(e){} }
    var p=Fas(wall,u+z,u+w-z,yy,yy+h,g,'Фасад '+tg+'-'+(i+1),mat,mdf,tf);
    if(ram&&mdf) Ramka(p);
    Ruchka(p,wall,u,w,yy,yy+h,g+tf,tg,false);
    if(PetlVBlk.Value) Petli(wall,u,w,yy,h,g,p,bl,br,tg);
    if(blk){ try{ EndBlock(); }catch(e){} }
    if(!PetlVBlk.Value) Petli(wall,u,w,yy,h,g,p,bl,br,tg);
    if(blk) SetAnim(blk,(side=='R')?['DoorLeft']:['DoorRight']);
  }
}

function Yaschiki(wall,u,w,y1,y2,g,tg,nOver,mat,wStart,dRed,useKit2){
  var cb=CK(useKit2?'Ящики KPL550A':'Ящики');
  var f=useKit2?fNapr2:fNapr;
  var L=useKit2?NaprL2.Value:NaprL.Value;
  var BH=useKit2?YasH2.Value:YasH.Value;
  var n=nOver?nOver:KolYas.Value,m=mat?mat:MFasN;
  var mdf=(m==MFasN),tf=mdf?TFN:TFV,z=ZazF.Value,total=y2-y1-z*(n+1);
  if(total<=0){ W.push('Ящики '+tg+': мало высоты'); return; }
  var pr=SplitNum(YasProp.Value),hs=[],i,s=0;
  if(pr.length==n&&nOver===0){
    for(i=0;i<n;i++) s+=pr[i];
    for(i=0;i<n;i++) hs.push(total*pr[i]/s);
  } else for(i=0;i<n;i++) hs.push(total/n);
  var iw=w-2*TK,az=IsA(wall)?AxisZ:Axis_X,naBlk=(YasAnim.Value=='Блок');
  var ws=wStart?wStart:0,dr=dRed?dRed:0,yy=y1+z;
  for(i=0;i<n;i++){
    var h=hs[i],blk=null;
    if(AnimOn.Value&&naBlk){ try{ blk=BeginBlock('Ящик '+tg+'-'+(i+1)); }catch(e){} }
    var kit=null;
    if(!f) cb.skip++;
    else{
      try{
        kit=f.MountBox(G(wall,u+TK,yy,ws),NewVector(iw,Math.min(h,BH+60),L-dr),az,AxisY);
        if(kit){ cb.ok++; var k=(useKit2?'Ящики KPL550A':'Ящики')+' / MountBox'; MH[k]=(MH[k]||0)+1; }
        else { cb.nul++; note(useKit2?'Ящики KPL550A':'Ящики','MountBox','вернул пусто'); }
      }catch(e){ cb.err++; note(useKit2?'Ящики KPL550A':'Ящики','MountBox',e); }
    }
    var p=Fas(wall,u+z,u+w-z,yy,yy+h,g,'Фасад '+tg+'-'+(i+1),m,mdf,tf);
    if(mdf) Ramka(p);
    Ruchka(p,wall,u,w,yy,yy+h,g+tf,tg,true);
    if(blk){ try{ EndBlock(); }catch(e){} }
    if(blk) SetAnim(blk,['Box']);
    if(!naBlk&&kit){ try{ kit.AnimType=AnimationType.Box; AnimUsed['Box(комплект)']=(AnimUsed['Box(комплект)']||0)+1; }catch(e){} }
    yy+=h+z;
  }
  if(nOver===0&&pr.length==n)
    W.push('Ящики '+tg+': высоты снизу вверх '+Math.round(hs[0])+' / '+Math.round(hs[1])+' / '+Math.round(hs[2]));
}

function Petli(wall,u,w,yy,h,g,fasad,bl,br,tg){
  var c=CK('Петли'),n=2;
  if(h>900) n=3; if(h>1600) n=4; if(h>2000) n=5;
  if(!fPetl){ c.skip+=n; return; }
  var side=RuchSide(SecCode(tg)),bok=(side=='R')?bl:br,ub=(side=='R')?u+TK:u+w-TK;
  for(var i=0;i<n;i++){
    var v=(n==2)?(yy+(i==0?PetlOt.Value:h-PetlOt.Value)):(yy+PetlOt.Value+i*(h-2*PetlOt.Value)/(n-1));
    MountFurn(fPetl,'Петли',fasad,bok,wall,ub,v,g-PetlPl.Value,0,null,null);
  }
}
function Opory(dno,wall,u,w,g,bl,br){
  var pts=[[u+TK+40,60,bl],[u+w-TK-40,60,br],[u+TK+40,g-60,bl],[u+w-TK-40,g-60,br]];
  for(var i=0;i<pts.length;i++)
    MountFurn(fOpor,'Опоры',dno,pts[i][2],wall,pts[i][0],Cok.Value,pts[i][1],0,Axis_Y,Cok.Value+TK);
}
function Ruchka(p,wall,u,w,y1,y2,wf,tg,isDraw){
  var side=RuchSide(SecCode(tg)), uu, vv, ang;
  if(isDraw){ uu=u+w/2; vv=(y1+y2)/2; ang=(IsA(wall)?0:90); }
  else {
    uu=(side=='R')?(u+w-RuchOt.Value):(u+RuchOt.Value);
    vv=y2-RuchV.Value-RuchLen.Value/2;
    ang=(IsA(wall)?0:90)+90;
  }
  MountFurn(fRuch,'Ручки',p,null,wall,uu,vv,wf,ang,null,null);
}
function RuchSide(code){
  var a=SplitStr(RuchMap.Value);
  for(var i=0;i<a.length;i++){ var p=a[i].split(':'); if(p.length==2&&p[0]==code) return p[1].toUpperCase(); }
  return 'L';
}
function G(wall,u,v,w){ return IsA(wall)?NewVector(u,v,w):NewVector(XR-w,v,u); }

function Chetvert(p,isHor){
  try{
    var c=p.Contour,cut=p.AddCut('Четверть Тип 1');
    if(isHor) cut.Trajectory.AddLine(c.Min.x,c.Max.y,c.Max.x,c.Max.y);
    else cut.Trajectory.AddLine(c.Min.x,c.Min.y,c.Min.x,c.Max.y);
    cut.Contour.AddRectangle(0,0,ChetSh.Value,TZ);
    p.Build();
  }catch(e){ W.push('Четверть: '+NV(p,'Name')); }
}
function Luk(p){
  try{ var c=p.Contour,h=NewContour();
    h.AddRectangle(c.Min.x+LukU.Value,c.Min.y+LukV.Value-Cok.Value,
                   c.Min.x+LukU.Value+LukW.Value,c.Min.y+LukV.Value-Cok.Value+LukH.Value);
    var n0=ContCount(p),a0=AreaOf(p);
    try{ p.Contour.Subtraction(h); }catch(e){ p.Contour.Substraction(h); }
    p.Build();
    W.push('Люк A4: '+n0+'->'+ContCount(p)+' элем., снято '+Math.round(a0-AreaOf(p))+' мм2');
  }catch(e){ W.push('Люк A4 не сделан'); }
}

function Bok(wall,u,w1,w2,v1,v2,name,mat){
  mat.SetActive();
  var p=IsA(wall)?AddVertPanel(w1,v1,w2,v2,u):AddFrontPanel(XR-w2,v1,XR-w1,v2,u);
  Fin(p,name,false,[1,3],false,TK);
  ApplyObs(p,wall,'bok',name,u,w1,w2,v1,v2,TK);
  return p;
}
function Hor(wall,u1,u2,w1,w2,v,name,mat,all,t){
  mat.SetActive();
  var tt=(t>0)?t:ActiveMaterial.Thickness;
  var p=IsA(wall)?AddHorizPanel(u1,w1,u2,w2,v):AddHorizPanel(XR-w2,u1,XR-w1,u2,v);
  Fin(p,name,all,[1,2,3],false,t);
  ApplyObs(p,wall,'hor',name,u1,u2,w1,w2,v,tt);
  return p;
}
function Fas(wall,u1,u2,v1,v2,w,name,mat,mdf,t){
  mat.SetActive();
  var tt=(t>0)?t:ActiveMaterial.Thickness;
  var p=IsA(wall)?AddFrontPanel(u1,v1,u2,v2,w):AddVertPanel(u1,v1,u2,v2,XR-w-tt);
  Fin(p,name,true,[0,1,2,3],mdf,t);
  ApplyObs(p,wall,'fas',name,u1,u2,v1,v2,w,tt);
  return p;
}
function Fin(p,name,all,vis,mdf,t){
  p.Name=name;
  if(ForceT.Value&&t>0){ try{ p.Thickness=t; }catch(e){} }
  if(!(mdf===true&&!KromMDF.Value)){
    for(var i=0;i<4;i++){
      var v=all;
      if(!v) for(var j=0;j<vis.length;j++) if(vis[j]==i) v=true;
      var b=null;
      try{ b=p.AddButt(v?KrV:KrN,i); }catch(e){}
      if(b){ try{ b.Allowance=Prir.Value; b.ClipPanel=true; }catch(e){} }
    }
  }
  try{ p.Build(); }catch(e){}
  NP++; return p;
}
function Ramka(p){
  if(!RamOn.Value) return;
  try{ var c=p.Contour,o=RamOt.Value,cut=p.AddCut('Рамка');
    cut.Trajectory.AddRectangle(c.Min.x+o,c.Min.y+o,c.Max.x-o,c.Max.y-o);
    if(!cut.Contour.Load(Freza.Value)) W.push('Нет профиля '+Freza.Value);
    cut.Contour.Move(0,p.Thickness); p.Build();
  }catch(e){ W.push('Фрезеровка: '+e); }
}
function IsDraw(tg){ var a=SplitStr(DrawList.Value);
  for(var i=0;i<a.length;i++) if(a[i]==tg) return true; return false; }
function SplitNum(s){ var a=String(s).split(','),r=[];
  for(var i=0;i<a.length;i++){ var v=parseFloat(a[i]); if(!isNaN(v)) r.push(v); } return r; }
function SplitStr(s){ var a=String(s).split(','),r=[];
  for(var i=0;i<a.length;i++) r.push(a[i].replace(/^\s+|\s+$/g,'')); return r; }
function Tag(wall,i){ return wall+(i+1+((wall=='B')?BShift.Value:0)); }

function Report(){
  var kv='?',kn='?'; try{ kv=KrV.Thickness; kn=KrN.Thickness; }catch(e){}
  var s='Деталей: '+NP+'\nТолщины: корпус '+TK+', низ '+TFN+', верх/пенал '+TFV+', з/ст '+TZ+', стол '+TStol.Value+
    '\nКромка: видимая '+kv+', невидимая '+kn+', припуск '+Prir.Value+
    '\nГабарит: '+Math.round(Model.GSize.x)+' x '+Math.round(Model.GSize.y)+' x '+Math.round(Model.GSize.z)+
    '\n\nФУРНИТУРА (создано/пусто/ошибок/пропущено):';
  var any=false;
  for(var k in C){ any=true; s+='\n'+k+': '+C[k].ok+' / '+C[k].nul+' / '+C[k].err+' / '+C[k].skip; }
  if(!any) s+='\nничего не запрашивалось';
  s+='\n\nМЕТОДЫ УСТАНОВКИ:';
  var m2=false;
  for(var m in MH){ m2=true; s+='\n'+m+': '+MH[m]; }
  if(!m2) s+=' нет';
  var e2=false;
  for(var e in ERRS){ e2=true; }
  if(e2){ s+='\n\nОШИБКИ ПОПЫТОК (первая на метод):'; for(var e3 in ERRS) s+='\n'+e3+' -> '+ERRS[e3]; }
  s+='\n\nАНИМАЦИЯ:';
  var a2=false;
  for(var k2 in AnimUsed){ a2=true; s+='\n'+k2+': '+AnimUsed[k2]; }
  if(!a2) s+=' не применялась';
  if(W.length) s+='\n\nВНИМАНИЕ:\n- '+W.join('\n- ');
  alert(s);
}
function ExportCSV(){
  var rows=['Наименование;Артикул;X;Y;Z;Кромка'];
  function Rec(L){
    var n=NV(L,'Count'),arr=(typeof n==='number')?null:NV(L,'Objects');
    var t=(typeof n==='number')?n:(arr?arr.length:0);
    for(var i=0;i<t;i++){
      var o=arr?arr[i]:L[i]; if(!o) continue;
      if(NV(o,'List')) Rec(o);
      else{ var g=NV(o,'GSize'),bt=NV(o,'Butts'),nb=bt?NV(bt,'Count'):0;
        rows.push([NV(o,'Name'),NV(o,'ArtPos'),g?g.x:'',g?g.y:'',g?g.z:'',nb?nb+' торц.':'нет'].join(';')); }
    }
  }
  Rec(Model); system.askWriteTextFile('csv',rows.join('\n'));
}
function Check(){
  try{ var ins=NewModelInspector(),o=ins.Options;
    o.ObjIntersectionAnalyze=true; o.PanelTooLargeAnalyze=true;
    o.FastIntersectionAnalyze=true; o.FastIncorrectAnalyze=true; o.PanelNotFixedAnalyze=false;
    ins.Options=o; ins.Run(Model);
    var s='Ошибок: '+ins.ErrorList.Count;
    for(var i=0;i<ins.ErrorList.Count&&i<25;i++)
      s+='\n'+ins.ErrorList[i].ErrorMessage+' '+ins.ErrorList[i].ObjectsNames;
    alert(s);
  }catch(e){ alert('Инспектор: '+e); }
}