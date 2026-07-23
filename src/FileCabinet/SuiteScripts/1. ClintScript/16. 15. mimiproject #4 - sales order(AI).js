// Sales Order - Strict Business Rules Client Script
// SuiteScript 2.1

/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/runtime', 'N/search', 'N/ui/dialog', 'N/ui/message', 'N/log'],
    (runtime, search, dialog, message, log) => {

        // Used to bypass the confirm dialog on the re-triggered save
        // after the user has already confirmed once.
        let isConfirmed = false;

        const pageInit = (context) => {
            try {
                const cr = context.currentRecord;

                const dept = cr.getField({ fieldId: 'department' });
                const loc = cr.getField({ fieldId: 'location' });

                dept.isMandatory = true;
                loc.isMandatory = true;

                // Class is optional - no mandatory flag set intentionally.

            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error occured in pageInit function.'
                });
            }
        };

        const fieldChanged = (context) => {
            try {
                const cr = context.currentRecord;
                const username = runtime.getCurrentUser().name;

                // Customer selected - auto memo + remove old Discount line
                if (context.fieldId === 'entity') {
                    const name = cr.getText({ fieldId: 'entity' });

                    if (name) {
                        cr.setValue({
                            fieldId: 'memo',
                            value: `This record creating for ${name}, by ${username}.`
                        });
                    }

                    const lineCount = cr.getLineCount({ sublistId: 'item' });

                    for (let i = lineCount - 1; i >= 0; i--) {
                        const itemText = cr.getSublistText({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });

                        if (itemText === 'Discount') {
                            cr.removeLine({ sublistId: 'item', line: i });
                        }
                    }
                }

                // Sales Rep empty warning
                if (context.fieldId === 'salesrep') {
                    const salesRep = cr.getValue({ fieldId: 'salesrep' });

                    if (!salesRep) {
                        message.create({
                            type: message.Type.WARNING,
                            title: 'Sales Rep Missing',
                            message: 'Sales Rep field is empty.'
                        }).show({ duration: 5000 });
                    }
                }
                return true;
            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error occured in fieldChanged function.'
                });
            }
        };

        const validateField = (context) => {
            try {
                const cr = context.currentRecord;

                if (context.fieldId === 'entity') {
                    const customerId = cr.getValue({ fieldId: 'entity' });

                    if (!customerId) {
                        return true;
                    }

                    const lookup = search.lookupFields({
                        type: search.Type.CUSTOMER,
                        id: customerId,
                        columns: ['isinactive']
                    });

                    if (lookup.isinactive) {
                        dialog.alert({
                            title: 'Customer Alert',
                            message: 'Selected Customer is inactive. Please choose another customer.'
                        });
                        return false;
                    }
                } return true;
            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error occured in validateField function.'
                });
                return true;
            }
        };

        const validateLine = (context) => {
            try {
                if (context.sublistId !== 'item') {
                    return true;
                }

                const cr = context.currentRecord;

                const qty = cr.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity'
                });

                const rate = cr.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate'
                });

                const amount = cr.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount'
                });

                const description = cr.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'description'
                });

                // Default quantity to 1 if blank
                if (!qty) {
                    cr.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: 1
                    });
                } else if (qty < 1 || qty > 100) {
                    dialog.alert({
                        title: 'Quantity Alert',
                        message: 'Quantity must be between 1 and 100.'
                    });
                    return false;
                }

                if (rate <= 0) {
                    dialog.alert({
                        title: 'Rate Alert',
                        message: 'Rate must be greater than zero.'
                    });
                    return false;
                }

                if (!description) {
                    dialog.alert({
                        title: 'Description Required',
                        message: 'Description cannot be empty.'
                    });
                    return false;
                }

                if (amount > 25000) {
                    message.create({
                        type: message.Type.WARNING,
                        title: 'High Amount',
                        message: `Line amount (${amount}) exceeds 25,000.`
                    }).show({ duration: 7000 });
                }

                return true;
            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error occured in validateLine function.'
                });
                return true;
            }
        };

        const sublistChanged = (context) => {
            try {
                if (context.sublistId !== 'item') {
                    return true;
                }

                const cr = context.currentRecord;
                const currentLine = context.line;

                const currentItem = cr.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: currentLine
                });

                if (!currentItem) {
                    return true;
                }

                const lineCount = cr.getLineCount({ sublistId: 'item' });

                for (let i = 0; i < lineCount; i++) {
                    if (i === currentLine) {
                        continue;
                    }

                    const itemAtLine = cr.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    if (itemAtLine === currentItem) {
                        dialog.alert({
                            title: 'Duplicate Item',
                            message: 'You are not able to select a duplicate item.'
                        });

                        cr.removeLine({ sublistId: 'item', line: currentLine });
                        return false;
                    }
                }

                log.debug({
                    title: 'Sublist Changed',
                    details: `Current line count: ${lineCount}`
                });

                return true;
            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error occured in sublistChanged function.'
                });
                return true;
            }
        };

        const saveRecord = (context) => {
            try {
                const cr = context.currentRecord;

                // Customer mandatory
                const customerId = cr.getValue({ fieldId: 'entity' });
                if (!customerId) {
                    dialog.alert({
                        title: 'Customer Required',
                        message: 'Please select a Customer before saving.'
                    });
                    return false;
                }

                // Location mandatory
                const locationId = cr.getValue({ fieldId: 'location' });
                if (!locationId) {
                    dialog.alert({
                        title: 'Location Required',
                        message: 'Location is mandatory.'
                    });
                    return false;
                }

                // Memo mandatory
                const memo = cr.getValue({ fieldId: 'memo' });
                if (!memo) {
                    dialog.alert({
                        title: 'Memo Required',
                        message: 'Memo is mandatory.'
                    });
                    return false;
                }

                // At least 2 items
                const lineCount = cr.getLineCount({ sublistId: 'item' });
                if (lineCount < 2) {
                    dialog.alert({
                        title: 'Insufficient Items',
                        message: 'Please add at least 2 items.'
                    });
                    return false;
                }

                // Total amount not less than 500
                const total = cr.getValue({ fieldId: 'total' });
                if (total < 500) {
                    dialog.alert({
                        title: 'Amount Too Low',
                        message: 'Total amount cannot be less than 500.'
                    });
                    return false;
                }

                // If already confirmed via dialog, allow the save through
                if (isConfirmed) {
                    isConfirmed = false;

                    message.create({
                        type: message.Type.CONFIRMATION,
                        title: 'Order Placed',
                        message: 'Your order has been saved successfully.'
                    }).show({ duration: 5000 });

                    console.log(new Date());
                    return true;
                }

                // First pass - show confirm dialog, block this save attempt,
                // then re-trigger save programmatically if user confirms.
                dialog.confirm({
                    title: 'Confirm Sales Order',
                    message: 'Are you sure you want to save this Sales Order?'
                }).then((result) => {
                    if (result) {
                        isConfirmed = true;
                        cr.save();
                    } else {
                        isConfirmed = false;
                    }
                }).catch((err) => {
                    log.debug({
                        title: 'Error occured in confirm dialog',
                        details: err
                    });
                });

                return false;

            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error occured in saveRecord function.'
                });
                return false;
            }
        };

        return {
            pageInit,
            fieldChanged,
            validateField,
            validateLine,
            sublistChanged,
            saveRecord
        };
    });