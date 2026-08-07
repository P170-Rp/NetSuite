/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/ui/serverWidget', 'N/format'],
    /**
     * @param{search} search
     * @param{serverWidget} serverWidget
     * @param{format} format
     */
    (search, serverWidget, format) => {
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

            // Date range fields
            const dateFromField = form.addField({
                id: 'custpage_datefrom',
                type: serverWidget.FieldType.DATE,
                label: 'Date From'
            });

            const dateToField = form.addField({
                id: 'custpage_dateto',
                type: serverWidget.FieldType.DATE,
                label: 'Date To'
            });

            form.addSubmitButton({
                label: 'Search'
            });

            // Determine search type up-front (even on GET) so we can label
            // the Date column correctly for the search that will run.
            const searchType = request.method === 'POST'
                ? (request.parameters.custpage_type || 'fulfilled')
                : 'fulfilled';

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
                label: searchType === 'pending' ? 'Sales Order Date' : 'Fulfillment Date'
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

            // POST method starts here.
            const customerId = request.parameters.custpage_customer;
            const dateFromRaw = request.parameters.custpage_datefrom;
            const dateToRaw = request.parameters.custpage_dateto;

            typeField.defaultValue = searchType;
            if (dateFromRaw) dateFromField.defaultValue = dateFromRaw;
            if (dateToRaw) dateToField.defaultValue = dateToRaw;

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

            // --- Get and validate the two dates ---
            let dateFrom = null;
            let dateTo = null;

            try {
                if (dateFromRaw) {
                    dateFrom = format.parse({ value: dateFromRaw, type: format.Type.DATE });
                }
                if (dateToRaw) {
                    dateTo = format.parse({ value: dateToRaw, type: format.Type.DATE });
                }
            } catch (e) {
                form.addPageInitMessage({
                    type: 'ERROR',
                    title: 'Invalid Date',
                    message: 'One of the dates entered is not valid. Please check the format and try again.'
                });
                response.writePage(form);
                return;
            }

            if (dateFrom && dateTo && dateFrom > dateTo) {
                form.addPageInitMessage({
                    type: 'ERROR',
                    title: 'Invalid Date Range',
                    message: '"Date From" cannot be later than "Date To".'
                });
                response.writePage(form);
                return;
            }

            // Convert the validated Date objects back into NetSuite-formatted
            // strings. The search filter API expects date filter values as
            // strings in NetSuite's expected format - reusing the raw
            // request string here is risky since it may not exactly match
            // what the filter engine expects, which can silently return
            // zero results instead of an error.
            let dateFromStr = null;
            let dateToStr = null;

            try {
                if (dateFrom) {
                    dateFromStr = format.format({ value: dateFrom, type: format.Type.DATE });
                }
                if (dateTo) {
                    dateToStr = format.format({ value: dateTo, type: format.Type.DATE });
                }
            } catch (e) {
                form.addPageInitMessage({
                    type: 'ERROR',
                    title: 'Date Formatting Error',
                    message: 'Unable to process the date range entered. Please re-enter the dates and try again.'
                });
                response.writePage(form);
                return;
            }

            // --- Build the base filters, then add the date range ---
            const filters = [];

            if (searchType === 'pending') {
                filters.push(['entity', 'anyof', customerId]);
                filters.push('AND');
                filters.push(['status', 'anyof', 'SalesOrd:B']); // Pending Fulfillment
            } else {
                filters.push(['createdfrom.entity', 'anyof', customerId]);
            }

            // Only return the header row of each transaction, not one row
            // per line item, to avoid duplicate rows in the sublist.
            filters.push('AND');
            filters.push(['mainline', 'is', 'T']);

            // NOTE: search filters expect date values as strings (the same
            // format NetSuite parsed them from), not JS Date objects.
            if (dateFromStr) {
                filters.push('AND');
                filters.push(['trandate', 'onorafter', dateFromStr]);
            }

            if (dateToStr) {
                filters.push('AND');
                filters.push(['trandate', 'onorbefore', dateToStr]);
            }

            // --- Create and run the search ---
            let fulfillmentSearch;
            let line = 0;

            try {
                if (searchType === 'pending') {
                    fulfillmentSearch = search.create({
                        type: search.Type.SALES_ORDER,
                        filters: filters,
                        columns: [
                            'tranid',
                            'trandate',
                            'statusref'
                        ]
                    });
                } else {
                    fulfillmentSearch = search.create({
                        type: search.Type.ITEM_FULFILLMENT,
                        filters: filters,
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

                fulfillmentSearch.run().each((result) => {
                    sublist.setSublistValue({
                        id: 'custpage_tranid',
                        line: line,
                        // NOTE: NetSuite's setSublistValue treats an empty
                        // string as a missing argument (SSS_MISSING_REQD_ARGUMENT),
                        // so a single space is used to render a blank cell
                        // for pending rows, which have no fulfillment number yet.
                        value: searchType === 'pending'
                            ? ' '
                            : (result.getValue('tranid') || ' ')
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
            } catch (e) {
                form.addPageInitMessage({
                    type: 'ERROR',
                    title: 'Search Failed',
                    message: 'An error occurred while searching: ' + (e.name ? e.name + ' - ' : '') + e.message
                });
                response.writePage(form);
                return;
            }

            if (line === 0) {
                let noResultsMsg = 'No item fulfillments were found for this customer.';
                if (dateFromStr || dateToStr) {
                    noResultsMsg += ' Date range searched: '
                        + (dateFromStr || 'earliest')
                        + ' to '
                        + (dateToStr || 'latest')
                        + '. If you expected results, check that the transaction dates fall within this range.';
                }
                form.addPageInitMessage({
                    type: 'INFORMATION',
                    title: 'No Results',
                    message: noResultsMsg
                });
            }

            response.writePage(form);
        };

        return { onRequest };
    });