/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/query', 'N/file'],
    /**
 * @param{email} email
 * @param{query} query
     * @param{file} file
 */
    (email, query, file) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
                const sql =    `SELECT
                                    t.id,
                                    t.tranid,
                                    t.trandate,
                                    BUILTIN.DF(t.entity) AS customer_name,
                                    t.email,
                                    c.phone,
                                    BUILTIN.DF(t.status) AS status_name,
                                    t.foreigntotal
                                FROM
                                    transaction t
                                        LEFT JOIN customer c
                                                  ON t.entity = c.id
                                WHERE
                                    t.type = 'SalesOrd'
                                  AND t.status = 'SalesOrd:B'
                                ORDER BY
                                    t.trandate DESC`;

            let QueryResult = [] ;

            try{
                QueryResult = query.runSuiteQL({query: sql}).asMappedResults();
               log.debug('Query Result: ', QueryResult);
            }catch (e) {
                log.debug('Error in Query Try block', e)
            }
            log.debug('Data Length: ', QueryResult.length);
            let csvContent = 'id, tranid, trandate, customer_name, email, phone, status_name, foreigntotal\n';

            QueryResult.forEach((item) => {
                csvContent += `${item.id}, ${item.tranid}, ${item.trandate}, ${item.customer_name}, ${item.email}, ${item.phone}, ${item.status_name}, ${item.foreigntotal}\n`
            })

            const F = file.create({
                name: 'Sales Order Pending Fullfillment Data ',
                contents: csvContent,
                folder: 137,
                fileType: file.Type.CSV,
            })

            const fileId = F.save();
            log.debug('CSV created: ', fileId);

            try {

                email.send({
                    author: 1670 ,
                    recipients: 'pravinjadhav32322@gmail.com',
                    subject: 'Sales Order Pending Fullfillment Data ',
                    body: `QueryResult:  ${QueryResult} `,
                    attachments: [F],
                })
                log.debug('Email sent: ' + email)
            }catch (e) {
                log.debug({
                    title: 'Email Error...!',
                    details: e.message,
                })
            }
        }
        return {execute}
    });
