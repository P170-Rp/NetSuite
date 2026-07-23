/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(
    [
        'N/ui/serverWidget',
        'N/record',
        'N/query',
        'N/redirect',
    ],
    (
        serverWidget,
        record,
        query,
        redirect,
    ) => {
        const onRequest = (scriptContext) => {
            const serverRequest = scriptContext.request;
            const serverResponse = scriptContext.response;
            const recId = scriptContext.request.parameters.recId;

            if (scriptContext.request.method === 'GET') {

                log.debug("Record Id :", recId);

                let form = serverWidget.createForm({
                    title: 'SO Reference Form'
                });


                //form.clientScriptModulePath = 'SuiteScripts/bits_cs_po_suitelet_attach.js'; // attach client script to suitelet form
                const sqlQuery = `select
                entity
                from
                transaction so
                where
                so.id=${recId}`;

                const queryData = query.runSuiteQL({ query: sqlQuery }).asMappedResults();
                log.debug('queryData', queryData);

                var customerName = form.addField({
                    id: 'custpage_customer_name',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Customer Name',
                    source: 'customer'
                }).defaultValue = queryData[0].entity || '';

                var Phone = form.addField({
                    id: 'custpage_phone',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Phone',
                });
                var email = form.addField({
                    id: 'custpage_email',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Email',
                });
                var address = form.addField({
                    id: 'custpage_addrss',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Address',
                });
                var soId = form.addField({
                    id: 'custpage_soid',
                    type: serverWidget.FieldType.SELECT,
                    label: 'SO ID',
                    source: 'Transaction'
                });

                form.addButton({
                    id: 'bits_cancel',
                    label: 'cancel',
                    functionName: `closeForm()`,
                });
                form.addSubmitButton({
                    label: 'Submit'
                });

                scriptContext.response.writePage(form);


            } else {


                var custName = scriptContext.request.parameters.custpage_customer_name || '';
                var phone = scriptContext.request.parameters.custpage_phone || '';
                var email = scriptContext.request.parameters.custpage_email || '';
                var address = scriptContext.request.parameters.custpage_addrss || '';


                var soReferenceRecord = record.create
                    ({
                        type: 'customrecord_bits_so_reference',
                        isDynamic: true
                    });
                soReferenceRecord.setValue({
                    fieldId: 'name',
                    value: custName
                });
                soReferenceRecord.setValue({
                    fieldId: 'custrecord_bits_so_cust_name',
                    value: custName
                });
                soReferenceRecord.setValue({
                    fieldId: 'custrecord_bits_so_phone',
                    value: phone
                });
                soReferenceRecord.setValue({
                    fieldId: 'custrecord_bits_so_email',
                    value: email
                });
                soReferenceRecord.setValue({
                    fieldId: 'custrecord_bits_so_address',
                    value: address
                });
                soReferenceRecord.setValue({
                    fieldId: 'custrecord_bits_so_ref_id',
                    value: recId
                });

                var recordId = soReferenceRecord.save();
                log.debug("Record ID", recordId);


                redirect.toRecord({
                    type: 'customrecord_bits_so_reference',
                    id: recordId,
                });
            }
        }

        return {
            onRequest
        }
    });