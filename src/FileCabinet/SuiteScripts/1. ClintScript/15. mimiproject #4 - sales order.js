// Ek company ne Sales Order ke liye strict business rules banaye hain.
// Implement all of the following:

// Customer Section
// Customer select hote hi Memo auto-generate karo.
// Customer change hone par purana Discount Item (agar ho) remove kar do.
// Agar Customer inactive ho to order continue na hone do.
// Agar Sales Rep empty ho to warning dikhao.


// Header Section
// Location mandatory hai.
// Department mandatory hai.


// Item Section

// Item line me:
// Quantity 1–100 ke beech honi chahiye.
// Rate negative ya zero nahi hona chahiye.
// Amount ₹25,000 se jyada ho to sirf warning dikhao.
// Description empty ho to line allow mat karo.
// Duplicate item add nahi hone dena. (sublistChanged)
// Item select karte hi default quantity 1 set karo agar blank ho.

// Before Save

// At least 2 items hone chahiye. (sr)
// Total amount ₹500 se kam nahi hona chahiye. (sr)
// Memo mandatory. 
// Customer mandatory.
// Location mandatory.
// Confirm dialog dikhao. 
// Agar user Cancel kare to save cancel ho.
// After Successful Validation
// User ko confirmation message dikhao.
// Console me current date/time log karo.

// Extra Challenge (Interview Twist)

// Implement these also:

// Agar user item line delete kare to warning dikhao.
// Agar nayi line insert kare to information message dikhao.
// Agar sublist me koi bhi change ho to console me line count print karo.
// Agar user kisi mandatory field ko blank chhodkar bahar nikle to warning dikhao.
// Agar page reload ho aur memo already filled ho to "Existing Draft Loaded" message dikhao.


