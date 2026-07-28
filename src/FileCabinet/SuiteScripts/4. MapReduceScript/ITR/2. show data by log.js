

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/query', 'N/runtime'], (query, runtime) => {


    const getInputData = () => {

        const script = runtime.getCurrentScript();

        const salesOrderCount = script.getParameter({ name: 'custscript_sales_order_count' })

        log.debug('SalesOrderCount', salesOrderCount);
        if (salesOrderCount) {
            const salesData = `SELECT
                                            TOP ${salesOrderCount} tr.id AS transaction_id,
                                            c.entityid                   AS customer      ,
                                            tr.status                    AS status        ,
                                            cs.name                      AS currency
                                    FROM
                                            transaction tr
                                    LEFT JOIN
                                            customer c
                                    ON
                                            tr.entity = c.id
                                    LEFT JOIN
                                            currency cs
                                    ON
                                            tr.currency = cs.id
                                    WHERE
                                            tr.type = 'SalesOrd'
                                    ORDER BY
                                            tr.id ASC`;

            return query.runSuiteQL({ query: salesData }).asMappedResults();

        }
        return [];
    };

    const map = (context) => {
        let data = JSON.parse(context.value);

        // Write status as key and customer name as value
        context.write({
            key: data.status,
            value: data.customer
        });
    };

    const reduce = (context) => {
        let status = context.key;
        let customers = context.values;

        log.debug("Reduce Stage", `Status: ${status}, Customers: ${customers.join(", ")}`);

        let Report = {
            Status: status,
            Customers: customers,
            Total_Customers: customers.length
        };

        log.audit("Sales Report", JSON.stringify(Report));
    };

    return {
        getInputData,
        map,
        reduce
    };
});
