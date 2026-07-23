/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/redirect', 'N/query', 'N/log', 'N/format'],
    (serverWidget, record, redirect, query, log, format) => {

        const RECORD_TYPE = 'customrecord117';

        const onRequest = (context) => {
            if (context.request.method === 'GET') {
                handleGet(context);
            } else {
                handlePost(context);
            }
        };

        const handleGet = (context) => {
            const recId = context.request.parameters.recId;
            const entityId = context.request.parameters.entityId;

            const form = serverWidget.createForm({
                title: 'Customer Analysis Page 360'
            });

            let queryData;

            try {
                const Nsql = `select
                        entity as entityid,
                        BUILTIN.DF(entity) as entity,
                        BUILTIN.DF(subsidiary) as subsidiary,
                        BUILTIN.DF(location) as location,
                        BUILTIN.DF(department) as department,
                        BUILTIN.DF(currency) as currency,
                        trandate,
                        memo
                      from transaction
                      where id = ?`;

                queryData = query.runSuiteQL({
                    query: Nsql,
                    params: [recId]
                }).asMappedResults();

            } catch (e) {
                log.error('Full query failed, retrying without subsidiary/currency', e);

                const fallbackSql = `select
                        entity as entityid,
                        BUILTIN.DF(entity) as entity,
                        BUILTIN.DF(location) as location,
                        BUILTIN.DF(department) as department,
                        trandate,
                        memo
                      from transaction
                      where id = ?`;

                queryData = query.runSuiteQL({
                    query: fallbackSql,
                    params: [recId]
                }).asMappedResults();
            }

            if (!queryData || queryData.length === 0) {
                form.addField({
                    label: 'Error',
                    id: 'custpage_error',
                    type: serverWidget.FieldType.INLINEHTML
                }).defaultValue = 'No transaction found for ID ' + recId;
                context.response.writePage(form);
                return;
            }

            const orderSql = `select sum(total) as ordertotal
                       from transaction
                       where type = 'SalesOrd'
                       and entity = ?`;

            const orderData = query.runSuiteQL({
                query: orderSql,
                params: [entityId]
            }).asMappedResults();



            form.addField({
                label: 'Internal ID',
                id: 'custpage_internal_id',
                type: serverWidget.FieldType.INTEGER
            }).defaultValue = recId || ''

            form.addField({
                label: 'Customer Name',
                id: 'custpage_cust_name',
                type: serverWidget.FieldType.TEXT
            }).defaultValue = queryData[0].entity || '';

            form.addField({
                label: 'Date',
                id: 'custpage_date',
                type: serverWidget.FieldType.DATE
            }).defaultValue = queryData[0].trandate || '';

            form.addField({
                label: 'Subsidiary',
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.TEXT
            }).defaultValue = queryData[0].subsidiary || '';

            form.addField({
                label: 'Location',
                id: 'custpage_location',
                type: serverWidget.FieldType.TEXT
            }).defaultValue = queryData[0].location || '';

            form.addField({
                label: 'Department',
                id: 'custpage_department',
                type: serverWidget.FieldType.TEXT
            }).defaultValue = queryData[0].department || '';

            form.addField({
                label: 'Currency',
                id: 'custpage_currency',
                type: serverWidget.FieldType.TEXT
            }).defaultValue = queryData[0].currency || '';

            form.addField({
                label: 'Total Order',
                id: 'custpage_total_order',
                type: serverWidget.FieldType.FLOAT
            }).defaultValue = orderData[0].ordertotal || '';

            form.addField({
                label: 'Memo',
                id: 'custpage_memo',
                type: serverWidget.FieldType.TEXTAREA
            }).defaultValue = queryData[0].memo || '';

            form.addField({
                label: 'Sales rep',
                id: 'custpage_sales_rep',
                type: serverWidget.FieldType.TEXT
            });

            form.addField({
                label: 'So Number',
                id: 'custpage_so_number',
                type: serverWidget.FieldType.TEXT
            });

            form.addSubmitButton({
                label: 'Submit'
            });

            context.response.writePage(form);
        };

        const handlePost = (context) => {
            const p = context.request.parameters;

            const internalId = p.custpage_internal_id;
            const trnumber = p.custpage_transaction_number;
            const cust_name = p.custpage_cust_name;
            const date = p.custpage_date;
            const subsidiary = p.custpage_subsidiary;
            const location = p.custpage_location;
            const department = p.custpage_department;
            const currency = p.custpage_currency;
            const total_order = p.custpage_total_order;
            const memo = p.custpage_memo;
            const sales_rep = p.custpage_sales_rep;
            const so_number = p.custpage_so_number;

            try {
                const newRec = record.create({ type: 'customrecord_company_sub_branches_subchi' });

                newRec.setValue({ fieldId: 'custrecordcustpage_internal_id', value: internalId ? Number(internalId) : '' });
                newRec.setValue({ fieldId: 'custrecordcustpage_transaction_number', value: trnumber });
                newRec.setValue({ fieldId: 'custrecordcustpage_cust_name', value: cust_name });

                if (date) {
                    newRec.setValue({
                        fieldId: 'custrecordcustpage_date',
                        value: format.parse({ value: date, type: format.Type.DATE })
                    });
                }

                newRec.setValue({ fieldId: 'custrecordcustpage_subsidiary', value: subsidiary });
                newRec.setValue({ fieldId: 'custrecordcustpage_location', value: location });
                newRec.setValue({ fieldId: 'custrecordcustpage_department', value: department });
                newRec.setValue({ fieldId: 'custrecordcustpage_currency', value: currency });
                newRec.setValue({ fieldId: 'custrecordcustpage_total_order', value: total_order ? Number(total_order) : '' });
                newRec.setValue({ fieldId: 'custrecordcustpage_memo', value: memo });
                newRec.setValue({ fieldId: 'custrecordcustpage_sales_rep', value: sales_rep });
                newRec.setValue({ fieldId: 'custrecordcustpage_so_number', value: so_number });

                const interID = newRec.save();

                redirect.toRecord({
                    id: interID,
                    type: 'customrecord_company_sub_branches_subchi'
                });
            } catch (e) {
                log.error('Failed to save customrecord117', e);
                context.response.write('An error occurred while saving the record: ' + e.message);
            }
        };

        return {
            onRequest: onRequest
        };
    });