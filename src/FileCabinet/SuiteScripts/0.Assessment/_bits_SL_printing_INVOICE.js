/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/query', 'N/render', 'N/file'], (record, query, render, file) => {

    const onRequest = (scriptContext) => {
        if (scriptContext.request.method === 'GET') {
            const SoId = scriptContext.request.parameters.id;

            if (!SoId) {
                scriptContext.response.write('Missing Salesorder ID.');
                return;
            }

            // Load parent record
            const salesRecord = record.load({
                type: record.Type.SALES_ORDER,
                id: SoId
            });

            // Query child records
            const sqlQuery = ` SELECT 
         custrecord_bits_so_phone as phone,
         custrecord_bits_so_email as email,
         custrecord_bits_address as address
          FROM 
            customrecord_bits_so_reference 
          WHERE 
            custrecord_bits_so_ref_id = ${SoId}`;
              
            const childResults = query.runSuiteQL({ query: sqlQuery }).asMappedResults();

            log.debug('JSON Data:', childResults);

            log.debug('Child Records', JSON.stringify(childResults));

            // Load FTL template file from File Cabinet
            const templateFile = file.load({
                id: 9391  //FTL/html  File Id
            });

            const renderer = render.create();
            renderer.templateContent = templateFile.getContents();

            renderer.addRecord({
                templateName: 'record',
                record: salesRecord
            })

            renderer.addCustomDataSource({
                alias: 'so_Reference',
                format: render.DataSource.OBJECT,
                data: { lines: childResults }
            });
        
           

            // Render and return the PDF
            const pdfFile = renderer.renderAsPdf();
            scriptContext.response.writeFile(pdfFile, true);
        }
    
    };

    return {
         onRequest
         };
        
});
