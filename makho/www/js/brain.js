/* Makho – KI-Gehirn (Claude). Optional: aktiv, sobald ein eigener API-Schlüssel gespeichert ist.
   Beantwortet freie Fragen aus allen Bereichen, nutzt bei Bedarf die Websuche und merkt sich das Gespräch. */
(function (root) {
  "use strict";
  const MODEL = "claude-opus-5-5";
  const KEY_STORE = "makho.claudeKey";

  const SYSTEM = [
    "Du bist Makho, ein persönlicher Sprachassistent auf einem Android-Handy. Alles, was du schreibst, wird laut vorgelesen.",
    "",
    "Ton: Deutsch, du-Form, natürlich, freundlich und kompetent, gern mit einer Prise trockenem Humor. Keine Anreden wie Master oder Chef, keine Floskeln wie 'Gute Frage'.",
    "",
    "Format jeder Antwort:",
    "Zeile 1: '# ' gefolgt von einem kurzen Titel mit zwei bis fünf Wörtern.",
    "Danach die Antwort als gesprochener Fließtext. Kein Markdown, keine Aufzählungszeichen, keine Tabellen, keine Emojis, keine Links oder Quellenangaben im Text.",
    "Standardlänge: zwei bis fünf Sätze, das Wichtigste zuerst. Ausführlicher nur, wenn ausdrücklich nach einer Erklärung, Schritten, einer Anleitung oder Details gefragt wird; dann gut gegliedert in kurzen Absätzen, höchstens etwa 220 Wörter.",
    "Schreib Zahlen und Einheiten so, dass sie gut vorgelesen werden: '3 Prozent' statt '3 %', '5 Euro' statt '5 €', Formeln in Worten ('a Quadrat plus b Quadrat').",
    "",
    "Wissen: Du hilfst bei allem, von Schulstoff (Mathe, Physik, Chemie, Biologie, Geschichte, Deutsch, Englisch, Erdkunde, Politik) über Studium und Ausbildung bis zu Business (BWL, Gründung, Marketing, Vertrieb, Finanzen, Steuern, Recht in Grundzügen, E-Commerce und Resale), Technik, Programmieren, Gesundheit, Kochen und Alltag.",
    "Rechne Aufgaben sorgfältig und nenne das Ergebnis klar. Erkläre schrittweise, wenn jemand lernen will.",
    "Für aktuelle Ereignisse, Preise, Kurse, Sportergebnisse, Öffnungszeiten oder alles, was sich seit deinem Wissensstand geändert haben kann, nutze die Websuche.",
    "Wenn du etwas nicht sicher weißt, sag das offen, statt zu raten. Bei Gesundheit, Recht und Geld gib hilfreiche allgemeine Informationen und rate bei wichtigen Entscheidungen zu Fachleuten.",
    "Wenn eine Frage mehrdeutig ist, beantworte die wahrscheinlichste Deutung und biete kurz die andere an.",
    "Am Ende jeder Nutzernachricht steht ein Kontextblock in eckigen Klammern (Datum, Uhrzeit, Ort, Name). Nutze ihn, wenn er relevant ist, und erwähne ihn sonst nicht."
  ].join("\n");

  let client = null;
  let history = [];
  const MAX_TURNS = 14;

  function key() { try { return localStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; } }
  function makeClient() {
    const k = key();
    if (!k || !root.Anthropic) { client = null; return null; }
    client = new root.Anthropic({ apiKey: k, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 60000 });
    return client;
  }

  function parse(text) {
    let t = String(text || "").trim();
    let title = "";
    const m = t.match(/^#\s*(.+)\n+/);
    if (m) { title = m[1].trim(); t = t.slice(m[0].length).trim(); }
    t = t.replace(/\*\*|__|`/g, "").replace(/^\s*[-*•]\s+/gm, "").replace(/^#+\s*/gm, "").replace(/\[(\d+|[^\]]{0,3})\]/g, "").replace(/https?:\/\/\S+/g, "").trim();
    return { title, text: t };
  }

  const Brain = {
    MODEL,
    get ready() { return !!(key() && root.Anthropic); },
    setKey(k) { try { if (k) localStorage.setItem(KEY_STORE, k.trim()); else localStorage.removeItem(KEY_STORE); } catch (e) {} client = null; history = []; },
    hasKey() { return !!key(); },
    reset() { history = []; },
    /** Stellt eine Frage. Gibt { title, text, searched } zurück oder wirft { code, message }. */
    async ask(question, ctx = {}) {
      const c = client || makeClient();
      if (!c) throw { code: "no_key", message: "Kein API-Schlüssel" };
      if (history.length >= MAX_TURNS * 2) history = []; // neues Gespräch statt Verlauf zu kürzen
      const context = `[${ctx.date || ""}${ctx.city ? ", Ort: " + ctx.city : ""}${ctx.name ? ", Name: " + ctx.name : ""}]`;
      const turn = { role: "user", content: `${question}\n\n${context}` };
      const messages = history.concat([turn]);
      let searched = false;
      let response;
      try {
        for (let round = 0; round < 4; round++) {
          response = await c.beta.messages.create({
            model: MODEL,
            max_tokens: 4000,
            system: SYSTEM,
            cache_control: { type: "ephemeral" },
            thinking: { type: "adaptive", block_binding: { prefix_mismatch_behavior: "drop_block" } },
            output_config: { effort: "low" },
            tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3, user_location: { type: "approximate", country: "DE", city: ctx.city || undefined, timezone: "Europe/Berlin" } }],
            betas: ["server-side-fallback-2026-07-01", "thinking-binding-controls-2026-08-01"],
            fallbacks: "default",
            messages
          });
          if (response.content.some(b => b.type === "server_tool_use" || b.type === "web_search_tool_result")) searched = true;
          if (response.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: response.content }); continue; }
          break;
        }
      } catch (e) {
        const A = root.Anthropic;
        if (A && e instanceof A.AuthenticationError) throw { code: "auth", message: e.message };
        if (A && e instanceof A.PermissionDeniedError) throw { code: "auth", message: e.message };
        if (A && e instanceof A.RateLimitError) throw { code: "rate", message: e.message };
        if (A && e instanceof A.BadRequestError) { history = []; throw { code: "bad", message: e.message }; }
        if (A && e instanceof A.APIConnectionError) throw { code: "net", message: e.message };
        if (A && e instanceof A.APIError) throw { code: "api", message: e.message };
        throw { code: "net", message: String(e && e.message || e) };
      }
      if (response.stop_reason === "refusal") { history = []; return { title: "", text: "Dabei kann ich dir leider nicht helfen.", searched }; }
      const text = response.content.filter(b => b.type === "text").map(b => b.text).join("");
      // Verlauf nur anhängen, nie umschreiben
      history = messages.concat([{ role: "assistant", content: response.content }]);
      const out = parse(text);
      if (response.stop_reason === "max_tokens") out.text += " … Den Rest erspare ich dir, frag gern nach.";
      return Object.assign(out, { searched });
    }
  };
  root.MakhoBrain = Brain;
})(window);
