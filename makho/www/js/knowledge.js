/* Makho – Wissen ohne Schlüssel: Umrechnen, Währungen, Übersetzen, Gleichungen, Periodensystem,
   Formeln, Business-Lexikon, Datumsrechnen, Quiz, Fakten und Zitate. */
(function (root) {
  "use strict";
  const nf = (v, d = 2) => Number(v).toLocaleString("de-DE", { maximumFractionDigits: d });
  const low = s => String(s || "").toLowerCase().trim();
  const fold = s => low(s).replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

  /* ================= Einheiten ================= */
  const UNITS = {
    länge: { base: "Meter", u: [
      [/^(kilometer|km)$/, 1000, "Kilometer"], [/^(meter|m)$/, 1, "Meter"], [/^(zentimeter|cm)$/, 0.01, "Zentimeter"], [/^(millimeter|mm)$/, 0.001, "Millimeter"],
      [/^(meilen?|mi)$/, 1609.344, "Meilen"], [/^(seemeilen?)$/, 1852, "Seemeilen"], [/^(fuß|fuss|feet|ft)$/, 0.3048, "Fuß"], [/^(zoll|inch|inches)$/, 0.0254, "Zoll"], [/^(yards?)$/, 0.9144, "Yards"], [/^(lichtjahre?)$/, 9.4607e15, "Lichtjahre"]] },
    masse: { base: "Kilogramm", u: [
      [/^(tonnen?|t)$/, 1000, "Tonnen"], [/^(kilogramm|kilo|kg)$/, 1, "Kilogramm"], [/^(gramm|g)$/, 0.001, "Gramm"], [/^(milligramm|mg)$/, 1e-6, "Milligramm"],
      [/^(pfund|lbs?)$/, 0.45359237, "Pfund"], [/^(unzen?|oz)$/, 0.028349523, "Unzen"]] },
    volumen: { base: "Liter", u: [
      [/^(kubikmeter|m3)$/, 1000, "Kubikmeter"], [/^(liter|l)$/, 1, "Liter"], [/^(milliliter|ml)$/, 0.001, "Milliliter"], [/^(deziliter|dl)$/, 0.1, "Deziliter"],
      [/^(gallonen?|gallons?)$/, 3.785411784, "Gallonen"], [/^(tassen?)$/, 0.25, "Tassen"]] },
    geschwindigkeit: { base: "km/h", u: [
      [/^(km\/h|kmh|kilometer pro stunde|stundenkilometer)$/, 1, "Kilometer pro Stunde"], [/^(m\/s|meter pro sekunde)$/, 3.6, "Meter pro Sekunde"],
      [/^(mph|meilen pro stunde)$/, 1.609344, "Meilen pro Stunde"], [/^(knoten)$/, 1.852, "Knoten"]] },
    fläche: { base: "Quadratmeter", u: [
      [/^(quadratkilometer|km2)$/, 1e6, "Quadratkilometer"], [/^(hektar|ha)$/, 1e4, "Hektar"], [/^(quadratmeter|m2)$/, 1, "Quadratmeter"], [/^(quadratzentimeter|cm2)$/, 1e-4, "Quadratzentimeter"], [/^(acres?)$/, 4046.856, "Acres"]] },
    zeit: { base: "Sekunden", u: [
      [/^(jahre?|jahren)$/, 31557600, "Jahre"], [/^(wochen?)$/, 604800, "Wochen"], [/^(tage?|tagen)$/, 86400, "Tage"], [/^(stunden?)$/, 3600, "Stunden"], [/^(minuten?)$/, 60, "Minuten"], [/^(sekunden?)$/, 1, "Sekunden"], [/^(millisekunden?)$/, 0.001, "Millisekunden"]] },
    daten: { base: "Byte", u: [
      [/^(terabytes?|tb)$/, 1e12, "Terabyte"], [/^(gigabytes?|gb)$/, 1e9, "Gigabyte"], [/^(megabytes?|mb)$/, 1e6, "Megabyte"], [/^(kilobytes?|kb)$/, 1e3, "Kilobyte"], [/^(bytes?)$/, 1, "Byte"], [/^(bits?)$/, 0.125, "Bit"]] },
    energie: { base: "Joule", u: [
      [/^(kilowattstunden?|kwh)$/, 3.6e6, "Kilowattstunden"], [/^(kilokalorien|kcal|kalorien)$/, 4184, "Kilokalorien"], [/^(kilojoule|kj)$/, 1000, "Kilojoule"], [/^(joule|j)$/, 1, "Joule"]] }
  };
  const TEMP = { celsius: "C", grad: "C", "grad celsius": "C", fahrenheit: "F", "grad fahrenheit": "F", kelvin: "K" };
  function findUnit(word) {
    word = low(word).replace(/^(in|nach)\s+/, "");
    for (const [cat, d] of Object.entries(UNITS)) for (const [re, f, name] of d.u) if (re.test(word)) return { cat, f, name };
    return null;
  }
  function convert(value, fromW, toW) {
    const tf = TEMP[low(fromW)], tt = TEMP[low(toW)];
    if (tf && tt) {
      const c = tf === "C" ? value : tf === "F" ? (value - 32) * 5 / 9 : value - 273.15;
      const out = tt === "C" ? c : tt === "F" ? c * 9 / 5 + 32 : c + 273.15;
      const nm = { C: "Grad Celsius", F: "Grad Fahrenheit", K: "Kelvin" };
      return { value: out, from: nm[tf], to: nm[tt] };
    }
    const a = findUnit(fromW), b = findUnit(toW);
    if (!a || !b || a.cat !== b.cat) return null;
    return { value: value * a.f / b.f, from: a.name, to: b.name, cat: a.cat };
  }

  /* ================= Währungen ================= */
  const CUR = [
    [/^(euros?|eur|€)$/, "EUR", "Euro"], [/^(us-?dollar|dollars?|usd|\$)$/, "USD", "US-Dollar"], [/^(pfund|britische pfund|gbp|£)$/, "GBP", "Britische Pfund"],
    [/^(franken|schweizer franken|chf)$/, "CHF", "Schweizer Franken"], [/^(yen|jpy)$/, "JPY", "Yen"], [/^(yuan|renminbi|cny)$/, "CNY", "Yuan"],
    [/^(lira|türkische lira|try)$/, "TRY", "Türkische Lira"], [/^(zloty|złoty|pln)$/, "PLN", "Zloty"], [/^(rupien?|indische rupien?|inr)$/, "INR", "Indische Rupien"],
    [/^(real|brasilianische real|brl)$/, "BRL", "Brasilianische Real"], [/^(kanadische dollar|cad)$/, "CAD", "Kanadische Dollar"], [/^(australische dollar|aud)$/, "AUD", "Australische Dollar"],
    [/^(dänische kronen?|dkk)$/, "DKK", "Dänische Kronen"], [/^(schwedische kronen?|sek)$/, "SEK", "Schwedische Kronen"], [/^(norwegische kronen?|nok)$/, "NOK", "Norwegische Kronen"],
    [/^(tschechische kronen?|czk)$/, "CZK", "Tschechische Kronen"], [/^(forint|huf)$/, "HUF", "Forint"], [/^(rand|zar)$/, "ZAR", "Rand"], [/^(won|krw)$/, "KRW", "Won"], [/^(mexikanische pesos?|mxn)$/, "MXN", "Mexikanische Pesos"]
  ];
  function findCurrency(w) { w = low(w).replace(/^(in|nach)\s+/, ""); for (const [re, code, name] of CUR) if (re.test(w)) return { code, name }; return null; }

  /* ================= Sprachen ================= */
  const LANG = { englisch: "en", englische: "en", französisch: "fr", französische: "fr", spanisch: "es", spanische: "es", italienisch: "it", italienische: "it", türkisch: "tr", türkische: "tr", russisch: "ru", russische: "ru", polnisch: "pl", polnische: "pl", arabisch: "ar", arabische: "ar", portugiesisch: "pt", portugiesische: "pt", niederländisch: "nl", niederländische: "nl", holländisch: "nl", japanisch: "ja", japanische: "ja", chinesisch: "zh", chinesische: "zh", griechisch: "el", griechische: "el", ukrainisch: "uk", ukrainische: "uk", kroatisch: "hr", kroatische: "hr", schwedisch: "sv", schwedische: "sv", dänisch: "da", norwegisch: "no", finnisch: "fi", tschechisch: "cs", ungarisch: "hu", rumänisch: "ro", koreanisch: "ko", hindi: "hi", latein: "la", deutsch: "de", deutsche: "de" };
  const LANGNAME = { en: "Englisch", fr: "Französisch", es: "Spanisch", it: "Italienisch", tr: "Türkisch", ru: "Russisch", pl: "Polnisch", ar: "Arabisch", pt: "Portugiesisch", nl: "Niederländisch", ja: "Japanisch", zh: "Chinesisch", el: "Griechisch", uk: "Ukrainisch", hr: "Kroatisch", sv: "Schwedisch", da: "Dänisch", no: "Norwegisch", fi: "Finnisch", cs: "Tschechisch", hu: "Ungarisch", ro: "Rumänisch", ko: "Koreanisch", hi: "Hindi", la: "Latein", de: "Deutsch" };
  const BCP = { en: "en-US", fr: "fr-FR", es: "es-ES", it: "it-IT", tr: "tr-TR", ru: "ru-RU", pl: "pl-PL", ar: "ar-SA", pt: "pt-PT", nl: "nl-NL", ja: "ja-JP", zh: "zh-CN", el: "el-GR", uk: "uk-UA", hr: "hr-HR", sv: "sv-SE", da: "da-DK", no: "nb-NO", fi: "fi-FI", cs: "cs-CZ", hu: "hu-HU", ro: "ro-RO", ko: "ko-KR", hi: "hi-IN", la: "it-IT", de: "de-DE" };

  /* ================= Gleichungen ================= */
  function solve(text) {
    let s = low(text).replace(/^(löse|berechne|rechne)\s+(die gleichung\s+)?/, "")
      .replace(/x\s*(quadrat|hoch\s*2|zum quadrat)/g, "x^2").replace(/x²/g, "x^2")
      .replace(/\bplus\b/g, "+").replace(/\bminus\b/g, "-").replace(/\bmal\b/g, "*").replace(/\bgleich\b|\bist gleich\b/g, "=")
      .replace(/(\d),(\d)/g, "$1.$2").replace(/\s+/g, "");
    if (!/x/.test(s) || (s.match(/=/g) || []).length !== 1) return null;
    const [L, R] = s.split("=");
    const coef = side => {
      const c = [0, 0, 0];
      const terms = side.replace(/-/g, "+-").split("+").filter(Boolean);
      for (let t of terms) {
        t = t.replace(/\*/g, "");
        let m;
        if ((m = t.match(/^(-?\d*\.?\d*)x\^2$/))) c[2] += m[1] === "" ? 1 : m[1] === "-" ? -1 : parseFloat(m[1]);
        else if ((m = t.match(/^(-?\d*\.?\d*)x$/))) c[1] += m[1] === "" ? 1 : m[1] === "-" ? -1 : parseFloat(m[1]);
        else if (/^-?\d+\.?\d*$/.test(t)) c[0] += parseFloat(t);
        else return null;
      }
      return c;
    };
    const l = coef(L), r = coef(R);
    if (!l || !r) return null;
    const a = l[2] - r[2], b = l[1] - r[1], c = l[0] - r[0];
    const show = `${a ? fmtC(a, "x²", true) : ""}${b ? fmtC(b, "x", !a) : ""}${fmtC(c, "", !a && !b)} = 0`;
    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) < 1e-12) return { kind: "none", eq: text, steps: [show], spoken: c === 0 ? "Diese Gleichung gilt für jedes x." : "Diese Gleichung hat keine Lösung." };
      const x = -c / b;
      return { kind: "linear", eq: text, steps: [`${fmtC(b, "x", true)} = ${nf(-c, 4)}`, `x = ${nf(-c, 4)} : ${nf(b, 4)}`], solutions: [x], spoken: `x ist gleich ${nf(x, 4)}.` };
    }
    const D = b * b - 4 * a * c;
    const par = v => v < 0 ? `(${nf(v, 4)})` : nf(v, 4);
    const steps = [show, `Diskriminante: ${par(b)}² − 4 · ${par(a)} · ${par(c)} = ${nf(D, 4)}`];
    if (D < 0) return { kind: "quad", eq: text, steps, solutions: [], spoken: "Die Diskriminante ist negativ, es gibt keine reelle Lösung." };
    const x1 = (-b + Math.sqrt(D)) / (2 * a), x2 = (-b - Math.sqrt(D)) / (2 * a);
    steps.push("x = (−b ± √D) / 2a");
    if (Math.abs(D) < 1e-12) return { kind: "quad", eq: text, steps, solutions: [x1], spoken: `Es gibt genau eine Lösung: x ist gleich ${nf(x1, 4)}.` };
    return { kind: "quad", eq: text, steps, solutions: [x1, x2], spoken: `Zwei Lösungen: x eins ist ${nf(x1, 4)} und x zwei ist ${nf(x2, 4)}.` };
  }
  function fmtC(v, x, first) { const sgn = v < 0 ? "−" : "+"; const abs = Math.abs(v); const num = x && abs === 1 ? "" : nf(abs, 4); return (first ? (v < 0 ? "−" : "") : ` ${sgn} `) + num + x; }

  /* ================= Periodensystem ================= */
  const PT = "H Wasserstoff 1.008|He Helium 4.003|Li Lithium 6.94|Be Beryllium 9.012|B Bor 10.81|C Kohlenstoff 12.011|N Stickstoff 14.007|O Sauerstoff 15.999|F Fluor 18.998|Ne Neon 20.18|Na Natrium 22.99|Mg Magnesium 24.305|Al Aluminium 26.982|Si Silicium 28.085|P Phosphor 30.974|S Schwefel 32.06|Cl Chlor 35.45|Ar Argon 39.95|K Kalium 39.098|Ca Calcium 40.078|Sc Scandium 44.956|Ti Titan 47.867|V Vanadium 50.942|Cr Chrom 51.996|Mn Mangan 54.938|Fe Eisen 55.845|Co Cobalt 58.933|Ni Nickel 58.693|Cu Kupfer 63.546|Zn Zink 65.38|Ga Gallium 69.723|Ge Germanium 72.63|As Arsen 74.922|Se Selen 78.971|Br Brom 79.904|Kr Krypton 83.798|Rb Rubidium 85.468|Sr Strontium 87.62|Y Yttrium 88.906|Zr Zirconium 91.224|Nb Niob 92.906|Mo Molybdän 95.95|Tc Technetium 98|Ru Ruthenium 101.07|Rh Rhodium 102.91|Pd Palladium 106.42|Ag Silber 107.87|Cd Cadmium 112.41|In Indium 114.82|Sn Zinn 118.71|Sb Antimon 121.76|Te Tellur 127.6|I Iod 126.9|Xe Xenon 131.29|Cs Caesium 132.91|Ba Barium 137.33|La Lanthan 138.91|Ce Cer 140.12|Pr Praseodym 140.91|Nd Neodym 144.24|Pm Promethium 145|Sm Samarium 150.36|Eu Europium 151.96|Gd Gadolinium 157.25|Tb Terbium 158.93|Dy Dysprosium 162.5|Ho Holmium 164.93|Er Erbium 167.26|Tm Thulium 168.93|Yb Ytterbium 173.05|Lu Lutetium 174.97|Hf Hafnium 178.49|Ta Tantal 180.95|W Wolfram 183.84|Re Rhenium 186.21|Os Osmium 190.23|Ir Iridium 192.22|Pt Platin 195.08|Au Gold 196.97|Hg Quecksilber 200.59|Tl Thallium 204.38|Pb Blei 207.2|Bi Bismut 208.98|Po Polonium 209|At Astat 210|Rn Radon 222|Fr Francium 223|Ra Radium 226|Ac Actinium 227|Th Thorium 232.04|Pa Protactinium 231.04|U Uran 238.03|Np Neptunium 237|Pu Plutonium 244|Am Americium 243|Cm Curium 247|Bk Berkelium 247|Cf Californium 251|Es Einsteinium 252|Fm Fermium 257|Md Mendelevium 258|No Nobelium 259|Lr Lawrencium 266|Rf Rutherfordium 267|Db Dubnium 268|Sg Seaborgium 269|Bh Bohrium 270|Hs Hassium 277|Mt Meitnerium 278|Ds Darmstadtium 281|Rg Roentgenium 282|Cn Copernicium 285|Nh Nihonium 286|Fl Flerovium 289|Mc Moscovium 290|Lv Livermorium 293|Ts Tenness 294|Og Oganesson 294"
    .split("|").map((e, i) => { const [sym, name, mass] = e.split(" "); return { z: i + 1, sym, name, mass: parseFloat(mass) }; });
  const GROUPS = [[[1, 1], "Nichtmetall"], [[2, 2], "Edelgas"], [[3, 3], "Alkalimetall"], [[4, 4], "Erdalkalimetall"], [[5, 5], "Halbmetall"], [[6, 8], "Nichtmetall"], [[9, 9], "Halogen"], [[10, 10], "Edelgas"], [[11, 11], "Alkalimetall"], [[12, 12], "Erdalkalimetall"], [[13, 13], "Metall"], [[14, 14], "Halbmetall"], [[15, 16], "Nichtmetall"], [[17, 17], "Halogen"], [[18, 18], "Edelgas"], [[19, 19], "Alkalimetall"], [[20, 20], "Erdalkalimetall"], [[21, 30], "Übergangsmetall"], [[31, 31], "Metall"], [[32, 33], "Halbmetall"], [[34, 34], "Nichtmetall"], [[35, 35], "Halogen"], [[36, 36], "Edelgas"], [[37, 37], "Alkalimetall"], [[38, 38], "Erdalkalimetall"], [[39, 48], "Übergangsmetall"], [[49, 50], "Metall"], [[51, 52], "Halbmetall"], [[53, 53], "Halogen"], [[54, 54], "Edelgas"], [[55, 55], "Alkalimetall"], [[56, 56], "Erdalkalimetall"], [[57, 71], "Lanthanoid"], [[72, 80], "Übergangsmetall"], [[81, 84], "Metall"], [[85, 85], "Halogen"], [[86, 86], "Edelgas"], [[87, 87], "Alkalimetall"], [[88, 88], "Erdalkalimetall"], [[89, 103], "Actinoid"], [[104, 112], "Übergangsmetall"], [[113, 116], "Metall"], [[117, 117], "Halogen"], [[118, 118], "Edelgas"]];
  const groupOf = z => (GROUPS.find(([[a, b]]) => z >= a && z <= b) || [0, "Element"])[1];
  function element(q) {
    const t = low(q);
    let m = t.match(/(?:ordnungszahl|nummer|kernladungszahl)\s*(\d{1,3})/) || t.match(/^(\d{1,3})$/);
    if (m) { const e = PT[+m[1] - 1]; return e ? Object.assign({ group: groupOf(e.z) }, e) : null; }
    for (const e of PT) if (new RegExp("\\b" + e.name.toLowerCase() + "\\b").test(t)) return Object.assign({ group: groupOf(e.z) }, e);
    m = String(q).match(/\b([A-Z][a-z]?)\b/);
    if (m) { const e = PT.find(x => x.sym === m[1]); if (e) return Object.assign({ group: groupOf(e.z) }, e); }
    m = t.match(/(?:symbol|zeichen|element)\s+([a-z]{1,2})$/);
    if (m) { const e = PT.find(x => x.sym.toLowerCase() === m[1]); if (e) return Object.assign({ group: groupOf(e.z) }, e); }
    return null;
  }

  /* ================= Formeln ================= */
  const FORMULAS = [
    [/pythagoras/, "Satz des Pythagoras", "a² + b² = c²", "Im rechtwinkligen Dreieck ist das Quadrat der Hypotenuse gleich der Summe der Quadrate der beiden Katheten.", ["a, b: Katheten", "c: Hypotenuse"]],
    [/kreis.*fläche|fläche.*kreis|kreisfläche/, "Kreisfläche", "A = π · r²", "Die Fläche eines Kreises ist Pi mal Radius zum Quadrat.", ["A: Fläche", "r: Radius", "π ≈ 3,14159"]],
    [/kreis.*umfang|umfang.*kreis|kreisumfang/, "Kreisumfang", "U = 2 · π · r", "Der Umfang eines Kreises ist zwei mal Pi mal Radius.", ["U: Umfang", "r: Radius"]],
    [/dreieck.*fläche|fläche.*dreieck/, "Dreiecksfläche", "A = ½ · g · h", "Die Fläche eines Dreiecks ist die Hälfte von Grundseite mal Höhe.", ["g: Grundseite", "h: Höhe"]],
    [/kugel.*volumen|volumen.*kugel/, "Kugelvolumen", "V = 4/3 · π · r³", "Das Volumen einer Kugel ist vier Drittel mal Pi mal Radius hoch drei.", ["r: Radius"]],
    [/zylinder/, "Zylindervolumen", "V = π · r² · h", "Das Volumen eines Zylinders ist Grundfläche mal Höhe.", ["r: Radius", "h: Höhe"]],
    [/mitternacht|pq.?formel|abc.?formel|quadratische gleichung/, "Mitternachtsformel", "x = (−b ± √(b² − 4ac)) / 2a", "Damit löst du jede quadratische Gleichung der Form a x Quadrat plus b x plus c gleich null.", ["a, b, c: Koeffizienten"]],
    [/geschwindigkeit/, "Geschwindigkeit", "v = s / t", "Geschwindigkeit ist Strecke geteilt durch Zeit.", ["v: Geschwindigkeit", "s: Strecke", "t: Zeit"]],
    [/beschleunigung/, "Beschleunigung", "a = Δv / Δt", "Beschleunigung ist die Änderung der Geschwindigkeit pro Zeit.", ["a: Beschleunigung", "v: Geschwindigkeit", "t: Zeit"]],
    [/kraft|newton/, "Zweites Newtonsches Gesetz", "F = m · a", "Kraft ist Masse mal Beschleunigung.", ["F: Kraft in Newton", "m: Masse", "a: Beschleunigung"]],
    [/kinetische energie|bewegungsenergie/, "Kinetische Energie", "E = ½ · m · v²", "Die Bewegungsenergie ist die Hälfte von Masse mal Geschwindigkeit zum Quadrat.", ["m: Masse", "v: Geschwindigkeit"]],
    [/potenzielle energie|lageenergie|höhenenergie/, "Potenzielle Energie", "E = m · g · h", "Die Lageenergie ist Masse mal Erdbeschleunigung mal Höhe.", ["g ≈ 9,81 m/s²", "h: Höhe"]],
    [/einstein|e ?= ?mc|masse.?energie/, "Masse-Energie-Äquivalenz", "E = m · c²", "Energie ist Masse mal Lichtgeschwindigkeit zum Quadrat.", ["c ≈ 300.000 km/s"]],
    [/ohm|spannung|widerstand/, "Ohmsches Gesetz", "U = R · I", "Spannung ist Widerstand mal Stromstärke.", ["U: Spannung in Volt", "R: Widerstand in Ohm", "I: Stromstärke in Ampere"]],
    [/elektrische leistung|leistung.*strom/, "Elektrische Leistung", "P = U · I", "Leistung ist Spannung mal Stromstärke.", ["P: Leistung in Watt"]],
    [/dichte/, "Dichte", "ρ = m / V", "Dichte ist Masse geteilt durch Volumen.", ["ρ: Dichte", "m: Masse", "V: Volumen"]],
    [/druck/, "Druck", "p = F / A", "Druck ist Kraft geteilt durch Fläche.", ["p: Druck", "F: Kraft", "A: Fläche"]],
    [/prozent.*rechnung|prozentwert|grundwert/, "Prozentrechnung", "W = G · p / 100", "Der Prozentwert ist Grundwert mal Prozentsatz durch hundert.", ["W: Prozentwert", "G: Grundwert", "p: Prozentsatz"]],
    [/zinseszins/, "Zinseszins", "K = K₀ · (1 + p/100)ⁿ", "Das Endkapital ist Startkapital mal eins plus Zinssatz, hoch die Anzahl der Jahre.", ["K₀: Startkapital", "p: Zinssatz", "n: Jahre"]],
    [/zinsen|zinsformel/, "Zinsformel", "Z = K · p · t / 100", "Zinsen sind Kapital mal Zinssatz mal Zeit in Jahren, durch hundert.", ["K: Kapital", "p: Zinssatz", "t: Jahre"]],
    [/steigung|lineare funktion/, "Lineare Funktion", "y = m · x + b", "Eine Gerade hat die Steigung m und den y-Achsenabschnitt b.", ["m: Steigung", "b: Achsenabschnitt"]],
    [/fotosynthese|photosynthese/, "Fotosynthese", "6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂", "Pflanzen bauen mit Lichtenergie aus Kohlendioxid und Wasser Traubenzucker und Sauerstoff auf.", ["Licht als Energiequelle", "Chlorophyll als Katalysator"]],
    [/roi|return on investment|rendite/, "Return on Investment", "ROI = Gewinn / Investition · 100 %", "Der ROI zeigt, wie viel Prozent Gewinn eine Investition gebracht hat.", ["Gewinn: Ertrag minus Kosten"]],
    [/break.?even|gewinnschwelle/, "Break-even-Menge", "x = Fixkosten / (Preis − variable Stückkosten)", "Ab dieser Stückzahl deckt der Umsatz alle Kosten.", ["Deckungsbeitrag pro Stück: Preis minus variable Kosten"]],
    [/deckungsbeitrag/, "Deckungsbeitrag", "DB = Umsatz − variable Kosten", "Der Deckungsbeitrag zeigt, was nach den variablen Kosten zur Deckung der Fixkosten übrig bleibt.", ["DB je Stück = Preis − variable Stückkosten"]],
    [/marge|gewinnmarge|umsatzrendite/, "Umsatzrendite", "Marge = Gewinn / Umsatz · 100 %", "Die Marge zeigt, wie viel Prozent vom Umsatz als Gewinn übrig bleiben.", []]
  ];
  function formula(q) { const t = low(q); for (const [re, name, f, expl, legend] of FORMULAS) if (re.test(t)) return { name, formula: f, explain: expl, legend }; return null; }

  /* ================= Business-Lexikon ================= */
  const GLOSSARY = [
    ["ebitda", "EBITDA", "Gewinn vor Zinsen, Steuern und Abschreibungen. Er zeigt die operative Ertragskraft eines Unternehmens, unabhängig von Finanzierung und Investitionen."],
    ["ebit", "EBIT", "Gewinn vor Zinsen und Steuern, also das operative Ergebnis. Er zeigt, wie viel das Kerngeschäft verdient."],
    ["cashflow", "Cashflow", "Der Zufluss und Abfluss von Geld in einem Zeitraum. Ein positiver Cashflow bedeutet, dass mehr Geld hereinkommt als hinausgeht."],
    ["bilanz", "Bilanz", "Eine Gegenüberstellung von Vermögen auf der Aktivseite und Kapital auf der Passivseite zu einem Stichtag. Beide Seiten sind immer gleich groß."],
    ["guv|gewinn und verlustrechnung", "Gewinn- und Verlustrechnung", "Sie stellt Erträge und Aufwendungen eines Jahres gegenüber und ermittelt so den Gewinn oder Verlust."],
    ["umsatzsteuer|mehrwertsteuer", "Umsatzsteuer", "Eine Steuer auf Verkäufe, in Deutschland meist 19 Prozent, ermäßigt 7 Prozent. Unternehmen ziehen sie ein und verrechnen sie mit der Vorsteuer."],
    ["vorsteuer", "Vorsteuer", "Die Umsatzsteuer, die ein Unternehmen beim Einkauf zahlt. Sie wird mit der eingenommenen Umsatzsteuer verrechnet."],
    ["kleinunternehmer", "Kleinunternehmerregelung", "Wer im Vorjahr höchstens 25.000 Euro und im laufenden Jahr voraussichtlich höchstens 100.000 Euro Umsatz macht, kann auf die Umsatzsteuer verzichten, darf dann aber auch keine Vorsteuer abziehen."],
    ["kpi", "KPI", "Key Performance Indicator, also eine Kennzahl, mit der man misst, ob ein Ziel erreicht wird, zum Beispiel Umsatz pro Kunde oder Conversion Rate."],
    ["conversion rate|konversionsrate", "Conversion Rate", "Der Anteil der Besucher, die eine gewünschte Aktion ausführen, zum Beispiel kaufen. Bei 1.000 Besuchern und 20 Käufen sind das 2 Prozent."],
    ["customer lifetime value|clv|ltv", "Customer Lifetime Value", "Der gesamte Gewinn, den ein Kunde über die ganze Kundenbeziehung bringt. Er hilft zu entscheiden, wie viel man für Neukunden ausgeben kann."],
    ["cac|kundenakquisitionskosten", "Customer Acquisition Cost", "Die durchschnittlichen Kosten, um einen neuen Kunden zu gewinnen, also Marketing- und Vertriebskosten geteilt durch die Zahl der Neukunden."],
    ["churn", "Churn Rate", "Der Anteil der Kunden, die in einem Zeitraum abspringen. Eine niedrige Churn Rate ist besonders für Abo-Modelle wichtig."],
    ["skonto", "Skonto", "Ein Preisnachlass für schnelle Zahlung, zum Beispiel 2 Prozent bei Zahlung innerhalb von 10 Tagen."],
    ["rabatt", "Rabatt", "Ein Preisnachlass, etwa für Mengen, Treue oder Aktionen, der direkt vom Listenpreis abgezogen wird."],
    ["liquidität", "Liquidität", "Die Fähigkeit eines Unternehmens, seine Rechnungen fristgerecht zu bezahlen. Fehlende Liquidität ist einer der häufigsten Gründe für Insolvenzen."],
    ["abschreibung|afa", "Abschreibung", "Die Verteilung der Anschaffungskosten eines langlebigen Wirtschaftsguts auf seine Nutzungsdauer. Sie mindert den Gewinn und damit die Steuer."],
    ["eigenkapital", "Eigenkapital", "Das Kapital, das die Eigentümer selbst ins Unternehmen einbringen oder dort als Gewinn stehen lassen."],
    ["fremdkapital", "Fremdkapital", "Geld, das von Dritten stammt, etwa Kredite oder Lieferantenverbindlichkeiten. Es muss zurückgezahlt werden."],
    ["eigenkapitalquote", "Eigenkapitalquote", "Der Anteil des Eigenkapitals am Gesamtkapital. Eine hohe Quote gilt als Zeichen finanzieller Stabilität."],
    ["gmbh", "GmbH", "Gesellschaft mit beschränkter Haftung. Sie braucht 25.000 Euro Stammkapital, und die Gesellschafter haften nur mit ihrer Einlage."],
    ["ug|unternehmergesellschaft", "UG (haftungsbeschränkt)", "Die kleine Schwester der GmbH. Sie kann schon mit einem Euro gegründet werden, muss aber ein Viertel ihres Gewinns zurücklegen, bis 25.000 Euro erreicht sind."],
    ["einzelunternehmen", "Einzelunternehmen", "Die einfachste Rechtsform. Eine Person führt das Unternehmen und haftet mit ihrem gesamten Privatvermögen."],
    ["aktiengesellschaft|\\bag\\b", "Aktiengesellschaft", "Eine Kapitalgesellschaft, deren Grundkapital in Aktien aufgeteilt ist. Sie braucht mindestens 50.000 Euro Grundkapital."],
    ["aktie", "Aktie", "Ein Wertpapier, das einen Anteil an einem Unternehmen verbrieft. Aktionäre sind am Gewinn beteiligt, meist über Dividenden und Kurssteigerungen."],
    ["dividende", "Dividende", "Der Teil des Gewinns, den eine Aktiengesellschaft an ihre Aktionäre ausschüttet."],
    ["etf", "ETF", "Ein börsengehandelter Indexfonds, der einen Index wie den MSCI World nachbildet. ETFs sind breit gestreut und meist günstig."],
    ["inflation", "Inflation", "Ein allgemeiner Anstieg der Preise, wodurch das Geld an Kaufkraft verliert."],
    ["rezession", "Rezession", "Ein Rückgang der Wirtschaftsleistung, meist definiert als zwei Quartale in Folge mit sinkendem Bruttoinlandsprodukt."],
    ["bip|bruttoinlandsprodukt", "Bruttoinlandsprodukt", "Der Wert aller Waren und Dienstleistungen, die in einem Land in einem Jahr hergestellt werden."],
    ["leitzins", "Leitzins", "Der Zinssatz, zu dem sich Banken bei der Zentralbank Geld leihen. Er beeinflusst Kreditzinsen, Sparzinsen und die Inflation."],
    ["marketing mix|4p", "Marketing-Mix", "Die vier Ps: Produkt, Preis, Platzierung und Promotion. Sie beschreiben die zentralen Stellschrauben des Marketings."],
    ["swot", "SWOT-Analyse", "Eine Analyse von Stärken, Schwächen, Chancen und Risiken, um die strategische Lage eines Unternehmens einzuschätzen."],
    ["usp|alleinstellungsmerkmal", "USP", "Unique Selling Proposition, das Alleinstellungsmerkmal, das ein Angebot von der Konkurrenz abhebt."],
    ["b2b", "B2B", "Business to Business, also Geschäfte zwischen Unternehmen."],
    ["b2c", "B2C", "Business to Consumer, also Geschäfte zwischen Unternehmen und Privatkunden."],
    ["dropshipping", "Dropshipping", "Ein Handelsmodell, bei dem der Händler keine Ware lagert. Der Lieferant verschickt direkt an den Kunden."],
    ["seo", "SEO", "Suchmaschinenoptimierung. Maßnahmen, damit eine Website bei Google weiter oben erscheint, etwa gute Inhalte, schnelle Ladezeiten und Links."],
    ["sea", "SEA", "Suchmaschinenwerbung, also bezahlte Anzeigen in Suchmaschinen wie Google Ads."],
    ["funnel|sales funnel", "Sales Funnel", "Der Verkaufstrichter beschreibt die Stufen von der ersten Aufmerksamkeit über das Interesse bis zum Kauf."],
    ["mvp|minimum viable product", "MVP", "Minimum Viable Product, die kleinste Version eines Produkts, mit der man echtes Kundenfeedback sammeln kann."],
    ["skalierung|skalierbar", "Skalierbarkeit", "Die Fähigkeit eines Geschäftsmodells, Umsatz stark zu steigern, ohne dass die Kosten im gleichen Maß wachsen."],
    ["venture capital|risikokapital", "Venture Capital", "Beteiligungskapital für junge, wachstumsstarke Unternehmen. Investoren erhalten dafür Anteile."],
    ["business angel", "Business Angel", "Eine Privatperson, die in frühe Start-ups investiert und oft auch Erfahrung und Kontakte mitbringt."],
    ["bewertung|valuation", "Unternehmensbewertung", "Die Ermittlung des Werts eines Unternehmens, etwa über Ertragswert, Multiplikatoren oder abgezinste Cashflows."],
    ["working capital", "Working Capital", "Umlaufvermögen minus kurzfristige Verbindlichkeiten. Es zeigt, wie viel Kapital für das laufende Geschäft gebunden ist."],
    ["fixkosten", "Fixkosten", "Kosten, die unabhängig von der Produktionsmenge anfallen, etwa Miete oder Gehälter."],
    ["variable kosten", "Variable Kosten", "Kosten, die mit der Menge steigen, etwa Material oder Versand."],
    ["gewerbesteuer", "Gewerbesteuer", "Eine Steuer der Gemeinden auf den Gewinn von Gewerbebetrieben. Für Einzelunternehmen und Personengesellschaften gibt es einen Freibetrag von 24.500 Euro."],
    ["einkommensteuer", "Einkommensteuer", "Die Steuer auf das Einkommen von Privatpersonen. Der Grundfreibetrag bleibt steuerfrei, darüber steigt der Steuersatz progressiv."],
    ["körperschaftsteuer", "Körperschaftsteuer", "Die Einkommensteuer für Kapitalgesellschaften wie GmbH und AG. Sie beträgt in Deutschland 15 Prozent plus Solidaritätszuschlag."],
    ["brutto", "Brutto", "Ein Betrag vor Abzug von Steuern oder Abgaben, zum Beispiel der Preis inklusive Mehrwertsteuer."],
    ["netto", "Netto", "Ein Betrag nach Abzug von Steuern oder Abgaben, zum Beispiel der Preis ohne Mehrwertsteuer."],
    ["agil|scrum", "Agiles Arbeiten", "Eine Arbeitsweise in kurzen Zyklen mit regelmäßigem Feedback. Scrum ist das bekannteste Framework dafür, mit Sprints von meist zwei Wochen."],
    ["okr", "OKR", "Objectives and Key Results, eine Methode zur Zielsetzung: ein qualitatives Ziel und drei bis fünf messbare Schlüsselergebnisse."],
    ["arbitrage", "Arbitrage", "Das Ausnutzen von Preisunterschieden für dasselbe Gut auf verschiedenen Märkten."],
    ["resale|wiederverkauf", "Resale", "Der Wiederverkauf von Waren, oft gebraucht oder limitiert, mit dem Ziel, die Differenz zwischen Einkaufs- und Verkaufspreis als Gewinn zu erzielen."]
  ];
  function glossary(q) {
    const t = low(q);
    for (const [keys, name, def] of GLOSSARY) if (new RegExp("(^|[^a-zäöüß])(" + keys + ")([^a-zäöüß]|$)").test(t)) return { name, def };
    return null;
  }

  /* ================= Datum ================= */
  function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da); }
  const MONTHS = ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"];
  function namedDate(t, now) {
    t = low(t); const y = now.getFullYear();
    const next = (mk) => { let d = mk(y); if (d < startOfDay(now)) d = mk(y + 1); return d; };
    if (/weihnacht|heiligabend/.test(t)) return { name: /heiligabend/.test(t) ? "Heiligabend" : "Weihnachten", date: next(yy => new Date(yy, 11, 24)) };
    if (/silvester/.test(t)) return { name: "Silvester", date: next(yy => new Date(yy, 11, 31)) };
    if (/neujahr|neues jahr/.test(t)) return { name: "Neujahr", date: new Date(y + 1, 0, 1) };
    if (/ostern/.test(t)) return { name: "Ostern", date: next(easter) };
    if (/valentin/.test(t)) return { name: "Valentinstag", date: next(yy => new Date(yy, 1, 14)) };
    if (/halloween/.test(t)) return { name: "Halloween", date: next(yy => new Date(yy, 9, 31)) };
    if (/sommeranfang|sommer/.test(t)) return { name: "Sommeranfang", date: next(yy => new Date(yy, 5, 21)) };
    if (/tag der deutschen einheit/.test(t)) return { name: "Tag der Deutschen Einheit", date: next(yy => new Date(yy, 9, 3)) };
    let m = t.match(/(\d{1,2})\.?\s*(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)(?:\s*(\d{4}))?/);
    if (m) { const mi = MONTHS.indexOf(m[2]); const yy = m[3] ? +m[3] : null; const mk = z => new Date(z, mi, +m[1]); return { name: `${+m[1]}. ${m[2].charAt(0).toUpperCase() + m[2].slice(1)}${yy ? " " + yy : ""}`, date: yy ? mk(yy) : next(mk) }; }
    m = t.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})?/);
    if (m) { const yy = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : null; const mk = z => new Date(z, +m[2] - 1, +m[1]); return { name: `${m[1]}.${m[2]}.${yy || ""}`, date: yy ? mk(yy) : next(mk) }; }
    return null;
  }
  const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
  function isoWeek(d) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 86400000 + 1) / 7); }

  /* ================= Quiz ================= */
  const QUIZ = [
    ["Mathe", "Wie viel ist 7 mal 8?", "56", ["56", "sechsundfünfzig"]], ["Mathe", "Wie viele Grad hat ein rechter Winkel?", "90 Grad", ["90", "neunzig"]],
    ["Mathe", "Was ist die Quadratwurzel aus 81?", "9", ["9", "neun"]], ["Mathe", "Wie viele Seiten hat ein Sechseck?", "6", ["6", "sechs"]],
    ["Mathe", "Wie viel Prozent sind ein Viertel?", "25 Prozent", ["25", "fünfundzwanzig"]], ["Mathe", "Wie heißt das Ergebnis einer Multiplikation?", "Produkt", ["produkt"]],
    ["Physik", "Wie schnell ist das Licht ungefähr in Kilometern pro Sekunde?", "300.000", ["300000", "300 000", "300.000", "dreihunderttausend", "300 tausend"]],
    ["Physik", "In welcher Einheit misst man elektrische Spannung?", "Volt", ["volt"]], ["Physik", "Bei wie viel Grad Celsius siedet Wasser auf Meereshöhe?", "100 Grad", ["100", "hundert"]],
    ["Chemie", "Welches chemische Symbol hat Gold?", "Au", ["au", "a u"]], ["Chemie", "Aus welchen Elementen besteht Wasser?", "Wasserstoff und Sauerstoff", ["wasserstoff", "sauerstoff"]],
    ["Chemie", "Welches Gas atmen wir aus, das Pflanzen aufnehmen?", "Kohlendioxid", ["kohlendioxid", "co2", "kohlenstoffdioxid"]],
    ["Biologie", "Wie viele Herzkammern hat ein Mensch?", "4", ["4", "vier"]], ["Biologie", "Wie heißt der grüne Farbstoff der Pflanzen?", "Chlorophyll", ["chlorophyll"]],
    ["Biologie", "Was ist das größte Organ des Menschen?", "Die Haut", ["haut"]], ["Biologie", "Wie viele Beine hat eine Spinne?", "8", ["8", "acht"]],
    ["Geschichte", "In welchem Jahr fiel die Berliner Mauer?", "1989", ["1989", "neunzehnhundertneunundachtzig"]], ["Geschichte", "Wer war der erste Bundeskanzler der Bundesrepublik?", "Konrad Adenauer", ["adenauer"]],
    ["Geschichte", "In welchem Jahr begann der Zweite Weltkrieg?", "1939", ["1939"]], ["Geschichte", "Wer entdeckte 1492 Amerika für Europa?", "Christoph Kolumbus", ["kolumbus"]],
    ["Geschichte", "In welchem Jahr wurde Deutschland wiedervereinigt?", "1990", ["1990"]],
    ["Erdkunde", "Was ist die Hauptstadt von Australien?", "Canberra", ["canberra"]], ["Erdkunde", "Was ist der längste Fluss Deutschlands?", "Der Rhein", ["rhein"]],
    ["Erdkunde", "Auf welchem Kontinent liegt Ägypten?", "Afrika", ["afrika"]], ["Erdkunde", "Was ist der höchste Berg Deutschlands?", "Die Zugspitze", ["zugspitze"]],
    ["Erdkunde", "Was ist die Hauptstadt von Kanada?", "Ottawa", ["ottawa"]], ["Erdkunde", "Welcher Ozean ist der größte?", "Der Pazifik", ["pazifik", "pazifische"]],
    ["Deutsch", "Wer schrieb den Faust?", "Johann Wolfgang von Goethe", ["goethe"]], ["Deutsch", "Wie nennt man ein Wort, das eine Tätigkeit beschreibt?", "Verb", ["verb", "tuwort", "tätigkeitswort", "zeitwort"]],
    ["Deutsch", "Wie viele Fälle gibt es im Deutschen?", "4", ["4", "vier"]], ["Englisch", "Was heißt Schmetterling auf Englisch?", "Butterfly", ["butterfly", "butter fly"]],
    ["Englisch", "Was ist die Vergangenheitsform von go?", "went", ["went", "wänt"]],
    ["Wirtschaft", "Wofür steht die Abkürzung GmbH?", "Gesellschaft mit beschränkter Haftung", ["gesellschaft mit beschränkter haftung", "beschränkter haftung"]],
    ["Wirtschaft", "Wie hoch ist der normale Mehrwertsteuersatz in Deutschland?", "19 Prozent", ["19", "neunzehn"]],
    ["Wirtschaft", "Wie nennt man den Gewinnanteil, den Aktionäre erhalten?", "Dividende", ["dividende"]],
    ["Wirtschaft", "Was misst das Bruttoinlandsprodukt?", "Die Wirtschaftsleistung eines Landes", ["wirtschaftsleistung", "waren und dienstleistungen", "wert aller"]],
    ["Wirtschaft", "Wie heißt die Zentralbank der Eurozone?", "Europäische Zentralbank", ["ezb", "europäische zentralbank"]],
    ["Technik", "Wofür steht die Abkürzung KI?", "Künstliche Intelligenz", ["künstliche intelligenz"]], ["Technik", "Wie viele Bits hat ein Byte?", "8", ["8", "acht"]],
    ["Allgemein", "Wie viele Bundesländer hat Deutschland?", "16", ["16", "sechzehn"]], ["Allgemein", "Welcher Planet ist der Sonne am nächsten?", "Merkur", ["merkur"]],
    ["Allgemein", "Welcher Planet ist der größte im Sonnensystem?", "Jupiter", ["jupiter"]], ["Allgemein", "Wie viele Minuten hat ein Tag?", "1440", ["1440", "1.440", "tausendvierhundertvierzig"]]
  ].map(([cat, q, a, accept]) => ({ cat, q, a, accept }));
  function checkAnswer(item, said) { const s = fold(said); return item.accept.some(a => s.includes(fold(a))); }

  /* ================= Fakten & Zitate ================= */
  const FACTS = [
    "Ein Tag auf der Venus dauert länger als ein Jahr auf der Venus.", "Oktopusse haben drei Herzen und blaues Blut.", "Honig verdirbt nicht. Man hat in ägyptischen Gräbern über 3.000 Jahre alten, essbaren Honig gefunden.",
    "Bananen sind botanisch gesehen Beeren, Erdbeeren dagegen nicht.", "Das menschliche Gehirn verbraucht etwa 20 Prozent der Energie des Körpers, obwohl es nur rund 2 Prozent des Gewichts ausmacht.",
    "Der Eiffelturm ist im Sommer bis zu 15 Zentimeter höher, weil sich das Metall in der Wärme ausdehnt.", "Haie gab es schon, bevor es Bäume gab.",
    "Ein Blitz ist etwa fünfmal heißer als die Oberfläche der Sonne.", "Der Ozean ist zu über 80 Prozent noch nicht kartiert.", "Kühe haben beste Freundinnen und sind gestresst, wenn man sie trennt.",
    "Die kürzeste Zeitspanne zwischen zwei Herzschlägen liegt bei Kolibris unter 0,1 Sekunden.", "Der Mount Everest wächst jedes Jahr um einige Millimeter.",
    "Es gibt mehr mögliche Schachpartien als Atome im beobachtbaren Universum.", "Wombats produzieren würfelförmigen Kot.", "Licht von der Sonne braucht etwa acht Minuten bis zur Erde.",
    "In der Schweiz ist es verboten, nur ein einzelnes Meerschweinchen zu halten, weil sie soziale Tiere sind.", "Ein Drittel unseres Lebens verbringen wir mit Schlafen.",
    "Die Chinesische Mauer ist mit bloßem Auge vom Weltraum aus nicht zu sehen, das ist ein Mythos.", "Die Erde dreht sich am Äquator mit rund 1.670 Kilometern pro Stunde.",
    "Das erste Produkt, das mit einem Barcode gescannt wurde, war 1974 eine Packung Kaugummi."
  ];
  const QUOTES = [
    ["Der beste Weg, die Zukunft vorherzusagen, ist, sie zu gestalten.", "Peter Drucker"], ["Erfolg ist nicht endgültig, Misserfolg ist nicht fatal. Was zählt, ist der Mut weiterzumachen.", "Winston Churchill"],
    ["Es ist nicht wenig Zeit, die wir haben, sondern es ist viel Zeit, die wir nicht nutzen.", "Seneca"], ["Wer immer tut, was er schon kann, bleibt immer das, was er schon ist.", "Henry Ford"],
    ["Fang nie an aufzuhören, hör nie auf anzufangen.", "Cicero"], ["Disziplin ist die Brücke zwischen Zielen und Erfolg.", "Jim Rohn"], ["Das Geheimnis des Vorankommens ist das Anfangen.", "Mark Twain"],
    ["Qualität bedeutet, es richtig zu machen, wenn niemand hinsieht.", "Henry Ford"], ["Man muss das Unmögliche versuchen, um das Mögliche zu erreichen.", "Hermann Hesse"],
    ["Wer kämpft, kann verlieren. Wer nicht kämpft, hat schon verloren.", "Bertolt Brecht"], ["Gib jedem Tag die Chance, der schönste deines Lebens zu werden.", "Mark Twain"],
    ["Mut steht am Anfang des Handelns, Glück am Ende.", "Demokrit"], ["Kleine Schritte jeden Tag führen zu großen Ergebnissen.", "Unbekannt"]
  ];

  const api = { convert, findUnit, findCurrency, LANG, LANGNAME, BCP, solve, element, PT, formula, glossary, namedDate, daysBetween, isoWeek, QUIZ, checkAnswer, FACTS, QUOTES, fold };
  root.MakhoKnow = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
