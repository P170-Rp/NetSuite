/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query', 'N/record', 'N/render', 'N/runtime', 'N/file'],
    /**
 * @param{query} query
 * @param{record} record
 * @param{render} render
 * @param{runtime} runtime
     * @param{file} file
 */
    (query, record, render, runtime, file) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            if(scriptContext.request.method === 'GET'){

                // const soId = runtime.getCurrentScript().getParameter({name:'custscript6'});
                // log.debug('soid',soId);


                const soId = scriptContext.request.parameters.custscript6;
                log.debug('soid', soId);

                if (!soId) {
                    scriptContext.response.write('Missing record id');
                    return;
                }


                const rec = record.load({
                    type: record.Type.SALES_ORDER,
                    id: soId,
                })

                const tamplatefile = file.load({
                    id: 3438 ,
                })
                const renderer = render.create();
                renderer.templateContent = tamplatefile.getContents();

                renderer.addRecord({
                    templateName: 'record',
                    record: rec,
                });

                const pdfFile = renderer.renderAsPdf();

                scriptContext.response.writeFile(pdfFile, true);

            }


        }

        return {onRequest}

    });
