
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Name
*/
define([
    'N/record',
    'N/search', 'N/log',
],
    (record, search, log) => {
        /**
             * Defines the function definition that is executed before record is loaded.
             * @param {Object} scriptContext
             * @param {Record} scriptContext.newRecord - New record
             * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
             * @param {Form} scriptContext.form - Current form
             * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
             * @since 2015.2
             */
        const beforeLoad = (scriptContext) => {

                if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                    scriptContext.form.clientScriptModulePath ='SuiteScripts/ITR SCRIPTS/client Scripts/bits cs attch to suitelet.js'; 
                        scriptContext.form.addButton({
                        id: 'custpage_bits_open_suitelet',
                        label: 'Open Suitelet',
                        functionName: 'openSuitletButtonClick()'
                    });


                }


        };
        /**
               * Defines the function definition that is executed before record is submitted.
               * @param {Object} scriptContext
               * @param {Record} scriptContext.newRecord - New record
               * @param {Record} scriptContext.oldRecord - Old record
               * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
               * @since 2015.2
               */
        const beforeSubmit = (scriptContext) => {
            const newRecord = scriptContext.newRecord;
        };
        /*
               * Defines the function definition that is executed after record is submitted.
               * @param {Object} scriptContext
               * @param {Record} scriptContext.newRecord - New record
               * @param {Record} scriptContext.oldRecord - Old record
               * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
               * @since 2015.2
               */
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                const purchaseOrder = scriptContext.newRecord;

                //for Vendor Name
                const vendorId = purchaseOrder.getValue({
                    fieldId: 'entity'
                })

                var vendorName = search.lookupFields({
                    type: search.Type.VENDOR,
                    id: vendorId,
                    columns: ['entityid']
                });
                log.debug('vendorName',vendorName);
               const vendorValue = vendorName.entityid;

                log.debug("Name: " + vendorName.entityid);
                //For Location
                const locationId = purchaseOrder.getValue({
                    fieldId: 'location'
                })

                log.debug("Location: " + locationId);


                var locationValue = '';
                if (locationId) {

                    const location = search.lookupFields({
                        type: search.Type.LOCATION,
                        id: locationId,
                        columns: ['name']

                    })

                    locationValue = location.name;

                    log.debug("Location Name:" + locationValue)
                }

                //for currency

                const currencyId = purchaseOrder.getValue({
                    fieldId: 'currency'
                })

                var currencyValue = '';
                if (currencyId) {
                    const currency = search.lookupFields({
                        type: search.Type.CURRENCY,
                        id: currencyId,
                        columns: ['name']

                    })

                    currencyValue = currency.name;

                    log.debug("Currency: " + currencyValue)
                }



                //create custom purchase order record
                const customPurchaseRecord = record.create({
                    type: 'customrecord_bits_po_form',
                    isDynamic: true
                })


                if (vendorValue) {
                    customPurchaseRecord.setValue({
                        fieldId: 'name',
                        value: vendorValue
                    })
                }

                if (locationValue != '' && locationValue) {
                    customPurchaseRecord.setValue({
                        fieldId: 'custrecord_bits_location',
                        value: locationValue
                    })
                } else {
                    customPurchaseRecord.setValue({
                        fieldId: 'custrecord_bits_location',
                        value: 'Sangamner'
                    })
                }

                if (currencyValue != '' && currencyValue) {
                    customPurchaseRecord.setValue({
                        fieldId: 'custrecord_bits_currency',
                        value: currencyValue
                    })
                }

                try {
                    var customPurchaseId = customPurchaseRecord.save();
                    log.debug("Purchase Record Created Successfully:" + customPurchaseId);
                } catch (e) {

                    log.error(e);
                }

            }
        };
        return {
            beforeLoad,
           // beforeSubmit,
            //afterSubmit,
        };
    });