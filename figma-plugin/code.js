(async () => {
  // ─── Design tokens ───────────────────────────────────────────────────────────
  const C = {
    brand:      '#0057ff',
    green:      '#00a651',
    grey:       '#f5f5f5',
    greyMid:    '#e0e0e0',
    text:       '#1a1a1a',
    textMuted:  '#888888',
    white:      '#ffffff',
    overlay:    '#000000',
    red:        '#ff3b30',
    black:      '#000000',
  };

  const W = 390;
  const H = 844;
  const GAP = 60;

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16) / 255,
      g: parseInt(h.substring(2, 4), 16) / 255,
      b: parseInt(h.substring(4, 6), 16) / 255,
    };
  }

  function solidFill(hex, opacity) {
    const rgb = hexToRgb(hex);
    const fill = { type: 'SOLID', color: rgb };
    if (opacity !== undefined) fill.opacity = opacity;
    return [fill];
  }

  // Load fonts — fall back to Inter if Outfit is unavailable
  let fontLight, fontRegular, fontMedium, fontSemiBold, fontBold;
  try {
    await figma.loadFontAsync({ family: 'Outfit', style: 'Light' });
    await figma.loadFontAsync({ family: 'Outfit', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Outfit', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Outfit', style: 'SemiBold' });
    await figma.loadFontAsync({ family: 'Outfit', style: 'Bold' });
    fontLight    = { family: 'Outfit', style: 'Light' };
    fontRegular  = { family: 'Outfit', style: 'Regular' };
    fontMedium   = { family: 'Outfit', style: 'Medium' };
    fontSemiBold = { family: 'Outfit', style: 'SemiBold' };
    fontBold     = { family: 'Outfit', style: 'Bold' };
  } catch (_) {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    fontLight    = { family: 'Inter', style: 'Regular' };
    fontRegular  = { family: 'Inter', style: 'Regular' };
    fontMedium   = { family: 'Inter', style: 'Medium' };
    fontSemiBold = { family: 'Inter', style: 'Medium' };
    fontBold     = { family: 'Inter', style: 'Bold' };
  }

  function makeText(content, size, fontName, colorHex, opts) {
    const t = figma.createText();
    t.characters = content;
    t.fontSize = size;
    t.fontName = fontName;
    t.fills = solidFill(colorHex);
    if (opts) {
      if (opts.width)           t.resize(opts.width, t.height);
      if (opts.align)           t.textAlignHorizontal = opts.align;
      if (opts.lineHeight)      t.lineHeight = { value: opts.lineHeight, unit: 'PIXELS' };
      if (opts.letterSpacing)   t.letterSpacing = { value: opts.letterSpacing, unit: 'PIXELS' };
      if (opts.truncate)        t.textTruncation = 'ENDING';
      if (opts.wrap === false) {
        t.textAutoResize = 'WIDTH_AND_HEIGHT';
      } else {
        t.textAutoResize = 'HEIGHT';
      }
    }
    return t;
  }

  function makeAutoFrame(name, direction, opts) {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = direction || 'VERTICAL';
    f.primaryAxisSizingMode   = (opts && opts.primaryHug  === false) ? 'FIXED' : 'AUTO';
    f.counterAxisSizingMode   = (opts && opts.counterHug  === false) ? 'FIXED' : 'AUTO';
    f.itemSpacing             = (opts && opts.gap  !== undefined) ? opts.gap  : 0;
    f.paddingTop              = (opts && opts.pt   !== undefined) ? opts.pt   : 0;
    f.paddingBottom           = (opts && opts.pb   !== undefined) ? opts.pb   : 0;
    f.paddingLeft             = (opts && opts.pl   !== undefined) ? opts.pl   : 0;
    f.paddingRight            = (opts && opts.pr   !== undefined) ? opts.pr   : 0;
    f.cornerRadius            = (opts && opts.radius !== undefined) ? opts.radius : 0;
    f.clipsContent            = (opts && opts.clip !== undefined) ? opts.clip : false;
    f.fills = solidFill((opts && opts.bg) ? opts.bg : C.white);
    if (opts && opts.width)  { f.resize(opts.width, f.height || 10); }
    if (opts && opts.height) { f.resize(f.width || 10, opts.height); }
    return f;
  }

  function makeIconBtn(label, size) {
    const btn = makeAutoFrame('IconBtn', 'HORIZONTAL', {
      bg: 'transparent', pt: 0, pb: 0, pl: 0, pr: 0,
      counterHug: false, primaryHug: false,
    });
    btn.resize(size || 36, size || 36);
    btn.primaryAxisAlignItems = 'CENTER';
    btn.counterAxisAlignItems = 'CENTER';

    const t = makeText(label, 18, fontRegular, C.white);
    t.textAlignHorizontal = 'CENTER';
    btn.appendChild(t);
    return btn;
  }

  function makeCheckbox(checked) {
    const box = figma.createFrame();
    box.name = 'Checkbox';
    box.resize(22, 22);
    box.cornerRadius = 6;
    if (checked) {
      box.fills = solidFill(C.green);
    } else {
      box.fills = solidFill(C.white);
      box.strokes = [{ type: 'SOLID', color: hexToRgb(C.greyMid) }];
      box.strokeWeight = 2;
      box.strokeAlign = 'INSIDE';
    }
    if (checked) {
      const tick = makeText('✓', 13, fontBold, C.white);
      tick.x = 4;
      tick.y = 2;
      box.appendChild(tick);
    }
    return box;
  }

  function makeCountBadge(count) {
    const badge = makeAutoFrame('Badge', 'HORIZONTAL', {
      bg: C.brand, pt: 2, pb: 2, pl: 7, pr: 7, radius: 12,
    });
    const t = makeText(String(count), 11, fontBold, C.white);
    badge.appendChild(t);
    return badge;
  }

  function makeItemCard(item) {
    // item: { name, note, qty, checked }
    const card = makeAutoFrame('ItemCard', 'HORIZONTAL', {
      bg: C.white, pt: 12, pb: 12, pl: 16, pr: 12, gap: 12,
      radius: 12, primaryHug: false, counterHug: false,
    });
    card.primaryAxisAlignItems = 'CENTER';
    card.resize(W - 32, 10);
    card.primaryAxisSizingMode = 'FIXED';
    card.counterAxisSizingMode = 'AUTO';

    // shadow
    card.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.06 },
      offset: { x: 0, y: 2 },
      radius: 8,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }];

    const checkbox = makeCheckbox(item.checked || false);
    card.appendChild(checkbox);

    // text group
    const textGroup = makeAutoFrame('TextGroup', 'VERTICAL', {
      bg: 'transparent', gap: 2,
    });
    textGroup.layoutGrow = 1;

    const nameText = makeText(item.name, 15, fontMedium, item.checked ? C.textMuted : C.text);
    nameText.layoutGrow = 1;
    nameText.layoutAlign = 'STRETCH';
    textGroup.appendChild(nameText);

    if (item.note) {
      const noteText = makeText(item.note, 12, fontRegular, C.textMuted);
      noteText.layoutGrow = 1;
      noteText.layoutAlign = 'STRETCH';
      textGroup.appendChild(noteText);
    }

    card.appendChild(textGroup);

    // qty
    if (item.qty) {
      const qtyText = makeText(item.qty, 13, fontMedium, C.textMuted);
      card.appendChild(qtyText);
    }

    // trash
    const trash = makeText('🗑', 16, fontRegular, C.textMuted);
    card.appendChild(trash);

    return card;
  }

  function makeCategorySection(cat) {
    // cat: { emoji, name, count, items[] }
    const section = makeAutoFrame('Category_' + cat.name, 'VERTICAL', {
      bg: 'transparent', gap: 8,
    });

    // Header row
    const header = makeAutoFrame('CatHeader', 'HORIZONTAL', {
      bg: C.grey, pt: 10, pb: 10, pl: 14, pr: 14, gap: 10, radius: 12,
    });
    header.primaryAxisAlignItems = 'CENTER';
    header.resize(W - 32, 10);
    header.primaryAxisSizingMode = 'FIXED';
    header.counterAxisSizingMode = 'AUTO';

    const emojiText = makeText(cat.emoji, 18, fontRegular, C.text);
    header.appendChild(emojiText);

    const nameText = makeText(cat.name, 14, fontSemiBold, C.text);
    nameText.layoutGrow = 1;
    header.appendChild(nameText);

    const badge = makeCountBadge(cat.count);
    header.appendChild(badge);

    const chevron = makeText('›', 20, fontLight, C.textMuted);
    header.appendChild(chevron);

    section.appendChild(header);

    // Items
    for (const item of cat.items) {
      section.appendChild(makeItemCard(item));
    }

    return section;
  }

  function makeHeaderBar(screenFrame) {
    const header = makeAutoFrame('Header', 'HORIZONTAL', {
      bg: C.brand, pt: 52, pb: 16, pl: 20, pr: 20, gap: 12,
    });
    header.primaryAxisAlignItems = 'CENTER';
    header.resize(W, 10);
    header.primaryAxisSizingMode = 'FIXED';
    header.counterAxisSizingMode = 'AUTO';

    // Logo + title
    const logoRow = makeAutoFrame('LogoRow', 'HORIZONTAL', { bg: 'transparent', gap: 8 });
    logoRow.primaryAxisAlignItems = 'CENTER';
    logoRow.layoutGrow = 1;

    const logoEmoji = makeText('🛒', 22, fontRegular, C.white);
    logoRow.appendChild(logoEmoji);

    const title = makeText('Komisses', 20, fontBold, C.white);
    logoRow.appendChild(title);

    header.appendChild(logoRow);

    const shareBtn = makeIconBtn('⬆', 32);
    header.appendChild(shareBtn);

    const menuBtn = makeIconBtn('⋮', 32);
    header.appendChild(menuBtn);

    return header;
  }

  function makeFAB(parentFrame) {
    const fab = makeAutoFrame('FAB', 'HORIZONTAL', {
      bg: C.brand, pt: 0, pb: 0, pl: 0, pr: 0,
      radius: 28, primaryHug: false, counterHug: false,
    });
    fab.resize(56, 56);
    fab.primaryAxisAlignItems = 'CENTER';
    fab.counterAxisAlignItems = 'CENTER';

    fab.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0.34, b: 1, a: 0.35 },
      offset: { x: 0, y: 6 },
      radius: 16,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }];

    const plus = makeText('+', 28, fontLight, C.white);
    fab.appendChild(plus);

    fab.layoutPositioning = 'ABSOLUTE';
    parentFrame.appendChild(fab);
    fab.x = W - 56 - 20;
    fab.y = H - 56 - 32;

    return fab;
  }

  function makeOverlay(parentFrame) {
    const overlay = figma.createRectangle();
    overlay.name = 'Overlay';
    overlay.resize(W, H);
    overlay.fills = [{ type: 'SOLID', color: hexToRgb(C.black), opacity: 0.5 }];
    overlay.layoutPositioning = 'ABSOLUTE';
    parentFrame.appendChild(overlay);
    overlay.x = 0;
    overlay.y = 0;
    return overlay;
  }

  function makeBottomSheet(height, opts) {
    const sheet = makeAutoFrame('BottomSheet', 'VERTICAL', {
      bg: C.white, pt: 12, pb: (opts && opts.pb) || 32, pl: 20, pr: 20, gap: 16,
      radius: 0,
    });
    sheet.topLeftRadius = 24;
    sheet.topRightRadius = 24;
    sheet.bottomLeftRadius = 0;
    sheet.bottomRightRadius = 0;
    sheet.resize(W, height);
    sheet.primaryAxisSizingMode = 'FIXED';
    sheet.counterAxisSizingMode = 'FIXED';

    // drag handle
    const handle = figma.createRectangle();
    handle.name = 'Handle';
    handle.resize(40, 4);
    handle.cornerRadius = 2;
    handle.fills = solidFill(C.greyMid);
    handle.layoutAlign = 'CENTER';
    sheet.appendChild(handle);

    return sheet;
  }

  // ─── Screen frames ────────────────────────────────────────────────────────────

  const page = figma.currentPage;
  // Remove default content
  for (const n of [...page.children]) { n.remove(); }

  let screenIndex = 0;

  function newScreen(name) {
    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(W, H);
    frame.x = screenIndex * (W + GAP);
    frame.y = 0;
    frame.fills = solidFill(C.grey);
    frame.clipsContent = true;
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'FIXED';
    frame.counterAxisSizingMode = 'FIXED';
    page.appendChild(frame);
    screenIndex++;
    return frame;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 1 — Main List
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const frame = newScreen('01 – Main List');

    const header = makeHeaderBar(frame);
    frame.appendChild(header);

    // Scrollable content area
    const content = makeAutoFrame('Content', 'VERTICAL', {
      bg: C.grey, pt: 16, pb: 100, pl: 16, pr: 16, gap: 16,
    });
    content.layoutGrow = 1;
    content.layoutAlign = 'STRETCH';
    content.primaryAxisSizingMode = 'FIXED';
    content.counterAxisSizingMode = 'FIXED';
    content.resize(W, H - 120);

    // Category: Fruit & Groenten
    content.appendChild(makeCategorySection({
      emoji: '🍅',
      name: 'Fruit & Groenten',
      count: 2,
      items: [
        { name: 'Appels', qty: '×6', checked: true },
        { name: 'Bananen', note: 'rijp', qty: '×1', checked: false },
      ],
    }));

    // Category: Zuivel
    content.appendChild(makeCategorySection({
      emoji: '🧀',
      name: 'Zuivel',
      count: 1,
      items: [
        { name: 'Melk', qty: '2l', checked: false },
      ],
    }));

    // Category: Brood & gebak
    content.appendChild(makeCategorySection({
      emoji: '🍞',
      name: 'Brood & gebak',
      count: 1,
      items: [
        { name: 'Volkoren brood', qty: '×1', checked: false },
      ],
    }));

    frame.appendChild(content);

    makeFAB(frame);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2 — Empty State
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const frame = newScreen('02 – Empty State');

    const header = makeHeaderBar(frame);
    frame.appendChild(header);

    // Centered empty state
    const emptyArea = makeAutoFrame('EmptyArea', 'VERTICAL', {
      bg: C.grey, pt: 0, pb: 0, pl: 40, pr: 40, gap: 12,
    });
    emptyArea.layoutGrow = 1;
    emptyArea.layoutAlign = 'STRETCH';
    emptyArea.primaryAxisAlignItems = 'CENTER';
    emptyArea.counterAxisAlignItems = 'CENTER';
    emptyArea.primaryAxisSizingMode = 'FIXED';
    emptyArea.counterAxisSizingMode = 'FIXED';
    emptyArea.resize(W, H - 120);

    const cartEmoji = makeText('🛒', 54, fontRegular, C.textMuted);
    cartEmoji.textAlignHorizontal = 'CENTER';
    emptyArea.appendChild(cartEmoji);

    const emptyTitle = makeText('Lijst is leeg', 18, fontBold, C.text, { align: 'CENTER' });
    emptyArea.appendChild(emptyTitle);

    const emptySubtitle = makeText(
      'Voeg producten toe via de plus knop.',
      14, fontRegular, C.textMuted,
      { align: 'CENTER', width: W - 80 }
    );
    emptySubtitle.textAlignHorizontal = 'CENTER';
    emptyArea.appendChild(emptySubtitle);

    frame.appendChild(emptyArea);

    makeFAB(frame);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 3 — Browse
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const frame = newScreen('03 – Browse');

    // Header (same brand bar)
    const header = makeHeaderBar(frame);
    frame.appendChild(header);

    // Tab bar
    const tabBar = makeAutoFrame('TabBar', 'HORIZONTAL', {
      bg: C.white, pt: 0, pb: 0, pl: 0, pr: 0, gap: 0,
    });
    tabBar.layoutAlign = 'STRETCH';
    tabBar.resize(W, 48);
    tabBar.primaryAxisSizingMode = 'FIXED';
    tabBar.counterAxisSizingMode = 'FIXED';

    const tabMijnLijst = makeAutoFrame('Tab_MijnLijst', 'VERTICAL', {
      bg: C.white, pt: 0, pb: 0,
    });
    tabMijnLijst.layoutGrow = 1;
    tabMijnLijst.primaryAxisSizingMode = 'FIXED';
    tabMijnLijst.counterAxisSizingMode = 'FIXED';
    tabMijnLijst.resize(195, 48);
    tabMijnLijst.primaryAxisAlignItems = 'CENTER';
    tabMijnLijst.counterAxisAlignItems = 'CENTER';

    const tabMijnLijstText = makeText('Mijn lijst', 14, fontMedium, C.textMuted, { align: 'CENTER' });
    tabMijnLijst.appendChild(tabMijnLijstText);

    // bottom border inactive
    const borderInactive = figma.createRectangle();
    borderInactive.name = 'TabBorder';
    borderInactive.resize(195, 2);
    borderInactive.fills = solidFill(C.greyMid);
    borderInactive.layoutPositioning = 'ABSOLUTE';
    tabMijnLijst.appendChild(borderInactive);
    borderInactive.x = 0;
    borderInactive.y = 46;

    tabBar.appendChild(tabMijnLijst);

    const tabBladeren = makeAutoFrame('Tab_Bladeren', 'VERTICAL', {
      bg: C.white, pt: 0, pb: 0,
    });
    tabBladeren.layoutGrow = 1;
    tabBladeren.primaryAxisSizingMode = 'FIXED';
    tabBladeren.counterAxisSizingMode = 'FIXED';
    tabBladeren.resize(195, 48);
    tabBladeren.primaryAxisAlignItems = 'CENTER';
    tabBladeren.counterAxisAlignItems = 'CENTER';

    const tabBladText = makeText('Bladeren', 14, fontSemiBold, C.brand, { align: 'CENTER' });
    tabBladeren.appendChild(tabBladText);

    // bottom border active
    const borderActive = figma.createRectangle();
    borderActive.name = 'TabBorderActive';
    borderActive.resize(195, 2);
    borderActive.fills = solidFill(C.brand);
    borderActive.layoutPositioning = 'ABSOLUTE';
    tabBladeren.appendChild(borderActive);
    borderActive.x = 0;
    borderActive.y = 46;

    tabBar.appendChild(tabBladeren);

    frame.appendChild(tabBar);

    // Category grid
    const grid = makeAutoFrame('CategoryGrid', 'VERTICAL', {
      bg: C.grey, pt: 16, pb: 24, pl: 16, pr: 16, gap: 12,
    });
    grid.layoutGrow = 1;
    grid.layoutAlign = 'STRETCH';
    grid.primaryAxisSizingMode = 'FIXED';
    grid.counterAxisSizingMode = 'FIXED';
    grid.resize(W, H - 168);

    const allCategories = [
      { emoji: '🍺', name: 'Dranken' },
      { emoji: '🍞', name: 'Brood & gebak' },
      { emoji: '🧊', name: 'Gereed- en diepvriesproducten' },
      { emoji: '🍅', name: 'Fruit & Groenten' },
      { emoji: '🌾', name: 'Graanproducten' },
      { emoji: '🧹', name: 'Huishouden' },
      { emoji: '🧴', name: 'Verzorging & Gezondheid' },
      { emoji: '🫙', name: 'Ingrediënten & Kruiden' },
      { emoji: '🥩', name: 'Vlees & Vis' },
      { emoji: '🧀', name: 'Zuivel' },
      { emoji: '🐾', name: 'Dierenvoeding' },
      { emoji: '🍫', name: 'Snacks & Snoep' },
    ];

    // Pair categories into rows of 2
    for (let i = 0; i < allCategories.length; i += 2) {
      const row = makeAutoFrame('CatRow', 'HORIZONTAL', {
        bg: 'transparent', gap: 12,
      });
      row.primaryAxisSizingMode = 'FIXED';
      row.counterAxisSizingMode = 'AUTO';
      row.resize(W - 32, 10);

      for (let j = i; j < Math.min(i + 2, allCategories.length); j++) {
        const cat = allCategories[j];
        const cardW = (W - 32 - 12) / 2;

        const card = makeAutoFrame('CatCard_' + cat.name, 'VERTICAL', {
          bg: C.white, pt: 16, pb: 16, pl: 16, pr: 16, gap: 8, radius: 16,
          primaryHug: false,
        });
        card.counterAxisAlignItems = 'MIN';
        card.primaryAxisSizingMode = 'AUTO';
        card.counterAxisSizingMode = 'FIXED';
        card.resize(cardW, 10);

        card.effects = [{
          type: 'DROP_SHADOW',
          color: { r: 0, g: 0, b: 0, a: 0.06 },
          offset: { x: 0, y: 2 },
          radius: 8,
          spread: 0,
          visible: true,
          blendMode: 'NORMAL',
        }];

        const emojiT = makeText(cat.emoji, 32, fontRegular, C.text);
        card.appendChild(emojiT);

        const nameT = makeText(cat.name, 13, fontSemiBold, C.text, { width: cardW - 32 });
        card.appendChild(nameT);

        row.appendChild(card);
      }

      grid.appendChild(row);
    }

    frame.appendChild(grid);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 4 — FAB Search (bottom sheet)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const frame = newScreen('04 – FAB Search');
    frame.layoutMode = 'NONE'; // absolute for layering

    // Background: recreate main list (simplified)
    const bg = figma.createFrame();
    bg.name = 'BG_MainList';
    bg.resize(W, H);
    bg.fills = solidFill(C.grey);
    bg.x = 0; bg.y = 0;
    frame.appendChild(bg);

    // Header on bg
    const bgHeader = makeAutoFrame('Header', 'HORIZONTAL', {
      bg: C.brand, pt: 52, pb: 16, pl: 20, pr: 20, gap: 12,
    });
    bgHeader.primaryAxisAlignItems = 'CENTER';
    bgHeader.resize(W, 10);
    bgHeader.primaryAxisSizingMode = 'FIXED';
    bgHeader.counterAxisSizingMode = 'AUTO';
    const lrBg = makeAutoFrame('LogoRow', 'HORIZONTAL', { bg: 'transparent', gap: 8 });
    lrBg.layoutGrow = 1;
    lrBg.primaryAxisAlignItems = 'CENTER';
    lrBg.appendChild(makeText('🛒', 22, fontRegular, C.white));
    lrBg.appendChild(makeText('Komisses', 20, fontBold, C.white));
    bgHeader.appendChild(lrBg);
    bgHeader.appendChild(makeIconBtn('⬆', 32));
    bgHeader.appendChild(makeIconBtn('⋮', 32));
    bg.appendChild(bgHeader);

    // Overlay
    const overlay = figma.createRectangle();
    overlay.name = 'Overlay';
    overlay.resize(W, H);
    overlay.fills = [{ type: 'SOLID', color: hexToRgb(C.black), opacity: 0.5 }];
    frame.appendChild(overlay);
    overlay.x = 0; overlay.y = 0;

    // Bottom sheet
    const sheetH = 480;
    const sheet = makeAutoFrame('SearchSheet', 'VERTICAL', {
      bg: C.white, pt: 12, pb: 24, pl: 20, pr: 20, gap: 12,
    });
    sheet.topLeftRadius = 24;
    sheet.topRightRadius = 24;
    sheet.resize(W, sheetH);
    sheet.primaryAxisSizingMode = 'FIXED';
    sheet.counterAxisSizingMode = 'FIXED';
    frame.appendChild(sheet);
    sheet.x = 0;
    sheet.y = H - sheetH;

    // Handle
    const handle = figma.createRectangle();
    handle.name = 'Handle';
    handle.resize(40, 4);
    handle.cornerRadius = 2;
    handle.fills = solidFill(C.greyMid);
    handle.layoutAlign = 'CENTER';
    sheet.appendChild(handle);

    // Search input row
    const searchRow = makeAutoFrame('SearchRow', 'HORIZONTAL', {
      bg: C.grey, pt: 12, pb: 12, pl: 14, pr: 14, gap: 10, radius: 14,
    });
    searchRow.primaryAxisAlignItems = 'CENTER';
    searchRow.resize(W - 40, 10);
    searchRow.primaryAxisSizingMode = 'FIXED';
    searchRow.counterAxisSizingMode = 'AUTO';

    const searchIcon = makeText('🔍', 16, fontRegular, C.textMuted);
    searchRow.appendChild(searchIcon);

    const searchPlaceholder = makeText('Zoek of typ een product...', 15, fontRegular, C.textMuted);
    searchPlaceholder.layoutGrow = 1;
    searchRow.appendChild(searchPlaceholder);

    const clearBtn = makeAutoFrame('ClearBtn', 'HORIZONTAL', {
      bg: C.greyMid, pt: 0, pb: 0, pl: 0, pr: 0, radius: 10,
    });
    clearBtn.resize(20, 20);
    clearBtn.primaryAxisAlignItems = 'CENTER';
    clearBtn.counterAxisAlignItems = 'CENTER';
    const xMark = makeText('×', 14, fontBold, C.textMuted);
    clearBtn.appendChild(xMark);
    searchRow.appendChild(clearBtn);

    sheet.appendChild(searchRow);

    // Results label
    const resultsLabel = makeText('Resultaten', 13, fontSemiBold, C.textMuted);
    sheet.appendChild(resultsLabel);

    // Search results
    const results = [
      { name: 'Bananen', cat: 'Fruit & Groenten', emoji: '🍅' },
      { name: 'Blauwe bessen', cat: 'Fruit & Groenten', emoji: '🍅' },
      { name: 'Boter', cat: 'Zuivel', emoji: '🧀' },
      { name: 'Brood', cat: 'Brood & gebak', emoji: '🍞' },
      { name: 'Bier', cat: 'Dranken', emoji: '🍺' },
      { name: 'Biologische melk', cat: 'Zuivel', emoji: '🧀' },
    ];

    for (const r of results) {
      const resultRow = makeAutoFrame('Result_' + r.name, 'HORIZONTAL', {
        bg: C.white, pt: 12, pb: 12, pl: 0, pr: 0, gap: 12,
      });
      resultRow.primaryAxisAlignItems = 'CENTER';
      resultRow.resize(W - 40, 10);
      resultRow.primaryAxisSizingMode = 'FIXED';
      resultRow.counterAxisSizingMode = 'AUTO';

      // Bottom border
      const divider = figma.createRectangle();
      divider.name = 'Divider';
      divider.resize(W - 40, 1);
      divider.fills = solidFill(C.grey);
      divider.layoutPositioning = 'ABSOLUTE';
      resultRow.appendChild(divider);
      divider.x = 0;
      divider.y = resultRow.height - 1;

      const productName = makeText(r.name, 15, fontMedium, C.text);
      productName.layoutGrow = 1;
      resultRow.appendChild(productName);

      // Category tag
      const tag = makeAutoFrame('CatTag', 'HORIZONTAL', {
        bg: C.grey, pt: 4, pb: 4, pl: 8, pr: 8, gap: 4, radius: 8,
      });
      tag.primaryAxisAlignItems = 'CENTER';
      const tagEmoji = makeText(r.emoji, 11, fontRegular, C.text);
      tag.appendChild(tagEmoji);
      const tagName = makeText(r.cat, 11, fontRegular, C.textMuted);
      tag.appendChild(tagName);
      resultRow.appendChild(tag);

      sheet.appendChild(resultRow);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 5 — New List Modal
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const frame = newScreen('05 – New List Modal');
    frame.layoutMode = 'NONE';

    // White full bg
    const bg = figma.createRectangle();
    bg.name = 'BG';
    bg.resize(W, H);
    bg.fills = solidFill(C.white);
    frame.appendChild(bg);

    // Modal card
    const modal = makeAutoFrame('Modal', 'VERTICAL', {
      bg: C.white, pt: 36, pb: 36, pl: 28, pr: 28, gap: 20, radius: 20,
    });
    modal.counterAxisAlignItems = 'CENTER';
    modal.primaryAxisSizingMode = 'AUTO';
    modal.counterAxisSizingMode = 'FIXED';
    modal.resize(W - 48, 10);

    modal.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.12 },
      offset: { x: 0, y: 8 },
      radius: 32,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }];

    const cartIcon = makeText('🛒', 48, fontRegular, C.brand, { align: 'CENTER' });
    modal.appendChild(cartIcon);

    const modalTitle = makeText('Komisses', 22, fontBold, C.text, { align: 'CENTER' });
    modal.appendChild(modalTitle);

    const modalDesc = makeText(
      'Maak een nieuwe boodschappenlijst of verbind met een gedeelde lijst van iemand anders.',
      14, fontRegular, C.textMuted,
      { align: 'CENTER', width: W - 48 - 56 }
    );
    modalDesc.textAlignHorizontal = 'CENTER';
    modal.appendChild(modalDesc);

    // Primary button
    const primaryBtn = makeAutoFrame('PrimaryBtn', 'HORIZONTAL', {
      bg: C.brand, pt: 16, pb: 16, pl: 20, pr: 20, radius: 14,
    });
    primaryBtn.primaryAxisAlignItems = 'CENTER';
    primaryBtn.counterAxisAlignItems = 'CENTER';
    primaryBtn.primaryAxisSizingMode = 'FIXED';
    primaryBtn.counterAxisSizingMode = 'AUTO';
    primaryBtn.resize(W - 48 - 56, 10);
    primaryBtn.appendChild(makeText('Nieuwe lijst aanmaken', 15, fontSemiBold, C.white, { align: 'CENTER' }));
    modal.appendChild(primaryBtn);

    // Divider row
    const divRow = makeAutoFrame('DividerRow', 'HORIZONTAL', {
      bg: 'transparent', gap: 12,
    });
    divRow.primaryAxisAlignItems = 'CENTER';
    divRow.resize(W - 48 - 56, 10);
    divRow.primaryAxisSizingMode = 'FIXED';
    divRow.counterAxisSizingMode = 'AUTO';

    const divLeft = figma.createRectangle();
    divLeft.resize(80, 1);
    divLeft.fills = solidFill(C.greyMid);
    divLeft.layoutGrow = 1;
    divRow.appendChild(divLeft);

    const ofText = makeText('of', 13, fontRegular, C.textMuted);
    divRow.appendChild(ofText);

    const divRight = figma.createRectangle();
    divRight.resize(80, 1);
    divRight.fills = solidFill(C.greyMid);
    divRight.layoutGrow = 1;
    divRow.appendChild(divRight);

    modal.appendChild(divRow);

    // Secondary button
    const secBtn = makeAutoFrame('SecondaryBtn', 'HORIZONTAL', {
      bg: C.grey, pt: 16, pb: 16, pl: 20, pr: 20, radius: 14,
    });
    secBtn.primaryAxisAlignItems = 'CENTER';
    secBtn.counterAxisAlignItems = 'CENTER';
    secBtn.primaryAxisSizingMode = 'FIXED';
    secBtn.counterAxisSizingMode = 'AUTO';
    secBtn.resize(W - 48 - 56, 10);
    secBtn.strokes = [{ type: 'SOLID', color: hexToRgb(C.greyMid) }];
    secBtn.strokeWeight = 1;
    secBtn.strokeAlign = 'INSIDE';
    secBtn.appendChild(makeText('Verbinden met gedeelde lijst', 15, fontSemiBold, C.text, { align: 'CENTER' }));
    modal.appendChild(secBtn);

    // Center modal vertically
    frame.appendChild(modal);
    modal.x = 24;
    modal.y = (H - modal.height) / 2;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 6 — Share Modal
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const frame = newScreen('06 – Share Modal');
    frame.layoutMode = 'NONE';

    // Background main list
    const bgList = figma.createFrame();
    bgList.name = 'BG_List';
    bgList.resize(W, H);
    bgList.fills = solidFill(C.grey);
    bgList.x = 0; bgList.y = 0;
    frame.appendChild(bgList);

    const bgH2 = makeAutoFrame('Header', 'HORIZONTAL', {
      bg: C.brand, pt: 52, pb: 16, pl: 20, pr: 20, gap: 12,
    });
    bgH2.primaryAxisAlignItems = 'CENTER';
    bgH2.resize(W, 10);
    bgH2.primaryAxisSizingMode = 'FIXED';
    bgH2.counterAxisSizingMode = 'AUTO';
    const lrS = makeAutoFrame('LR', 'HORIZONTAL', { bg: 'transparent', gap: 8 });
    lrS.layoutGrow = 1;
    lrS.primaryAxisAlignItems = 'CENTER';
    lrS.appendChild(makeText('🛒', 22, fontRegular, C.white));
    lrS.appendChild(makeText('Komisses', 20, fontBold, C.white));
    bgH2.appendChild(lrS);
    bgH2.appendChild(makeIconBtn('⬆', 32));
    bgH2.appendChild(makeIconBtn('⋮', 32));
    bgList.appendChild(bgH2);

    // Overlay
    const ov2 = figma.createRectangle();
    ov2.name = 'Overlay';
    ov2.resize(W, H);
    ov2.fills = [{ type: 'SOLID', color: hexToRgb(C.black), opacity: 0.5 }];
    frame.appendChild(ov2);
    ov2.x = 0; ov2.y = 0;

    // Bottom sheet
    const sheetH = 360;
    const sheet = makeAutoFrame('ShareSheet', 'VERTICAL', {
      bg: C.white, pt: 12, pb: 32, pl: 20, pr: 20, gap: 16,
    });
    sheet.topLeftRadius = 24;
    sheet.topRightRadius = 24;
    sheet.resize(W, sheetH);
    sheet.primaryAxisSizingMode = 'FIXED';
    sheet.counterAxisSizingMode = 'FIXED';
    frame.appendChild(sheet);
    sheet.x = 0;
    sheet.y = H - sheetH;

    // Handle
    const h6 = figma.createRectangle();
    h6.resize(40, 4);
    h6.cornerRadius = 2;
    h6.fills = solidFill(C.greyMid);
    h6.layoutAlign = 'CENTER';
    sheet.appendChild(h6);

    sheet.appendChild(makeText(' Lijst delen', 18, fontBold, C.text));
    sheet.appendChild(makeText('Deel jouw boodschappenlijst met anderen.', 14, fontRegular, C.textMuted));

    // Link box
    const linkBox = makeAutoFrame('LinkBox', 'HORIZONTAL', {
      bg: C.grey, pt: 14, pb: 14, pl: 14, pr: 14, gap: 8, radius: 12,
    });
    linkBox.primaryAxisAlignItems = 'CENTER';
    linkBox.resize(W - 40, 10);
    linkBox.primaryAxisSizingMode = 'FIXED';
    linkBox.counterAxisSizingMode = 'AUTO';
    linkBox.strokes = [{ type: 'SOLID', color: hexToRgb(C.greyMid) }];
    linkBox.strokeWeight = 1;
    linkBox.strokeAlign = 'INSIDE';

    // monospace-style link text
    const linkText = makeText('komisses.app/join/xK9mP2', 13, fontRegular, C.brand);
    linkText.layoutGrow = 1;
    linkBox.appendChild(linkText);

    sheet.appendChild(linkBox);

    // Share buttons
    const copyBtn = makeAutoFrame('CopyBtn', 'HORIZONTAL', {
      bg: C.brand, pt: 16, pb: 16, pl: 20, pr: 20, gap: 10, radius: 14,
    });
    copyBtn.primaryAxisAlignItems = 'CENTER';
    copyBtn.counterAxisAlignItems = 'CENTER';
    copyBtn.resize(W - 40, 10);
    copyBtn.primaryAxisSizingMode = 'FIXED';
    copyBtn.counterAxisSizingMode = 'AUTO';
    copyBtn.appendChild(makeText('🔗  Link kopiëren', 15, fontSemiBold, C.white));
    sheet.appendChild(copyBtn);

    const shareBtn2 = makeAutoFrame('ShareBtn', 'HORIZONTAL', {
      bg: C.grey, pt: 16, pb: 16, pl: 20, pr: 20, gap: 10, radius: 14,
    });
    shareBtn2.primaryAxisAlignItems = 'CENTER';
    shareBtn2.counterAxisAlignItems = 'CENTER';
    shareBtn2.resize(W - 40, 10);
    shareBtn2.primaryAxisSizingMode = 'FIXED';
    shareBtn2.counterAxisSizingMode = 'AUTO';
    shareBtn2.strokes = [{ type: 'SOLID', color: hexToRgb(C.greyMid) }];
    shareBtn2.strokeWeight = 1;
    shareBtn2.strokeAlign = 'INSIDE';
    shareBtn2.appendChild(makeText('📱  Delen via...', 15, fontSemiBold, C.text));
    sheet.appendChild(shareBtn2);

    // Cancel text button
    const cancelText = makeText('Annuleren', 15, fontMedium, C.textMuted, { align: 'CENTER', width: W - 40 });
    cancelText.textAlignHorizontal = 'CENTER';
    sheet.appendChild(cancelText);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 7 — Product Detail Modal
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const frame = newScreen('07 – Product Detail');
    frame.layoutMode = 'NONE';

    // BG
    const bgPD = figma.createFrame();
    bgPD.name = 'BG_List';
    bgPD.resize(W, H);
    bgPD.fills = solidFill(C.grey);
    bgPD.x = 0; bgPD.y = 0;
    frame.appendChild(bgPD);

    const bgH3 = makeAutoFrame('Header', 'HORIZONTAL', {
      bg: C.brand, pt: 52, pb: 16, pl: 20, pr: 20, gap: 12,
    });
    bgH3.primaryAxisAlignItems = 'CENTER';
    bgH3.resize(W, 10);
    bgH3.primaryAxisSizingMode = 'FIXED';
    bgH3.counterAxisSizingMode = 'AUTO';
    const lrP = makeAutoFrame('LR', 'HORIZONTAL', { bg: 'transparent', gap: 8 });
    lrP.layoutGrow = 1;
    lrP.primaryAxisAlignItems = 'CENTER';
    lrP.appendChild(makeText('🛒', 22, fontRegular, C.white));
    lrP.appendChild(makeText('Komisses', 20, fontBold, C.white));
    bgH3.appendChild(lrP);
    bgH3.appendChild(makeIconBtn('⬆', 32));
    bgH3.appendChild(makeIconBtn('⋮', 32));
    bgPD.appendChild(bgH3);

    // Overlay
    const ov3 = figma.createRectangle();
    ov3.name = 'Overlay';
    ov3.resize(W, H);
    ov3.fills = [{ type: 'SOLID', color: hexToRgb(C.black), opacity: 0.5 }];
    frame.appendChild(ov3);
    ov3.x = 0; ov3.y = 0;

    // Bottom sheet
    const sheetH = 440;
    const sheet = makeAutoFrame('ProductSheet', 'VERTICAL', {
      bg: C.white, pt: 12, pb: 32, pl: 20, pr: 20, gap: 20,
    });
    sheet.topLeftRadius = 24;
    sheet.topRightRadius = 24;
    sheet.resize(W, sheetH);
    sheet.primaryAxisSizingMode = 'FIXED';
    sheet.counterAxisSizingMode = 'FIXED';
    frame.appendChild(sheet);
    sheet.x = 0;
    sheet.y = H - sheetH;

    // Handle
    const h7 = figma.createRectangle();
    h7.resize(40, 4);
    h7.cornerRadius = 2;
    h7.fills = solidFill(C.greyMid);
    h7.layoutAlign = 'CENTER';
    sheet.appendChild(h7);

    sheet.appendChild(makeText('Bananen', 20, fontBold, C.text));

    // Qty stepper
    const stepperSection = makeAutoFrame('StepperSection', 'VERTICAL', {
      bg: 'transparent', gap: 10,
    });

    const stepperLabel = makeText('Hoeveelheid', 13, fontSemiBold, C.text);
    stepperSection.appendChild(stepperLabel);

    // Stepper row
    const stepperRow = makeAutoFrame('StepperRow', 'HORIZONTAL', {
      bg: 'transparent', gap: 12,
    });
    stepperRow.primaryAxisAlignItems = 'CENTER';

    // Minus button
    const minusBtn = makeAutoFrame('MinusBtn', 'HORIZONTAL', {
      bg: C.grey, radius: 12,
    });
    minusBtn.resize(44, 44);
    minusBtn.primaryAxisAlignItems = 'CENTER';
    minusBtn.counterAxisAlignItems = 'CENTER';
    minusBtn.primaryAxisSizingMode = 'FIXED';
    minusBtn.counterAxisSizingMode = 'FIXED';
    minusBtn.appendChild(makeText('−', 20, fontMedium, C.text));
    stepperRow.appendChild(minusBtn);

    // Count display
    const countDisplay = makeAutoFrame('CountDisplay', 'HORIZONTAL', {
      bg: C.grey, pt: 0, pb: 0, pl: 20, pr: 20, radius: 12,
    });
    countDisplay.primaryAxisAlignItems = 'CENTER';
    countDisplay.counterAxisAlignItems = 'CENTER';
    countDisplay.resize(80, 44);
    countDisplay.primaryAxisSizingMode = 'FIXED';
    countDisplay.counterAxisSizingMode = 'FIXED';
    countDisplay.appendChild(makeText('1', 18, fontSemiBold, C.text, { align: 'CENTER' }));
    stepperRow.appendChild(countDisplay);

    // Plus button
    const plusBtn = makeAutoFrame('PlusBtn', 'HORIZONTAL', {
      bg: C.brand, radius: 12,
    });
    plusBtn.resize(44, 44);
    plusBtn.primaryAxisAlignItems = 'CENTER';
    plusBtn.counterAxisAlignItems = 'CENTER';
    plusBtn.primaryAxisSizingMode = 'FIXED';
    plusBtn.counterAxisSizingMode = 'FIXED';
    plusBtn.appendChild(makeText('+', 20, fontMedium, C.white));
    stepperRow.appendChild(plusBtn);

    stepperSection.appendChild(stepperRow);

    // Unit buttons row
    const unitRow = makeAutoFrame('UnitRow', 'HORIZONTAL', {
      bg: 'transparent', gap: 8,
    });
    const units = ['×', 'kg', 'g', 'l'];
    const activeUnit = '×';
    for (const u of units) {
      const unitBtn = makeAutoFrame('Unit_' + u, 'HORIZONTAL', {
        bg: u === activeUnit ? C.brand : C.grey,
        pt: 8, pb: 8, pl: 14, pr: 14, radius: 10,
      });
      unitBtn.appendChild(makeText(u, 13, fontSemiBold, u === activeUnit ? C.white : C.textMuted, { align: 'CENTER' }));
      unitRow.appendChild(unitBtn);
    }
    stepperSection.appendChild(unitRow);
    sheet.appendChild(stepperSection);

    // Note textarea
    const noteSection = makeAutoFrame('NoteSection', 'VERTICAL', {
      bg: 'transparent', gap: 8,
    });
    noteSection.appendChild(makeText('Notitie', 13, fontSemiBold, C.text));

    const textarea = makeAutoFrame('Textarea', 'VERTICAL', {
      bg: C.grey, pt: 14, pb: 14, pl: 14, pr: 14, radius: 12,
    });
    textarea.resize(W - 40, 10);
    textarea.primaryAxisSizingMode = 'FIXED';
    textarea.counterAxisSizingMode = 'AUTO';
    textarea.strokes = [{ type: 'SOLID', color: hexToRgb(C.greyMid) }];
    textarea.strokeWeight = 1;
    textarea.strokeAlign = 'INSIDE';
    const noteInput = makeText('bijv. rijp', 14, fontRegular, C.textMuted, { width: W - 40 - 28 });
    textarea.appendChild(noteInput);
    noteSection.appendChild(textarea);
    sheet.appendChild(noteSection);

    // Action buttons row
    const actionRow = makeAutoFrame('ActionRow', 'HORIZONTAL', {
      bg: 'transparent', gap: 12,
    });
    actionRow.primaryAxisSizingMode = 'FIXED';
    actionRow.counterAxisSizingMode = 'AUTO';
    actionRow.resize(W - 40, 10);

    const cancelBtn7 = makeAutoFrame('CancelBtn', 'HORIZONTAL', {
      bg: C.grey, pt: 16, pb: 16, pl: 20, pr: 20, radius: 14,
    });
    cancelBtn7.layoutGrow = 1;
    cancelBtn7.primaryAxisAlignItems = 'CENTER';
    cancelBtn7.counterAxisAlignItems = 'CENTER';
    cancelBtn7.primaryAxisSizingMode = 'FIXED';
    cancelBtn7.counterAxisSizingMode = 'AUTO';
    cancelBtn7.strokes = [{ type: 'SOLID', color: hexToRgb(C.greyMid) }];
    cancelBtn7.strokeWeight = 1;
    cancelBtn7.strokeAlign = 'INSIDE';
    cancelBtn7.appendChild(makeText('Annuleren', 15, fontSemiBold, C.text, { align: 'CENTER' }));
    actionRow.appendChild(cancelBtn7);

    const saveBtn = makeAutoFrame('SaveBtn', 'HORIZONTAL', {
      bg: C.brand, pt: 16, pb: 16, pl: 20, pr: 20, radius: 14,
    });
    saveBtn.layoutGrow = 1;
    saveBtn.primaryAxisAlignItems = 'CENTER';
    saveBtn.counterAxisAlignItems = 'CENTER';
    saveBtn.primaryAxisSizingMode = 'FIXED';
    saveBtn.counterAxisSizingMode = 'AUTO';
    saveBtn.appendChild(makeText('Opslaan', 15, fontSemiBold, C.white, { align: 'CENTER' }));
    actionRow.appendChild(saveBtn);

    sheet.appendChild(actionRow);
  }

  // ─── Finalise ─────────────────────────────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.closePlugin('✅ Komisses UI created — 7 screens');
})();
