/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 *
 * Simple SuiteQL Query Tool
 * --------------------------------
 * A lightweight Suitelet for running ad-hoc SuiteQL queries against your
 * NetSuite account from a single-page browser UI.
 *
 * Features:
 *   - Run any SuiteQL SELECT query
 *   - Paginated fetch (handles >4000/5000 row limits automatically)
 *   - Sortable, scrollable results table
 *   - Table view / JSON view toggle
 *   - Row / column count + execution time
 *   - Export results to CSV or PDF
 *   - Keyboard shortcut: Ctrl/Cmd + Enter to run
 *
 * Deployment:
 *   1. Upload this file to the File Cabinet (e.g. SuiteScripts/suiteql_query_tool.js)
 *   2. Create a Script record (Suitelet) pointing at this file
 *   3. Create a Script Deployment, set status to "Released", assign to the
 *      role(s)/employee(s) who should have access
 *   4. Open the deployment URL
 */

define(['N/query', 'N/log', 'N/render', 'N/https'], (query, log, render, https) => {

    const DEFAULT_PAGE_SIZE = 1000; // rows fetched per SuiteQL page via ROWNUM
    const PDF_ROW_LIMIT = 500;      // cap on rows rendered into a PDF (keeps render fast/reliable)

    // System prompt used to steer the AI toward valid, safe SuiteQL.
    const AI_SYSTEM_PROMPT =
        'You are a SuiteQL expert for Oracle NetSuite. Convert the user\'s plain-language ' +
        'request into a single valid SuiteQL SELECT query.\n\n' +
        'Rules:\n' +
        '- Output ONLY the SQL query, wrapped in a ```sql code block. No explanation text.\n' +
        '- Only generate SELECT (or WITH ... SELECT) statements. Never write/update/delete data.\n' +
        '- Use NetSuite internal table/column names (e.g. transaction, customer, transactionline, item, employee).\n' +
        '- Use BUILTIN.DF(fieldname) to get human-readable display values for reference fields (e.g. entity, item, status).\n' +
        '- SuiteQL has no LIMIT keyword — use "FETCH FIRST n ROWS ONLY" instead.\n' +
        '- String literals use single quotes. Common Transaction.type values: SalesOrd, CustInvc, PurchOrd, VendBill, CashSale, CustPymt, ItemRcpt, ItemShip.\n' +
        '- Format the query with clear line breaks and indentation.\n' +
        '- If the request is ambiguous, make a reasonable assumption and still return a working query.';

    const DEFAULT_QUERY = [
        'SELECT',
        '    id,',
        '    entityid,',
        '    companyname,',
        '    email',
        'FROM',
        '    customer',
        'WHERE',
        '    isinactive = \'F\'',
        'ORDER BY',
        '    companyname',
        'FETCH FIRST 100 ROWS ONLY'
    ].join('\n');

    // =========================================================================
    // ENTRY POINT
    // =========================================================================

    const onRequest = (context) => {
        if (context.request.method === 'POST') {
            handlePost(context);
        } else {
            handleGet(context);
        }
    };

    // =========================================================================
    // GET — render the page
    // =========================================================================

    function handleGet(context) {
        context.response.write(renderPage());
    }

    // =========================================================================
    // POST — routes to JSON query execution or PDF export
    // =========================================================================

    function handlePost(context) {
        let payload;
        try {
            payload = JSON.parse(context.request.body || '{}');
        } catch (e) {
            context.response.setHeader({ name: 'Content-Type', value: 'application/json' });
            context.response.write(JSON.stringify({ error: 'Invalid request body.' }));
            return;
        }

        if (payload.action === 'ai') {
            handleAiGenerate(context, payload);
            return;
        }

        const sql = (payload.query || '').trim();
        const validation = validateQuery(sql);

        if (payload.action === 'pdf') {
            handlePdfExport(context, sql, validation);
        } else {
            handleQueryExecute(context, sql, validation);
        }
    }

    /**
     * Calls the Anthropic API server-side (so the API key never touches
     * NetSuite logs via the URL, and CORS isn't an issue) and returns the
     * generated SuiteQL back to the browser.
     */
    function handleAiGenerate(context, payload) {
        context.response.setHeader({ name: 'Content-Type', value: 'application/json' });

        const prompt = (payload.prompt || '').trim();
        const apiKey = (payload.apiKey || '').trim();
        const model = (payload.model || 'claude-opus-4-8').trim();

        if (!prompt) {
            context.response.write(JSON.stringify({ error: 'Please describe the query you want.' }));
            return;
        }
        if (!apiKey) {
            context.response.write(JSON.stringify({ error: 'Missing API key. Add it in AI Settings first.' }));
            return;
        }

        try {
            const requestBody = {
                model: model,
                max_tokens: 1024,
                system: AI_SYSTEM_PROMPT,
                messages: [{ role: 'user', content: prompt }]
            };

            const response = https.post({
                url: 'https://capi.aerolink.lat/',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody)
            });

            let responseBody;
            try {
                responseBody = JSON.parse(response.body);
            } catch (parseErr) {
                log.error({ title: 'AI Generate - Non-JSON response', details: response.body });
                context.response.write(JSON.stringify({
                    error: 'Server returned a non-JSON response (HTTP ' + response.code + '). ' +
                        'First 200 chars: ' + String(response.body).slice(0, 200)
                }));
                return;
            }
            if (response.code !== 200) {
                const msg = (responseBody.error && responseBody.error.message) ||
                    ('AI request failed with status ' + response.code);
                context.response.write(JSON.stringify({ error: msg }));
                return;
            }

            const text = responseBody.content && responseBody.content[0]
                ? responseBody.content[0].text
                : '';
            const sql = extractSqlFromText(text);

            if (!sql) {
                context.response.write(JSON.stringify({
                    error: 'AI did not return a recognizable SQL query. Try rephrasing your request.'
                }));
                return;
            }

            context.response.write(JSON.stringify({ sql: sql }));
        } catch (e) {
            log.error({ title: 'AI Generate Error', details: e });
            context.response.write(JSON.stringify({ error: e.message || String(e) }));
        }
    }

    /**
     * Pulls SQL out of a ```sql ... ``` code block if present, otherwise
     * falls back to using the whole response text.
     */
    function extractSqlFromText(text) {
        if (!text) return '';
        const match = text.match(/```sql\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
        const sql = match ? match[1].trim() : text.trim();
        return sql;
    }

    /**
     * Basic guardrail: this tool is for read queries only.
     * Returns { ok: true } or { ok: false, message: '...' }.
     */
    function validateQuery(sql) {
        if (!sql) {
            return { ok: false, message: 'No query provided.' };
        }
        const firstWord = sql.split(/\s+/)[0].toUpperCase();
        if (firstWord !== 'SELECT' && firstWord !== 'WITH') {
            return { ok: false, message: 'Only SELECT (or WITH ... SELECT) queries are allowed.' };
        }
        return { ok: true };
    }

    function handleQueryExecute(context, sql, validation) {
        context.response.setHeader({ name: 'Content-Type', value: 'application/json' });

        if (!validation.ok) {
            context.response.write(JSON.stringify({ error: validation.message }));
            return;
        }

        const started = Date.now();

        try {
            const records = fetchAllPages(sql);
            const elapsedMs = Date.now() - started;
            const columns = records.length > 0
                ? Object.keys(records[0]).filter(c => c !== 'rn__')
                : [];

            // strip the internal row-number helper column if present
            const cleanRecords = records.map(r => {
                const { rn__, ...rest } = r;
                return rest;
            });

            context.response.write(JSON.stringify({
                columns,
                rows: cleanRecords,
                rowCount: cleanRecords.length,
                elapsedMs
            }));
        } catch (e) {
            log.error({ title: 'SuiteQL Query Error', details: e });
            context.response.write(JSON.stringify({
                error: e.message || String(e)
            }));
        }
    }

    /**
     * Runs the query (capped at PDF_ROW_LIMIT rows) and streams back a
     * rendered PDF file using N/render.
     */
    function handlePdfExport(context, sql, validation) {
        if (!validation.ok) {
            context.response.setHeader({ name: 'Content-Type', value: 'application/json' });
            context.response.write(JSON.stringify({ error: validation.message }));
            return;
        }

        try {
            const limitedSql =
                'SELECT * FROM (SELECT ROWNUM AS rn__, sub.* FROM (' + sql + ') sub) ' +
                'WHERE rn__ BETWEEN 1 AND ' + PDF_ROW_LIMIT;

            const rawRecords = query.runSuiteQL({ query: limitedSql }).asMappedResults();
            const records = rawRecords.map(r => {
                const { rn__, ...rest } = r;
                return rest;
            });
            const columns = records.length > 0 ? Object.keys(records[0]) : [];

            const pdfFile = buildPdf(sql, columns, records, rawRecords.length >= PDF_ROW_LIMIT);

            context.response.setHeader({ name: 'Content-Type', value: 'application/pdf' });
            context.response.setHeader({
                name: 'Content-Disposition',
                value: 'attachment; filename="suiteql-results.pdf"'
            });
            context.response.write(pdfFile.getContents());
        } catch (e) {
            log.error({ title: 'SuiteQL PDF Export Error', details: e });
            context.response.setHeader({ name: 'Content-Type', value: 'application/json' });
            context.response.write(JSON.stringify({ error: e.message || String(e) }));
        }
    }

    /**
     * Builds a simple landscape PDF table of the query results using
     * NetSuite's Advanced PDF (BFO renderer) via N/render.
     */
    function buildPdf(sql, columns, records, truncated) {
        const escapeXml = (v) => {
            if (v === null || v === undefined) return '';
            return String(v)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        };

        let headerCells = columns.map(c => '<th>' + escapeXml(c) + '</th>').join('');
        let bodyRows = records.map(row => {
            let cells = columns.map(c => '<td>' + escapeXml(row[c]) + '</td>').join('');
            return '<tr>' + cells + '</tr>';
        }).join('\n');

        const truncatedNote = truncated
            ? '<p class="note">Showing first ' + PDF_ROW_LIMIT + ' rows. Export CSV for the full result set.</p>'
            : '';

        const xml =
            '<?xml version="1.0"?>' +
            '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">' +
            '<pdf>' +
            '<head>' +
            '  <style type="text/css">' +
            '    body { font-family: sans-serif; font-size: 8pt; }' +
            '    h1 { font-size: 14pt; color: #1c2530; margin-bottom: 2pt; }' +
            '    .meta { color: #697586; font-size: 8pt; margin-bottom: 10pt; }' +
            '    .note { color: #b45309; font-size: 8pt; margin-top: 8pt; }' +
            '    table { width: 100%; border-collapse: collapse; }' +
            '    th { background-color: #eef1f5; border: 0.5pt solid #dfe3e8; padding: 4pt 6pt; text-align: left; font-weight: bold; }' +
            '    td { border: 0.5pt solid #eef0f2; padding: 4pt 6pt; }' +
            '    tr:nth-child(even) td { background-color: #fafbfc; }' +
            '  </style>' +
            '</head>' +
            '<body size="A4-landscape">' +
            '  <h1>SuiteQL Query Results</h1>' +
            '  <p class="meta">Generated: ' + escapeXml(new Date().toISOString()) + ' &#8226; Rows: ' + records.length + '</p>' +
            '  <table>' +
            '    <tr>' + headerCells + '</tr>' +
            '    ' + bodyRows +
            '  </table>' +
            '  ' + truncatedNote +
            '</body>' +
            '</pdf>';

        const renderer = render.create();
        renderer.templateContent = xml;
        return renderer.renderAsPdf();
    }

    /**
     * Fetches all rows for a query using ROWNUM-based pagination,
     * since N/query.runSuiteQL caps out at 4000/5000 rows per call.
     */
    function fetchAllPages(sql) {
        let allRows = [];
        let start = 1;
        let more = true;

        while (more) {
            const end = start + DEFAULT_PAGE_SIZE - 1;
            const pagedSql =
                'SELECT * FROM (SELECT ROWNUM AS rn__, sub.* FROM (' + sql + ') sub) ' +
                'WHERE rn__ BETWEEN ' + start + ' AND ' + end;

            const page = query.runSuiteQL({ query: pagedSql }).asMappedResults();
            allRows = allRows.concat(page);

            if (page.length < DEFAULT_PAGE_SIZE) {
                more = false;
            } else {
                start += DEFAULT_PAGE_SIZE;
            }

            // Safety valve so a runaway query can't hang the Suitelet forever.
            if (allRows.length >= 50000) {
                more = false;
            }
        }

        return allRows;
    }

    // =========================================================================
    // HTML / CSS / JS for the single-page UI
    // =========================================================================

    function renderPage() {
        return '<!DOCTYPE html>' +
            '<html lang="en">' +
            '<head>' +
            '<meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<title>SuiteQL Query Tool</title>' +
            '<style>' + getStyles() + '</style>' +
            '</head>' +
            '<body>' +
            '<div class="app">' +

            '  <header class="topbar">' +
            '    <div class="brand"><span class="dot"></span> SuiteQL Query Tool</div>' +
            '    <div class="topbar-actions">' +
            '      <button id="runBtn" class="btn btn-primary"><span class="icon">&#9654;</span> Run <span class="kbd">Ctrl+Enter</span></button>' +
            '      <button id="formatBtn" class="btn btn-ghost">Format</button>' +
            '      <button id="clearBtn" class="btn btn-ghost">Clear</button>' +
            '      <button id="aiSettingsBtn" class="btn btn-ghost btn-icon" title="AI settings">&#9881;</button>' +
            '    </div>' +
            '  </header>' +

            '  <section class="ai-bar">' +
            '    <span class="ai-bar-icon">&#10024;</span>' +
            '    <input id="aiPromptInput" type="text" class="ai-bar-input" ' +
            '      placeholder="Plain English/Hindi mein likhein — e.g. \'pichle 30 din ke sales orders customer naam ke sath\'">' +
            '    <button id="aiGenerateBtn" class="btn btn-primary btn-sm">Generate Query</button>' +
            '  </section>' +

            '  <div id="aiSettingsPanel" class="ai-settings-panel hidden">' +
            '    <div class="ai-settings-row">' +
            '      <label>Anthropic API Key</label>' +
            '      <input id="aiApiKeyInput" type="password" placeholder="sk-ant-...">' +
            '    </div>' +
            '    <div class="ai-settings-row">' +
            '      <label>Model</label>' +
            '      <select id="aiModelSelect">' +
            '        <option value="claude-sonnet-5">Claude Sonnet 5 (recommended)</option>' +
            '        <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (fastest)</option>' +
            '        <option value="claude-opus-4-8">Claude Opus 4.8 (most capable)</option>' +
            '      </select>' +
            '    </div>' +
            '    <div class="ai-settings-row ai-settings-actions">' +
            '      <span class="ai-settings-note">Key is stored only in your browser (localStorage) and sent directly to NetSuite for each request.</span>' +
            '      <button id="aiSettingsSaveBtn" class="btn btn-primary btn-sm">Save</button>' +
            '    </div>' +
            '  </div>' +

            '  <section class="editor-wrap">' +
            '    <textarea id="editor" spellcheck="false" placeholder="SELECT id, entityid, companyname FROM customer WHERE isinactive = \'F\' ORDER BY companyname">' + DEFAULT_QUERY + '</textarea>' +
            '  </section>' +

            '  <section class="results-wrap">' +
            '    <div class="results-toolbar">' +
            '      <div class="results-toolbar-left">' +
            '        <div id="statusText" class="status">Ready</div>' +
            '        <div class="view-toggle">' +
            '          <button id="viewTableBtn" class="view-toggle-btn active" data-view="table">Table</button>' +
            '          <button id="viewJsonBtn" class="view-toggle-btn" data-view="json">JSON</button>' +
            '        </div>' +
            '      </div>' +
            '      <div class="results-actions">' +
            '        <input id="filterBox" type="text" placeholder="Filter results..." class="filter-input">' +
            '        <button id="exportCsvBtn" class="btn btn-ghost btn-sm" disabled>Export CSV</button>' +
            '        <button id="exportPdfBtn" class="btn btn-ghost btn-sm" disabled>Export PDF</button>' +
            '      </div>' +
            '    </div>' +
            '    <div id="resultsContainer" class="results-container">' +
            '      <div class="empty-state">' +
            '        <div class="empty-icon">&#9776;</div>' +
            '        <div>Write a query above and click <strong>Run</strong></div>' +
            '      </div>' +
            '    </div>' +
            '  </section>' +

            '</div>' +

            '<script>' + getClientScript() + '</script>' +
            '</body>' +
            '</html>';
    }

    function getStyles() {
        return '' +
            ':root{' +
            '  --bg:#f4f6f8; --panel:#ffffff; --border:#dfe3e8; --text:#1c2530; --muted:#697586;' +
            '  --accent:#2563eb; --accent-dark:#1d4ed8; --danger:#dc2626; --success:#16a34a;' +
            '  --mono: "SF Mono", Menlo, Consolas, "Courier New", monospace;' +
            '  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;' +
            '}' +
            '*{box-sizing:border-box;}' +
            'html,body{height:100%;margin:0;padding:0;}' +
            'body{font-family:var(--sans);background:var(--bg);color:var(--text);font-size:14px;}' +
            '.app{display:flex;flex-direction:column;height:100vh;}' +

            '.topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;' +
            '  background:var(--panel);border-bottom:1px solid var(--border);flex-shrink:0;}' +
            '.brand{font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px;}' +
            '.dot{width:9px;height:9px;border-radius:50%;background:var(--accent);display:inline-block;}' +
            '.topbar-actions{display:flex;gap:8px;}' +

            '.btn{border:1px solid var(--border);background:var(--panel);color:var(--text);' +
            '  padding:7px 14px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;' +
            '  display:inline-flex;align-items:center;gap:6px;transition:all .12s ease;}' +
            '.btn:hover{background:var(--bg);}' +
            '.btn:disabled{opacity:.5;cursor:not-allowed;}' +
            '.btn-primary{background:var(--accent);border-color:var(--accent);color:#fff;}' +
            '.btn-primary:hover{background:var(--accent-dark);}' +
            '.btn-ghost{background:transparent;}' +
            '.btn-sm{padding:5px 10px;font-size:12px;}' +
            '.icon{font-size:11px;}' +
            '.kbd{font-size:10px;opacity:.7;background:rgba(0,0,0,.08);padding:1px 5px;border-radius:3px;' +
            '  margin-left:2px;}' +
            '.btn-primary .kbd{background:rgba(255,255,255,.2);}' +

            '.btn-icon{padding:7px 10px;}' +

            '.ai-bar{display:flex;align-items:center;gap:10px;padding:10px 16px;' +
            '  background:linear-gradient(135deg, rgba(37,99,235,.06), rgba(124,58,237,.06));' +
            '  border-bottom:1px solid var(--border);flex-shrink:0;}' +
            '.ai-bar-icon{font-size:15px;flex-shrink:0;}' +
            '.ai-bar-input{flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;' +
            '  font-size:13px;background:#fff;}' +
            '.ai-bar-input:focus{outline:none;border-color:var(--accent);' +
            '  box-shadow:0 0 0 3px rgba(37,99,235,.12);}' +

            '.ai-settings-panel{padding:14px 16px;background:#fff;border-bottom:1px solid var(--border);' +
            '  display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end;flex-shrink:0;}' +
            '.ai-settings-panel.hidden{display:none;}' +
            '.ai-settings-row{display:flex;flex-direction:column;gap:4px;}' +
            '.ai-settings-row label{font-size:11.5px;font-weight:700;color:var(--muted);' +
            '  text-transform:uppercase;letter-spacing:.4px;}' +
            '.ai-settings-row input,.ai-settings-row select{padding:7px 10px;border:1px solid var(--border);' +
            '  border-radius:6px;font-size:13px;min-width:220px;}' +
            '.ai-settings-actions{flex:1;flex-direction:row;align-items:center;justify-content:space-between;' +
            '  gap:12px;min-width:280px;}' +
            '.ai-settings-note{font-size:11.5px;color:var(--muted);max-width:420px;}' +

            '.editor-wrap{flex-shrink:0;border-bottom:1px solid var(--border);background:var(--panel);}' +
            '#editor{width:100%;min-height:170px;max-height:320px;resize:vertical;border:none;' +
            '  padding:14px 16px;font-family:var(--mono);font-size:13px;line-height:1.6;' +
            '  background:#fbfcfd;color:var(--text);outline:none;}' +

            '.results-wrap{flex:1;display:flex;flex-direction:column;min-height:0;}' +
            '.results-toolbar{display:flex;align-items:center;justify-content:space-between;' +
            '  padding:8px 16px;background:var(--panel);border-bottom:1px solid var(--border);flex-shrink:0;' +
            '  gap:16px;flex-wrap:wrap;}' +
            '.results-toolbar-left{display:flex;align-items:center;gap:14px;}' +
            '.status{font-size:12.5px;color:var(--muted);white-space:nowrap;}' +
            '.status.error{color:var(--danger);font-weight:600;}' +
            '.status.success{color:var(--success);}' +
            '.results-actions{display:flex;gap:8px;align-items:center;}' +
            '.filter-input{padding:6px 10px;border:1px solid var(--border);border-radius:6px;' +
            '  font-size:12.5px;width:200px;}' +

            '.view-toggle{display:flex;border:1px solid var(--border);border-radius:6px;overflow:hidden;}' +
            '.view-toggle-btn{border:none;background:var(--panel);color:var(--muted);padding:5px 12px;' +
            '  font-size:12px;font-weight:600;cursor:pointer;}' +
            '.view-toggle-btn:not(:last-child){border-right:1px solid var(--border);}' +
            '.view-toggle-btn:hover{background:var(--bg);}' +
            '.view-toggle-btn.active{background:var(--accent);color:#fff;}' +

            '.json-view{margin:0;padding:16px;font-family:var(--mono);font-size:12.5px;line-height:1.6;' +
            '  white-space:pre-wrap;word-break:break-word;color:var(--text);background:#fbfcfd;}' +
            '.json-key{color:#7c3aed;}' +
            '.json-string{color:#16a34a;}' +
            '.json-number{color:#2563eb;}' +
            '.json-null{color:#aab2bd;font-style:italic;}' +
            '.json-bool{color:#dc2626;}' +

            '.results-container{flex:1;overflow:auto;background:var(--panel);}' +
            'table.results{border-collapse:collapse;width:max-content;min-width:100%;font-size:12.5px;}' +
            'table.results thead th{position:sticky;top:0;background:#eef1f5;text-align:left;' +
            '  padding:8px 12px;font-weight:700;border-bottom:2px solid var(--border);white-space:nowrap;' +
            '  cursor:pointer;user-select:none;}' +
            'table.results thead th:hover{background:#e2e7ee;}' +
            'table.results thead th .arrow{opacity:.4;font-size:10px;margin-left:4px;}' +
            'table.results tbody td{padding:7px 12px;border-bottom:1px solid #eef0f2;white-space:nowrap;' +
            '  max-width:320px;overflow:hidden;text-overflow:ellipsis;}' +
            'table.results tbody tr:nth-child(even){background:#fafbfc;}' +
            'table.results tbody tr:hover{background:#eef4ff;}' +
            'table.results td.rownum{color:var(--muted);text-align:right;background:#f7f8fa;}' +
            '.null-val{color:#aab2bd;font-style:italic;}' +

            '.empty-state,.error-state{display:flex;flex-direction:column;align-items:center;' +
            '  justify-content:center;height:100%;color:var(--muted);gap:8px;padding:40px;text-align:center;}' +
            '.empty-icon{font-size:34px;opacity:.35;}' +
            '.error-state{color:var(--danger);}' +
            '.error-box{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;' +
            '  max-width:600px;font-family:var(--mono);font-size:12.5px;white-space:pre-wrap;text-align:left;}' +

            '.spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,.15);border-top-color:var(--accent);' +
            '  border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}' +
            '@keyframes spin{to{transform:rotate(360deg);}}' +
            '';
    }

    function getClientScript() {
        // Client script kept plain (no build step, no external deps) so the whole
        // tool works from a single file with zero setup.
        return '' +
            "const editor = document.getElementById('editor');" +
            "const runBtn = document.getElementById('runBtn');" +
            "const formatBtn = document.getElementById('formatBtn');" +
            "const clearBtn = document.getElementById('clearBtn');" +
            "const exportCsvBtn = document.getElementById('exportCsvBtn');" +
            "const exportPdfBtn = document.getElementById('exportPdfBtn');" +
            "const filterBox = document.getElementById('filterBox');" +
            "const statusText = document.getElementById('statusText');" +
            "const resultsContainer = document.getElementById('resultsContainer');" +
            "const viewTableBtn = document.getElementById('viewTableBtn');" +
            "const viewJsonBtn = document.getElementById('viewJsonBtn');" +
            "const aiSettingsBtn = document.getElementById('aiSettingsBtn');" +
            "const aiSettingsPanel = document.getElementById('aiSettingsPanel');" +
            "const aiApiKeyInput = document.getElementById('aiApiKeyInput');" +
            "const aiModelSelect = document.getElementById('aiModelSelect');" +
            "const aiSettingsSaveBtn = document.getElementById('aiSettingsSaveBtn');" +
            "const aiPromptInput = document.getElementById('aiPromptInput');" +
            "const aiGenerateBtn = document.getElementById('aiGenerateBtn');" +

            "const AI_SETTINGS_KEY = 'sqt_simple_ai_settings';" +

            "function loadAiSettings() {" +
            "  try {" +
            "    const raw = localStorage.getItem(AI_SETTINGS_KEY);" +
            "    return raw ? JSON.parse(raw) : { apiKey: '', model: 'claude-sonnet-5' };" +
            "  } catch (e) {" +
            "    return { apiKey: '', model: 'claude-sonnet-5' };" +
            "  }" +
            "}" +

            "function saveAiSettings() {" +
            "  const settings = { apiKey: aiApiKeyInput.value.trim(), model: aiModelSelect.value };" +
            "  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));" +
            "  aiSettingsPanel.classList.add('hidden');" +
            "  setStatus('AI settings saved.', 'success');" +
            "}" +

            "(function initAiSettings() {" +
            "  const settings = loadAiSettings();" +
            "  aiApiKeyInput.value = settings.apiKey || '';" +
            "  aiModelSelect.value = settings.model || 'claude-sonnet-5';" +
            "})();" +

            "let lastColumns = [];" +
            "let lastRows = [];" +
            "let currentView = 'table';" +
            "let sortState = { col: null, dir: 1 };" +

            "function setExportButtonsEnabled(enabled) {" +
            "  exportCsvBtn.disabled = !enabled;" +
            "  exportPdfBtn.disabled = !enabled;" +
            "}" +

            "function renderCurrent(rows) {" +
            "  if (currentView === 'json') {" +
            "    renderJson(lastColumns, rows);" +
            "  } else {" +
            "    renderTable(lastColumns, rows);" +
            "  }" +
            "}" +

            "function setView(view) {" +
            "  currentView = view;" +
            "  viewTableBtn.classList.toggle('active', view === 'table');" +
            "  viewJsonBtn.classList.toggle('active', view === 'json');" +
            "  renderCurrent(lastRows);" +
            "}" +

            "function setStatus(text, cls) {" +
            "  statusText.textContent = text;" +
            "  statusText.className = 'status' + (cls ? ' ' + cls : '');" +
            "}" +

            "function escapeHtml(v) {" +
            "  if (v === null || v === undefined) return '';" +
            "  return String(v)" +
            "    .replace(/&/g, '&amp;')" +
            "    .replace(/</g, '&lt;')" +
            "    .replace(/>/g, '&gt;');" +
            "}" +

            "async function runQuery() {" +
            "  const sql = editor.value.trim();" +
            "  if (!sql) { setStatus('Enter a query first.', 'error'); return; }" +

            "  runBtn.disabled = true;" +
            "  runBtn.innerHTML = '<span class=\"spinner\"></span> Running...';" +
            "  setStatus('Running query...');" +
            "  resultsContainer.innerHTML = '';" +

            "  const started = performance.now();" +
            "  try {" +
            "    const res = await fetch(window.location.href, {" +
            "      method: 'POST'," +
            "      headers: { 'Content-Type': 'application/json' }," +
            "      body: JSON.stringify({ query: sql })" +
            "    });" +
            "    const data = await res.json();" +

            "    if (data.error) {" +
            "      showError(data.error);" +
            "      setStatus('Query failed', 'error');" +
            "      setExportButtonsEnabled(false);" +
            "    } else {" +
            "      lastColumns = data.columns;" +
            "      lastRows = data.rows;" +
            "      sortState = { col: null, dir: 1 };" +
            "      renderCurrent(lastRows);" +
            "      const clientMs = Math.round(performance.now() - started);" +
            "      setStatus(data.rowCount + ' row' + (data.rowCount === 1 ? '' : 's') + ' \\u00b7 ' + data.elapsedMs + 'ms server / ' + clientMs + 'ms total', 'success');" +
            "      setExportButtonsEnabled(data.rowCount > 0);" +
            "    }" +
            "  } catch (e) {" +
            "    showError('Request failed: ' + e.message);" +
            "    setStatus('Query failed', 'error');" +
            "    setExportButtonsEnabled(false);" +
            "  } finally {" +
            "    runBtn.disabled = false;" +
            "    runBtn.innerHTML = '<span class=\"icon\">&#9654;</span> Run <span class=\"kbd\">Ctrl+Enter</span>';" +
            "  }" +
            "}" +

            "function showError(message) {" +
            "  resultsContainer.innerHTML = '<div class=\"error-state\">" +
            "    <div class=\"empty-icon\">&#9888;</div>" +
            "    <div>Query Error</div>" +
            "    <div class=\"error-box\">' + escapeHtml(message) + '</div>" +
            "  </div>';" +
            "}" +

            "function renderTable(columns, rows) {" +
            "  if (!rows || rows.length === 0) {" +
            "    resultsContainer.innerHTML = '<div class=\"empty-state\"><div class=\"empty-icon\">&#8709;</div><div>No rows returned</div></div>';" +
            "    return;" +
            "  }" +

            "  let html = '<table class=\"results\"><thead><tr><th style=\"width:44px;\">#</th>';" +
            "  columns.forEach(function (c) {" +
            "    const arrow = sortState.col === c ? (sortState.dir === 1 ? '\\u25B2' : '\\u25BC') : '';" +
            "    html += '<th data-col=\"' + escapeHtml(c) + '\">' + escapeHtml(c) + ' <span class=\"arrow\">' + arrow + '</span></th>';" +
            "  });" +
            "  html += '</tr></thead><tbody>';" +

            "  rows.forEach(function (row, i) {" +
            "    html += '<tr><td class=\"rownum\">' + (i + 1) + '</td>';" +
            "    columns.forEach(function (c) {" +
            "      const v = row[c];" +
            "      html += '<td>' + (v === null || v === undefined || v === '' ? '<span class=\"null-val\">null</span>' : escapeHtml(v)) + '</td>';" +
            "    });" +
            "    html += '</tr>';" +
            "  });" +
            "  html += '</tbody></table>';" +

            "  resultsContainer.innerHTML = html;" +

            "  resultsContainer.querySelectorAll('th[data-col]').forEach(function (th) {" +
            "    th.addEventListener('click', function () {" +
            "      const col = th.getAttribute('data-col');" +
            "      sortState.dir = (sortState.col === col) ? -sortState.dir : 1;" +
            "      sortState.col = col;" +
            "      const sorted = lastRows.slice().sort(function (a, b) {" +
            "        const av = a[col], bv = b[col];" +
            "        if (av === null || av === undefined) return 1;" +
            "        if (bv === null || bv === undefined) return -1;" +
            "        const an = parseFloat(av), bn = parseFloat(bv);" +
            "        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * sortState.dir;" +
            "        return String(av).localeCompare(String(bv)) * sortState.dir;" +
            "      });" +
            "      renderTable(lastColumns, sorted);" +
            "    });" +
            "  });" +
            "}" +

            "function renderJson(columns, rows) {" +
            "  if (!rows || rows.length === 0) {" +
            "    resultsContainer.innerHTML = '<div class=\"empty-state\"><div class=\"empty-icon\">&#8709;</div><div>No rows returned</div></div>';" +
            "    return;" +
            "  }" +
            "  const jsonString = JSON.stringify(rows, null, 2);" +
            "  resultsContainer.innerHTML = '<pre class=\"json-view\">' + highlightJson(jsonString) + '</pre>';" +
            "}" +

            "function highlightJson(jsonString) {" +
            "  const escaped = escapeHtml(jsonString);" +
            "  return escaped.replace(" +
            "    /(&quot;(?:\\\\.|[^\\\\&])*?&quot;)(\\s*:)?|\\b(true|false)\\b|\\bnull\\b|(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)/g," +
            "    function (match, str, colon, bool) {" +
            "      if (str) {" +
            "        const cls = colon ? 'json-key' : 'json-string';" +
            "        return '<span class=\"' + cls + '\">' + str + '</span>' + (colon || '');" +
            "      }" +
            "      if (bool) return '<span class=\"json-bool\">' + bool + '</span>';" +
            "      if (match === 'null') return '<span class=\"json-null\">null</span>';" +
            "      return '<span class=\"json-number\">' + match + '</span>';" +
            "    }" +
            "  );" +
            "}" +

            "function applyFilter() {" +
            "  const term = filterBox.value.toLowerCase().trim();" +
            "  if (!term) { renderCurrent(lastRows); return; }" +
            "  const filtered = lastRows.filter(function (row) {" +
            "    return lastColumns.some(function (c) {" +
            "      const v = row[c];" +
            "      return v !== null && v !== undefined && String(v).toLowerCase().indexOf(term) !== -1;" +
            "    });" +
            "  });" +
            "  renderCurrent(filtered);" +
            "}" +

            "function exportCsv() {" +
            "  if (!lastRows.length) return;" +
            "  const escape = function (v) {" +
            "    if (v === null || v === undefined) return '';" +
            "    const s = String(v).replace(/\"/g, '\"\"');" +
            "    return '\"' + s + '\"';" +
            "  };" +
            "  const lines = [lastColumns.map(escape).join(',')];" +
            "  lastRows.forEach(function (row) {" +
            "    lines.push(lastColumns.map(function (c) { return escape(row[c]); }).join(','));" +
            "  });" +
            "  const blob = new Blob([lines.join('\\n')], { type: 'text/csv' });" +
            "  const url = URL.createObjectURL(blob);" +
            "  const a = document.createElement('a');" +
            "  a.href = url;" +
            "  a.download = 'suiteql-results.csv';" +
            "  document.body.appendChild(a);" +
            "  a.click();" +
            "  document.body.removeChild(a);" +
            "  URL.revokeObjectURL(url);" +
            "}" +

            "async function exportPdf() {" +
            "  if (!lastRows.length) return;" +
            "  const originalLabel = exportPdfBtn.textContent;" +
            "  exportPdfBtn.disabled = true;" +
            "  exportPdfBtn.textContent = 'Generating...';" +
            "  try {" +
            "    const res = await fetch(window.location.href, {" +
            "      method: 'POST'," +
            "      headers: { 'Content-Type': 'application/json' }," +
            "      body: JSON.stringify({ query: editor.value.trim(), action: 'pdf' })" +
            "    });" +
            "    const contentType = res.headers.get('Content-Type') || '';" +
            "    if (contentType.indexOf('application/pdf') === -1) {" +
            "      const data = await res.json();" +
            "      setStatus(data.error || 'PDF export failed.', 'error');" +
            "      return;" +
            "    }" +
            "    const blob = await res.blob();" +
            "    const url = URL.createObjectURL(blob);" +
            "    const a = document.createElement('a');" +
            "    a.href = url;" +
            "    a.download = 'suiteql-results.pdf';" +
            "    document.body.appendChild(a);" +
            "    a.click();" +
            "    document.body.removeChild(a);" +
            "    URL.revokeObjectURL(url);" +
            "  } catch (e) {" +
            "    setStatus('PDF export failed: ' + e.message, 'error');" +
            "  } finally {" +
            "    exportPdfBtn.disabled = false;" +
            "    exportPdfBtn.textContent = originalLabel;" +
            "  }" +
            "}" +

            "function formatQuery() {" +
            "  let sql = editor.value.trim();" +
            "  if (!sql) return;" +
            "  const keywords = ['SELECT','FROM','WHERE','AND','OR','ORDER BY','GROUP BY','HAVING'," +
            "    'JOIN','LEFT JOIN','INNER JOIN','ON','FETCH FIRST','ROWS ONLY','AS','DISTINCT'];" +
            "  sql = sql.replace(/\\s+/g, ' ').trim();" +
            "  keywords.forEach(function (kw) {" +
            "    const re = new RegExp('\\\\b' + kw.replace(/ /g, '\\\\s+') + '\\\\b', 'gi');" +
            "    sql = sql.replace(re, '\\n' + kw.toUpperCase());" +
            "  });" +
            "  sql = sql.replace(/,\\s*/g, ',\\n    ').replace(/^\\n/, '');" +
            "  editor.value = sql.trim();" +
            "}" +

            "async function generateFromAi() {" +
            "  const prompt = aiPromptInput.value.trim();" +
            "  if (!prompt) { setStatus('Pehle apni requirement likhein.', 'error'); aiPromptInput.focus(); return; }" +

            "  const settings = loadAiSettings();" +
            "  if (!settings.apiKey) {" +
            "    setStatus('AI settings mein pehle apni API key add karein.', 'error');" +
            "    aiSettingsPanel.classList.remove('hidden');" +
            "    aiApiKeyInput.focus();" +
            "    return;" +
            "  }" +

            "  const originalLabel = aiGenerateBtn.textContent;" +
            "  aiGenerateBtn.disabled = true;" +
            "  aiGenerateBtn.innerHTML = '<span class=\"spinner\"></span> Generating...';" +
            "  setStatus('AI query bana raha hai...');" +

            "  try {" +
            "    const res = await fetch(window.location.href, {" +
            "      method: 'POST'," +
            "      headers: { 'Content-Type': 'application/json' }," +
            "      body: JSON.stringify({" +
            "        action: 'ai'," +
            "        prompt: prompt," +
            "        apiKey: settings.apiKey," +
            "        model: settings.model" +
            "      })" +
            "    });" +
            "    const data = await res.json();" +

            "    if (data.error) {" +
            "      setStatus(data.error, 'error');" +
            "    } else {" +
            "      editor.value = data.sql;" +
            "      setStatus('Query generate ho gayi \\u2014 review karke Run dabayein.', 'success');" +
            "      editor.focus();" +
            "    }" +
            "  } catch (e) {" +
            "    setStatus('AI request failed: ' + e.message, 'error');" +
            "  } finally {" +
            "    aiGenerateBtn.disabled = false;" +
            "    aiGenerateBtn.textContent = originalLabel;" +
            "  }" +
            "}" +

            "runBtn.addEventListener('click', runQuery);" +
            "formatBtn.addEventListener('click', formatQuery);" +
            "clearBtn.addEventListener('click', function () {" +
            "  editor.value = '';" +
            "  editor.focus();" +
            "});" +
            "exportCsvBtn.addEventListener('click', exportCsv);" +
            "exportPdfBtn.addEventListener('click', exportPdf);" +
            "viewTableBtn.addEventListener('click', function () { setView('table'); });" +
            "viewJsonBtn.addEventListener('click', function () { setView('json'); });" +
            "filterBox.addEventListener('input', applyFilter);" +
            "aiSettingsBtn.addEventListener('click', function () {" +
            "  aiSettingsPanel.classList.toggle('hidden');" +
            "});" +
            "aiSettingsSaveBtn.addEventListener('click', saveAiSettings);" +
            "aiGenerateBtn.addEventListener('click', generateFromAi);" +
            "aiPromptInput.addEventListener('keydown', function (e) {" +
            "  if (e.key === 'Enter') {" +
            "    e.preventDefault();" +
            "    generateFromAi();" +
            "  }" +
            "});" +
            "editor.addEventListener('keydown', function (e) {" +
            "  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {" +
            "    e.preventDefault();" +
            "    runQuery();" +
            "  }" +
            "});" +
            "";
    }

    return { onRequest };
});