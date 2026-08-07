/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/ui/serverWidget'],
    /**
     * @param{search} search
     * @param{serverWidget} serverWidget
     */
    (search, serverWidget) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const request = scriptContext.request;
            const response = scriptContext.response;

            const form = serverWidget.createForm({
                title: 'Customer Item Fulfillments'
            });

            const customerField = form.addField({
                id: 'custpage_customer',
                type: serverWidget.FieldType.SELECT,
                label: 'Customer',
                source: 'customer'
            });

            const typeField = form.addField({
                id: 'custpage_type',
                type: serverWidget.FieldType.SELECT,
                label: 'Search Type'
            });
            typeField.addSelectOption({ value: 'pending', text: 'Pending Fulfillment (Sales Orders)' });
            typeField.addSelectOption({ value: 'fulfilled', text: 'Item Fulfillments' });

            form.addSubmitButton({
                label: 'Search'
            });

            const sublist = form.addSublist({
                id: 'custpage_results',
                type: serverWidget.SublistType.LIST,
                label: 'Item Fulfillments'
            });

            sublist.addField({
                id: 'custpage_tranid',
                type: serverWidget.FieldType.TEXT,
                label: 'Fulfillment Number'
            });

            sublist.addField({
                id: 'custpage_trandate',
                type: serverWidget.FieldType.TEXT,
                label: 'Date'
            });

            sublist.addField({
                id: 'custpage_salesorder',
                type: serverWidget.FieldType.TEXT,
                label: 'Sales Order'
            });

            sublist.addField({
                id: 'custpage_status',
                type: serverWidget.FieldType.TEXT,
                label: 'Status'
            });

            if (request.method === 'GET') {
                response.writePage(form);
                return;
            }

            // POST method start form hear.
            const customerId = request.parameters.custpage_customer;

            if (!customerId) {
                form.addPageInitMessage({
                    type: 'WARNING',
                    title: 'No Customer Selected',
                    message: 'Please select a customer and try again.'
                });
                response.writePage(form);
                return;
            }

            customerField.defaultValue = customerId;

            const searchType = request.parameters.custpage_type || 'fulfilled';
            typeField.defaultValue = searchType;

            let fulfillmentSearch;

            if (searchType === 'pending') {
                // Sales orders that are still awaiting fulfillment
                fulfillmentSearch = search.create({
                    type: search.Type.SALES_ORDER,
                    filters: [
                        ['entity', 'anyof', customerId],
                        'AND',
                        ['status', 'anyof', 'SalesOrd:B'] // Pending Fulfillment
                    ],
                    columns: [
                        'tranid',
                        'trandate',
                        'statusref'
                    ]
                });
            } else {
                // Item fulfillments already created for this customer
                fulfillmentSearch = search.create({
                    type: search.Type.ITEM_FULFILLMENT,
                    filters: [
                        ['createdfrom.entity', 'anyof', customerId]
                    ],
                    columns: [
                        'tranid',
                        'trandate',
                        search.createColumn({
                            name: 'tranid',
                            join: 'createdFrom'
                        }),
                        'statusref'
                    ]
                });
            }


            let line = 0;

            fulfillmentSearch.run().each((result) => {
                sublist.setSublistValue({
                    id: 'custpage_tranid',
                    line: line,
                    value: result.getValue('tranid') || ''
                });

                sublist.setSublistValue({
                    id: 'custpage_trandate',
                    line: line,
                    value: result.getValue('trandate') || ''
                });

                sublist.setSublistValue({
                    id: 'custpage_salesorder',
                    line: line,
                    value: searchType === 'pending'
                        ? (result.getValue('tranid') || '')
                        : (result.getValue({ name: 'tranid', join: 'createdFrom' }) || '')
                });

                sublist.setSublistValue({
                    id: 'custpage_status',
                    line: line,
                    value: result.getText('statusref') || result.getValue('statusref') || ''
                });

                line++;
                return true;
            });

            if (line === 0) {
                form.addPageInitMessage({
                    type: 'INFORMATION',
                    title: 'No Results',
                    message: 'No item fulfillments were found for this customer.'
                });
            }

            response.writePage(form);
        };

        return { onRequest };
    });