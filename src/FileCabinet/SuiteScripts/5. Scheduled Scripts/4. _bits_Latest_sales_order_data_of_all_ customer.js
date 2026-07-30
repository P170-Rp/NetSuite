/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/query', 'N/file', 'N/email'],
    /**
     * @param {N/log} log
     * @param {N/query} query
     * @param {N/file} file
     * @param {N/email} email
     */
    (log, query, file, email) => {

        /**
         * Escapes HTML special characters.
         * @param {*} value
         * @returns {string}
         */
        const escapeHtml = (value) => {
            if (value === null || value === undefined) {
                return '';
            }

            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        /**
         * Builds the HTML email body.
         * @param {Array} results
         * @returns {string}
         */
        const buildEmailBody = (results) => {

            let rows = '';

            results.forEach((row, index) => {

                rows += `
                    <tr style="background-color:${index % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
                        <td style="padding:8px 12px;border:1px solid #ddd;">${index + 1}</td>
                        <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(row.customerName)}</td>
                        <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(row.email)}</td>
                        <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(row.phone)}</td>
                        <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(row.partner)}</td>
                    </tr>`;
            });

            return `
                <html>
                    <body style="font-family:Arial,sans-serif;color:#333;">
                        <div style="max-width:900px;margin:auto;">

                            <h2 style="color:#1a4d8f;border-bottom:2px solid #1a4d8f;padding-bottom:10px;">
                                Customers with Empty Comments
                            </h2>

                            <p>Hello Team,</p>

                            <p>
                                The following <b>${results.length}</b> customer(s) have an empty
                                <b>Comments</b> field while a Partner is assigned.
                                Please review and update them as required.
                            </p>

                            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                                <thead>
                                    <tr style="background:#1a4d8f;color:#fff;">
                                        <th style="padding:10px;border:1px solid #ddd;text-align:left;">#</th>
                                        <th style="padding:10px;border:1px solid #ddd;text-align:left;">Customer Name</th>
                                        <th style="padding:10px;border:1px solid #ddd;text-align:left;">Email</th>
                                        <th style="padding:10px;border:1px solid #ddd;text-align:left;">Phone</th>
                                        <th style="padding:10px;border:1px solid #ddd;text-align:left;">Partner</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>

                            <br/>

                            <p style="font-size:12px;color:#777;">
                                This email was generated automatically by a NetSuite Scheduled Script.
                            </p>

                        </div>
                    </body>
                </html>`;
        };

        /**
         * Scheduled Script Entry Point
         * @param {Object} scriptContext
         */
        const execute = (scriptContext) => {

            try {

                log.audit('Scheduled Script', 'Execution Started');

                const sql = `
                    SELECT
                        c.entityid            AS customerName,
                        c.email               AS email,
                        c.phone               AS phone,
                        BUILTIN.DF(c.partner) AS partner,
                        t.tranid              AS latestSalesOrder,
                        t.trandate            AS latestSalesOrderDate,
                        BUILTIN.DF(t.status)  AS latestSOStatus,
                        t.foreigntotal        AS latestSOAmount
                    FROM
                        customer c
                            LEFT JOIN
                        transaction t
                        ON c.id = t.entity
                    WHERE
                        t.id = (
                            SELECT MAX(t2.id)
                            FROM transaction t2
                            WHERE
                                t2.entity = c.id
                              AND t2.type = 'SalesOrd'
                        )
                    ORDER BY
                        c.entityid
                `;


                const results = query.runSuiteQL({
                    query: sql
                }).asMappedResults();
                log.debug('Customer details',results)

                log.audit('Customers Found', results.length);

                if (!results.length) {
                    log.audit('Scheduled Script', 'No matching customers found.');
                    return;
                }

                //--------------------------------------------------------------------------
                // Build CSV
                //--------------------------------------------------------------------------

                let csvContent =
                    'Customer Name,Email,Phone,Partner,Latest Sales Order,Latest Sales Order Date,Latest SO Status,Latest SO Amount\n';
                const csvEscape = (value) => {
                    return String(value ?? '').replace(/"/g, '""');
                };

                results.forEach((row) => {
                    csvContent += `"${csvEscape(row.customername)}","${csvEscape(row.email)}","${csvEscape(row.phone)}","${csvEscape(row.partner)}","${csvEscape(row.latestsalesorder)}","${csvEscape(row.latestsalesorderdate)}","${csvEscape(row.latestsostatus)}","${csvEscape(row.latestsoamount)}"\n`;
                });

                //----------------------------------------------------------------------
                // Save CSV
                //----------------------------------------------------------------------

                const csvFile = file.create({
                    name: `Customers_Empty_Comments_${Date.now()}.csv`,
                    fileType: file.Type.CSV,
                    contents: csvContent,
                    folder: 137
                });

                const fileId = csvFile.save();

                log.audit('CSV Saved', fileId);

                //----------------------------------------------------------------------
                // Send Email
                //----------------------------------------------------------------------

                const attachment = file.load({
                    id: fileId
                });

                email.send({
                    author: 19,
                    recipients: [
                        'pravinjadhav32322@gmail.com'
                    ],
                    subject: `Customers with Empty Comments (${results.length})`,
                    body: buildEmailBody(results),
                    attachments: [attachment]
                });

                log.audit(
                    'Email Sent',
                    `${results.length} customer(s) emailed successfully.`
                );

            } catch (e) {

                log.error({
                    title: 'Scheduled Script Error',
                    details: JSON.stringify({
                        name: e.name,
                        message: e.message,
                        stack: e.stack
                    })
                });

            }

        };

        return {
            execute
        };

    });