// Rules
// ❌ Main nahi bataunga kaunsa entry point use karna hai.
// ❌ Internet ya AI solution copy mat karna.
// ✅ Sirf N/ui/message, N/ui/dialog, N/runtime, aur currentRecord APIs ka use karo (jitna zaroori ho).
// ✅ Clean code likho (const cr = context.currentRecord jaisi style use karo).
// ✅ Har validation ka proper return true / return false maintain karo.
define(['N/runtime', 'N/search', 'N/ui/dialog', 'N/ui/message', 'N/log'],
    (runtime, search, dialog, message, log) => {
 
        const pageInit = (context) => {
            try {
                const cr = context.currentRecord;
 
                const dipt = cr.getField({ fieldId: 'department' });
                const loc = cr.getField({ fieldId: 'location' });
 
                dipt.isMandatory = true;
                loc.isMandatory = true;
 
            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error Occured in pageInit function.....!'
                });
            }
        };
 
        const saveRecord = (context) => {
            try {
                const cr = context.currentRecord;
 
                // At least 2 items hone chahiye. (sr)
                // Total amount ₹500 se kam nahi hona chahiye. (sr)
                // Memo mandatory.
                // Customer mandatory.
                // Location mandatory.
                // Confirm dialog dikhao.
                // Agar user Cancel kare to save cancel ho.
                // After Successful Validation
                // User ko confirmation message dikhao.
                // Console me current date/time log karo.
 
                const total_amount = cr.getValue({ fieldId: 'total' });
 
                if (total_amount < 500) {
                    dialog.alert({
                        title: 'Amount are less than 500 rupees',
                        message: 'Amount are less than 500 rupees'
                    });
                    return false;
                }
 
                const lineCount = cr.getLineCount({ sublistId: 'item' });
 
                if (lineCount < 2) {
                    dialog.alert('Please select at List 2 Items.....!');
                    return false;
                }
 
                const Sales_Rep = cr.getText({ fieldId: 'salesrep' });
 
                if (!Sales_Rep) {
                    message.create({
                        type: message.Type.WARNING,
                        title: 'Sales Field is not filled.',
                        message: ''
                    }).show({ duration: 5000 });
                }
 
                if (!cr.getField({ fieldId: 'memo' }).isMandatory) {
                    return false;
                }
 
                if (!cr.getField({ fieldId: 'entity' }).isMandatory) {
                    return false;
                }
 
                if (!cr.getField({ fieldId: 'location' }).isMandatory) {
                    return false;
                }
 
                // Confirm dialog dikhao.
                // Agar user Cancel kare to save cancel ho.
 
                dialog.confirm({
                    title: 'Confirmation dialog',
                    message: 'You want to confirm Sales order....!'
                }).then((result) => {
                    return result ? true : false;
                }).catch((err) => {
                    log.debug({
                        title: 'Error Occured save confirm message',
                        details: err
                    });
                });
 
                // After Successful Validation
                // User ko confirmation message dikhao.
                // Console me current date/time log karo.
 
                message.create({
                    type: message.Type.CONFIRMATION,
                    title: 'Order Placed',
                    message: 'Your order has been passed successfully...............!'
                }).show({ duration: 5000 });
 
                console.log(new Date());
                return true;
 
            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error Are occured in saveRecord Function...!'
                });
            }
        };
 
        const validateField = (context) => {
            try {
                if (context.fieldId === 'entity') {
                    const cr = context.currentRecord;
                    const CustomerId = cr.getValue({ fieldId: 'entity' });
 
                    const lookup = search.lookupFields({
                        type: search.Type.CUSTOMER,
                        id: CustomerId,
                        columns: ['isinactive']
                    });
 
                    if (lookup.isinactive) {
                        dialog.alert({
                            title: 'Customer Alert',
                            message: 'Customer are inactive'
                        });
                        return false;
                    }
                }
            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error Are occured in validateField Function...!'
                });
            }
 
            return true;
        };
 
        const fieldChanged = (context) => {
            try {
                const cr = context.currentRecord;
                const username = runtime.getCurrentUser().name;
 
                if (context.fieldId === 'entity') {
                    const name = cr.getText({ fieldId: 'entity' });
 
                    cr.setValue({
                        fieldId: 'memo',
                        value: `This record creating for ${name}, by ${username}.`
                    });
 
                    const lineCount = cr.getLineCount({ sublistId: 'item' });
 
                    for (let i = 0; i < lineCount; i++) {
                        const itemText = cr.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
 
                        if (itemText === 'Discount') {
                            cr.removeLine({ sublistId: 'item', line: i });
                        }
                    }
                }
                return true;
            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error Are occured in fieldChanged Function...!'
                });
            }
        };
 
        const sublistChanged = (context) => {
            // Duplicate item add nahi hone dena. (sublistChanged)
            try {
                if (context.sublistId === 'item') {
                    const cr = context.currentRecord;
                    const line_count = cr.getLineCount({ sublistId: 'item' });
 
                    let preItem = '';
                    let items = '';
 
                    for (let i = 0; i <= line_count; i++) {
                        items = cr.getSublistText({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        preItem = items;
                    }
 
                    if (preItem === items) {
                        dialog.alert({
                            title: 'Your not able to select dublicate...!',
                            message: ''
                        });
                        return false;
                    }
                }
                return true;
            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error Are occured in sublistChanged Function...!'
                });
            }
        };
 
        const validateLine = (context) => {
            // Quantity 1–100 ke beech honi chahiye.
            // Rate negative ya zero nahi hona chahiye.
            // Amount ₹25,000 se jyada ho to sirf warning dikhao.
            // Description empty ho to line allow mat karo.
            // Item select karte hi default quantity 1 set karo agar blank ho.
 
            try {
                if (context.sublistId === 'item') {
                    const cr = context.currentRecord;
 
                    const qut = cr.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    });
 
                    const rate = cr.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate'
                    });
 
                    const Amount = cr.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount'
                    });
 
                    const Description = cr.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'description'
                    });
 
                    if (qut === 0) {
                        cr.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: 1
                        });
                    }
 
                    if (qut < 1 || qut > 100) {
                        dialog.alert({
                            title: 'quantity Alert',
                            message: 'Quantity must be in between the 1-100'
                        });
                        return false;
                    }
 
                    if (rate <= 0) {
                        dialog.alert({
                            title: 'rate Alert.',
                            message: 'Rate must be greater than Zero.....!'
                        });
                        return false;
                    }
 
                    if (Amount > 25000) {
                        message.create({
                            type: message.Type.WARNING,
                            title: 'Amount Validation',
                            message: `Amount is greater then ${Amount}`
                        }).show({ duration: 7000 });
 
                        return true;
                    }
 
                    if (!Description) {
                        dialog.alert({
                            title: 'Description must be fille....!',
                            message: 'Description must be fille....!'
                        });
                        return false;
                    }
 
                    return true;
                }
            } catch (err) {
                log.debug({
                    title: err,
                    details: 'Error Are occured in validateLine Function...!'
                });
            }
        };
 
        const postSourcing = (context) => {};
        const validateDelete = (context) => {};
        const validateInsert = (context) => {};
        const lineInit = (context) => {};
 
        return {
            pageInit,
            saveRecord,
            validateField,
            fieldChanged,
            // postSourcing,
            // lineInit,
            // validateDelete,
            // validateInsert,
            validateLine,
            sublistChanged
        };
    });