// 1. Customer 
/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/record', 'N/log', 'N/query', 'N/search', 'N/file', 'N/runtime'],
    (record, log, query, search, file, runtime) => {

        function getInputData() {
            const subsidiary = runtime.getCurrentScript().getParameter({ name: 'custscript1' });
            const sql = `
            select companyname, partner, email, phone , subsidiary
                from customer 
                where 
                subsidiary = ?
        `;

            try {
                const sqlResult = query.runSuiteQL({ query: sql, params: [subsidiary] }).asMappedResults();
                log.debug('sqlResult: ', sqlResult);
                return sqlResult;
            } catch (err) {
                log.error({
                    title: 'Error',
                    details: err
                });
            }
        }

        function map(context) {
            const data = JSON.parse(context.value);
            const key = data.subsidiary;

            const obj = {
                CompanyName: data.companyname,
                partner: data.partner,
                email: data.email,
                phone: data.phone,
                subsidiary: data.subsidiary,
            }

            context.write({
                key: key,
                value: JSON.stringify(obj)
            })
        }

        function reduce(context) {
            const key = context.key;

            log.debug('Resuce key: ', context.key);
            log.debug('Reduce values: ', context.values);

            let reducedData = null;

            context.values.forEach(value => {

                reducedData = JSON.parse(value);

            });
            
            const obj = {

                companyname: reducedData.CompanyName,
                partner: reducedData.partner,
                email: reducedData.email,
                phone: reducedData.phone,
                subsidiary: reducedData.subsidiary,
            }

            context.write({
                key: key,
                value: JSON.stringify(obj)
            })
        }

        function summarize(summary) {
            let csvData = "CompanyName, Partner, Email, Phone, Subsidiary \n";
            let subsidiary = runtime.getCurrentScript().getParameter({ name: 'custscript1' })

            summary.output.iterator().each((key, value) => {

                let Aline = JSON.parse(value);
                csvData += `"${Aline.companyname}", "${Aline.partner}", "${Aline.email}", "${Aline.phone}", "${Aline.subsidiary}"\n`;
                return true;

            })

            const csvFile = file.create({
                name: `Customer_Of_${subsidiary}.csv`,
                fileType: file.Type.CSV,
                content: csvData,
                folder: 135
            });

            const id = csvFile.save();

            log.debug('CsvFile Id: ', id);
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        }
    });
